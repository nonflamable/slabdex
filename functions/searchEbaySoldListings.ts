import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const tokenCache = { token: null, expiresAt: 0 };
const resultCache = new Map(); // Cache search results to avoid duplicate API calls
const CACHE_TTL = 3600000; // 1 hour

async function getEbayToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now) {
    return tokenCache.token;
  }

  const clientId = Deno.env.get('EBAY_CLIENT_ID');
  const clientSecret = Deno.env.get('EBAY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('eBay credentials not configured');
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
    throw new Error(`OAuth failed: ${response.status}`);
  }

  const data = await response.json();
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = now + (data.expires_in * 1000 * 0.9);

  return data.access_token;
}

// Build fallback search queries with decreasing specificity
function buildSoldSearchQueries(cardName, cardNumber, gradingCompany, grade) {
  const queries = [];
  
  // Primary: Grading company + grade + card name + card number
  if (cardNumber) {
    queries.push(`${gradingCompany} ${grade} ${cardName} ${cardNumber}`);
  }
  
  // Fallback 1: Card name + card number + grading company + grade
  if (cardNumber) {
    queries.push(`${cardName} ${cardNumber} ${gradingCompany} ${grade}`);
  }
  
  // Fallback 2: Card name + grading company + grade
  queries.push(`${cardName} ${gradingCompany} ${grade}`);
  
  // Fallback 3: Card name + card number
  if (cardNumber) {
    queries.push(`${cardName} ${cardNumber}`);
  }
  
  // Fallback 4: Card name alone
  queries.push(cardName);
  
  return queries;
}

