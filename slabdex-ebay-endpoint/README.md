# eBay Account Deletion Endpoint for SlabDex

This Vercel serverless function handles eBay's marketplace account deletion notification endpoint with proper challenge-response validation.

## 📁 Project Structure

```
slabdex-ebay-endpoint/
├── api/
│   └── ebay-account-deletion.js  # Serverless function
├── package.json                   # Project configuration
└── README.md                      # This file
```

## 🚀 Deployment Instructions

### 1. Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
```

### 2. Initial Deployment

Navigate to the project folder and deploy:

```bash
cd slabdex-ebay-endpoint
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No
- **Project name?** slabdex-ebay-endpoint (or press Enter)
- **Directory?** ./ (press Enter)
- **Override settings?** No (press Enter)

After deployment, Vercel will give you a URL like:
```
https://slabdex-ebay-endpoint-xxxxx.vercel.app
```

### 3. Update the Endpoint URL

Open `api/ebay-account-deletion.js` and replace this line:

```javascript
const endpoint = "https://YOUR-VERCEL-DOMAIN.vercel.app/api/ebay-account-deletion";
```

With your actual deployed URL:

```javascript
const endpoint = "https://slabdex-ebay-endpoint-xxxxx.vercel.app/api/ebay-account-deletion";
```

### 4. Redeploy to Production

```bash
vercel --prod
```

## 🧪 Testing the Endpoint

Before submitting to eBay, test your endpoint by opening this URL in your browser (replace with your actual domain):

```
https://slabdex-ebay-endpoint-xxxxx.vercel.app/api/ebay-account-deletion?challenge_code=test123
```

**Expected Response:**
```json
{"challengeResponse":"...longhash..."}
```

If you see the JSON response with a long hash, the endpoint is working correctly! ✅

## 📝 eBay Developer Portal Configuration

Once your endpoint is deployed and tested, enter these values in the eBay Developer Portal:

### Marketplace account deletion notification endpoint
```
https://slabdex-ebay-endpoint-xxxxx.vercel.app/api/ebay-account-deletion
```
*(Replace with your actual Vercel domain)*

### Verification token
```
slabdexverificationtoken1234567890
```

## 🔐 How It Works

1. **eBay sends a challenge:** When you save the endpoint in eBay's portal, eBay sends a `challenge_code` query parameter
2. **Your endpoint computes the hash:** The function creates a SHA-256 hash of:
   - `challengeCode` + `verificationToken` + `endpoint` (in that exact order)
3. **Returns JSON response:** The hash is returned as `{"challengeResponse": "hash"}`
4. **eBay validates:** If the hash matches eBay's calculation, the endpoint is verified ✅

## 📋 Requirements Met

- ✅ HTTPS endpoint (Vercel provides this automatically)
- ✅ Verification token: 32-80 characters (40 characters)
- ✅ Allowed characters: letters, numbers, underscores, hyphens
- ✅ Returns `application/json` content type
- ✅ Computes SHA-256 hash in correct order

## 🆘 Troubleshooting

**If eBay validation fails:**
1. Make sure you updated the `endpoint` variable in the code with your actual Vercel URL
2. Verify you redeployed with `vercel --prod` after updating the URL
3. Test the endpoint manually with the browser test above
4. Ensure the endpoint URL in eBay matches exactly (including `/api/ebay-account-deletion`)
5. Double-check the verification token is exactly: `slabdexverificationtoken1234567890`

## 💡 Alternative: Exemption Toggle

If SlabDex is not persisting any eBay user data yet, eBay offers an exemption toggle for marketplace account deletion notifications. This can unlock your keyset without a live endpoint, but **only use it if you're truly not storing eBay user data**.

## 🌐 Why This Works (and webhook.site doesn't)

eBay requires the endpoint to:
- Actively compute the challenge hash
- Return it as JSON with `application/json` content type

Passive webhook receivers like webhook.site can receive requests but don't compute and return the required hash, so they fail eBay's validation.
