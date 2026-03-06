// eBay OAuth token cache
const tokenCache = { token: null, expiresAt: 0 };

/**
 * Get cached OAuth token or fetch a new one
 */
export async function getEbayToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now) {
    return tokenCache.token;
  }

  const clientId = Deno.env.get('EBAY_CLIENT_ID');
  const clientSecret = Deno.env.get('EBAY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('eBay credentials not configured (EBAY_CLIENT_ID, EBAY_CLIENT_SECRET)');
  }

  const authString = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
  });

  if (!response.ok) {
    throw new Error(`eBay OAuth failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = now + (data.expires_in * 1000 * 0.9); // Refresh at 90%

  return data.access_token;
}

/**
 * Search eBay for slab listings with fallback queries
 */
export async function searchSlabListings(searchParams) {
  const { gradingCompany, grade, cardName, cardNumber, setName } = searchParams;

  const queries = [
    `${gradingCompany} ${grade} ${cardName}${cardNumber ? ` ${cardNumber}` : ''}${setName ? ` ${setName}` : ''}`,
    `${gradingCompany} ${grade} ${cardName}`,
    `${cardName} ${cardNumber || ''}`,
    `${cardName} graded`
  ].filter(q => q.trim());

  let results = [];

  for (const query of queries) {
    const listings = await searchBrowseAPI(query.trim(), gradingCompany, grade);
    if (listings.length > 0) {
      results = listings;
      break;
    }
  }

  return normalizeResults(results);
}

/**
 * Call eBay Browse API
 */
async function searchBrowseAPI(query, gradingCompany, grade) {
  const token = await getEbayToken();

  const params = new URLSearchParams({
    'q': query,
    'sort': 'newlyListed',
    'limit': '50'
  });

  const response = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    }
  );

  if (!response.ok) {
    console.warn(`eBay API error for query "${query}": ${response.status}`);
    return [];
  }

  const data = await response.json();
  const items = data.itemSummaries || [];

  // Filter for slab listings
  return items
    .filter(item => {
      const titleLower = item.title.toLowerCase();
      return titleLower.includes(gradingCompany.toLowerCase()) &&
             titleLower.includes(grade.toLowerCase());
    })
    .map(item => ({
      title: item.title,
      itemId: item.itemId,
      itemWebUrl: item.itemWebUrl,
      imageUrl: item.image?.imageUrl,
      price: parseFloat(item.price?.value || 0),
      currency: item.price?.currency,
      condition: item.condition,
      seller: item.seller?.username,
      listingDate: item.itemEndDate || new Date().toISOString()
    }))
    .filter(item => item.price > 0)
    .sort((a, b) => new Date(b.listingDate).getTime() - new Date(a.listingDate).getTime());
}

/**
 * Normalize results and calculate price analytics
 */
function normalizeResults(listings) {
  if (listings.length === 0) {
    return {
      sales: [],
      lastSalePrice: null,
      averagePrice: null,
      medianPrice: null
    };
  }

  const prices = listings.map(l => l.price).sort((a, b) => a - b);
  const sum = prices.reduce((a, b) => a + b, 0);
  const median = prices.length % 2 === 0
    ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
    : prices[Math.floor(prices.length / 2)];

  return {
    sales: listings.slice(0, 4).map(({ title, price, itemWebUrl, listingDate }) => ({
      title,
      price,
      url: itemWebUrl,
      date: listingDate
    })),
    lastSalePrice: parseFloat(listings[0].price.toFixed(2)),
    averagePrice: parseFloat((sum / prices.length).toFixed(2)),
    medianPrice: parseFloat(median.toFixed(2))
  };
}