// Search for sold listings using eBay Browse API
async function searchSoldListingsViaAPI(query) {
  try {
    const token = await getEbayToken();

    // Use Browse API to search - it's the official modern endpoint
    const params = new URLSearchParams({
      'q': query,
      'sort': '-endDate',
      'limit': '100'
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
      console.warn(`Browse API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const items = data.itemSummaries || [];

    const results = [];
    for (const item of items) {
      const title = item.title || '';
      const price = parseFloat(item.price?.value || '0');
      const itemId = item.itemId || '';
      const url = item.itemWebUrl || `https://www.ebay.com/itm/${itemId}`;
      const endDate = item.itemEndDate || new Date().toISOString();

      if (title && price > 0 && price < 100000 && itemId) {
        results.push({
          title,
          price,
          saleDate: endDate,
          url
        });
      }
    }

    return results;
  } catch (error) {
    console.warn(`Error querying eBay Browse API for "${query}": ${error.message}`);
    return [];
  }
}

// Rank sold results by match quality
function rankResultsByMatchQuality(results, cardName, cardNumber, gradingCompany, grade) {
  const cardNameLower = cardName.toLowerCase().trim();
  const cardNumberLower = cardNumber ? cardNumber.toLowerCase().trim() : '';
  const gradingCompanyLower = gradingCompany.toLowerCase();
  const gradeLower = grade.toLowerCase().replace(/\s+/g, '');

  return results.map(result => {
    const titleLower = result.title.toLowerCase();
    let score = 0;

    // High priority: grading company match (40 points)
    if (titleLower.includes(gradingCompanyLower)) score += 40;

    // High priority: grade match (40 points)
    const titleGradeNormalized = titleLower.replace(/\s+/g, '');
    if (titleGradeNormalized.includes(gradeLower)) score += 40;

    // Medium priority: card name match (20 points)
    if (titleLower.includes(cardNameLower)) score += 20;

    // Medium priority: card number match (20 points)
    if (cardNumberLower && titleLower.includes(cardNumberLower)) score += 20;

    return { ...result, matchScore: score };
  })
  .sort((a, b) => {
    // Primary sort: by match quality (descending)
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    // Secondary sort: by date (newest first)
    return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
  })
  .map(({ matchScore, ...result }) => result); // Remove matchScore from final output
}

// Search sold listings with fallback queries
async function searchSoldListings(cardName, cardNumber, gradingCompany, grade) {
  const queries = buildSoldSearchQueries(cardName, cardNumber, gradingCompany, grade);
  const allResults = [];
  const seenUrls = new Set();

  for (const query of queries) {
    if (allResults.length >= 20) break;

    try {
      const results = await searchSoldListingsViaAPI(query);
      
      if (Array.isArray(results)) {
        for (const result of results) {
          if (!seenUrls.has(result.url) && allResults.length < 20) {
            seenUrls.add(result.url);
            allResults.push(result);
          }
        }
      }
    } catch (error) {
      console.warn(`Query failed: ${query}`, error.message);
    }

    // Longer delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Rank all collected results by match quality
  const rankedResults = rankResultsByMatchQuality(allResults, cardName, cardNumber, gradingCompany, grade);

  return rankedResults.slice(0, 20);
}

async function searchActiveListings(query, cardName, gradingCompany, grade, cardNumber) {
  const token = await getEbayToken();

  const params = new URLSearchParams({
    'q': query,
    'sort': '-endDate',
    'limit': '100'
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
    console.warn(`eBay API error: ${response.status}`);
    return [];
  }

  const data = await response.json();
  const items = data.itemSummaries || [];

  const cardNameLower = cardName.toLowerCase().trim();
  const gradingCompanyLower = gradingCompany.toLowerCase();
  const gradeLower = grade.toLowerCase().replace(/\s+/g, '');
  const cardNumberLower = cardNumber ? cardNumber.toLowerCase().trim() : null;

  return items
    .filter(item => {
      const titleLower = item.title.toLowerCase();
      
      if (!titleLower.includes(cardNameLower)) return false;
      if (!titleLower.includes(gradingCompanyLower)) return false;
      
      const titleGradeNormalized = titleLower.replace(/\s+/g, '');
      if (!titleGradeNormalized.includes(gradeLower)) return false;
      
      if (cardNumberLower && !titleLower.includes(cardNumberLower)) return false;
      
      return true;
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
    .filter(item => item.price > 0 && item.price < 100000)
    .sort((a, b) => new Date(b.listingDate).getTime() - new Date(a.listingDate).getTime());
}

function normalizeResults(recentSales, activeListings) {
  const calculateStats = (items) => {
    if (items.length === 0) {
      return {
        lowestPrice: null,
        averagePrice: null,
        medianPrice: null
      };
    }
    const prices = items.map(i => i.price).sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);
    const median = prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];

    return {
      lowestPrice: parseFloat(prices[0].toFixed(2)),
      averagePrice: parseFloat((sum / prices.length).toFixed(2)),
      medianPrice: parseFloat(median.toFixed(2))
    };
  };

  return {
    recentSales: recentSales.slice(0, 10).map(({ title, price, url, saleDate }) => ({
      title,
      price,
      url,
      saleDate
    })),
    activeListings: activeListings.slice(0, 10).map(({ title, price, itemWebUrl, listingDate }) => ({
      title,
      price,
      url: itemWebUrl,
      listingDate
    })),
    estimatedMarketFromSales: calculateStats(recentSales),
    estimatedMarketFromListings: calculateStats(activeListings),
    dataSource: 'ebay_sold_and_active'
  };
}

async function searchCardComps(searchParams) {
  const { gradingCompany, grade, cardName, cardNumber, setName } = searchParams;

  // Search for sold/completed listings via eBay Shopping API
  const soldResults = await searchSoldListings(cardName, cardNumber, gradingCompany, grade);

  // Search for active listings via Browse API
  const activeQueries = [
    `${gradingCompany} ${grade} ${cardName}${cardNumber ? ` ${cardNumber}` : ''}${setName ? ` ${setName}` : ''}`,
    `${gradingCompany} ${grade} ${cardName}`,
    `${gradingCompany} ${cardName}${cardNumber ? ` ${cardNumber}` : ''}`
  ].filter(q => q.trim());

  let activeResults = [];
  for (const query of activeQueries) {
    const listings = await searchActiveListings(query.trim(), cardName, gradingCompany, grade, cardNumber);
    if (listings.length >= 5) {
      activeResults = listings;
      break;
    }
  }

  return normalizeResults(soldResults, activeResults);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardName, cardNumber, setName, grade, gradingCompany } = await req.json();

    if (!cardName || !grade || !gradingCompany) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await searchCardComps({
      gradingCompany,
      grade,
      cardName,
      cardNumber,
      setName
    });

    return Response.json({
      status: result.recentSales.length > 0 ? 'ok' : 'no_data',
      ...result
    });

  } catch (error) {
    console.error('searchEbaySoldListings error:', error.message);
    return Response.json({
      status: 'error',
      recentSales: [],
      activeListings: [],
      estimatedMarketFromSales: {
        lowestPrice: null,
        averagePrice: null,
        medianPrice: null
      },
      estimatedMarketFromListings: {
        lowestPrice: null,
        averagePrice: null,
        medianPrice: null
      },
      dataSource: 'ebay_sold_and_active',
      error: error.message
    }, { status: 500 });
  }
});