# How to Fill Out the eBay Marketplace Account Deletion Form

## ⚠️ IMPORTANT: Deploy First!

Before filling out this form, you **MUST** deploy your Vercel endpoint first. Here's why:

1. You need the actual Vercel URL to enter in the form
2. You need to update that URL in the code before final deployment
3. eBay will immediately test the endpoint when you click "Save"

## 🚀 Quick Deployment Steps

### Step 1: Deploy to Vercel
```bash
cd C:\Users\fatma\Desktop\slabdex-ebay-endpoint
vercel
```

You'll get a URL like: `https://slabdex-ebay-endpoint-xxxxx.vercel.app`

### Step 2: Update the Code
Open `api/ebay-account-deletion.js` and change line 5 from:
```javascript
const endpoint = "https://YOUR-VERCEL-DOMAIN.vercel.app/api/ebay-account-deletion";
```

To your actual URL:
```javascript
const endpoint = "https://slabdex-ebay-endpoint-xxxxx.vercel.app/api/ebay-account-deletion";
```

### Step 3: Redeploy to Production
```bash
vercel --prod
```

### Step 4: Test It
Open in browser (replace with your domain):
```
https://slabdex-ebay-endpoint-xxxxx.vercel.app/api/ebay-account-deletion?challenge_code=test123
```

You should see: `{"challengeResponse":"...some long hash..."}`

---

## 📝 Now Fill Out the eBay Form

### Field 1: "Exempted from Marketplace Account Deletion" Toggle
**Leave this OFF** (unless you're truly not storing any eBay user data)

### Field 2: "Email to notify if marketplace account deletion notification endpoint is down"
**Enter your email:** `nonflamable789@gmail.com` (or whatever email you want to use)

### Field 3: "Marketplace account deletion notification endpoint"
**Enter your deployed Vercel URL:**
```
https://slabdex-ebay-endpoint-xxxxx.vercel.app/api/ebay-account-deletion
```
⚠️ Replace `xxxxx` with your actual Vercel domain!

### Field 4: "Verification token"
**Enter exactly:**
```
slabdexverificationtoken1234567890
```

---

## ✅ Click "Save"

When you click Save, eBay will:
1. Send a `challenge_code` to your endpoint
2. Your endpoint will compute the SHA-256 hash
3. eBay will verify the response matches their calculation
4. If successful, the form will save ✅

---

## 🆘 If You Get an Error

The error message in your screenshot says:
> "Marketplace account deletion notification endpoint settings save unsuccessful. Try again later"

This usually means:
1. ❌ The endpoint URL is wrong or not deployed
2. ❌ The endpoint variable in the code doesn't match the URL you entered
3. ❌ You didn't redeploy after updating the code
4. ❌ The verification token doesn't match

**Solution:** Make sure you completed Steps 1-4 above before filling out the form!

---

## 🎯 Quick Reference

| Field | Value |
|-------|-------|
| **Endpoint** | `https://YOUR-ACTUAL-VERCEL-URL.vercel.app/api/ebay-account-deletion` |
| **Token** | `slabdexverificationtoken1234567890` |
| **Email** | Your notification email |
| **Exemption Toggle** | OFF (unless not storing eBay data) |

---

## 💡 Alternative: Use the Exemption Toggle

If SlabDex is **not storing any eBay user data yet**, you can:
1. Turn ON the "Exempted from Marketplace Account Deletion" toggle
2. Leave the endpoint and token fields empty
3. Click Save

This will unlock your eBay keyset without needing a live endpoint, but **only use this if you're truly not persisting any eBay user data**.
