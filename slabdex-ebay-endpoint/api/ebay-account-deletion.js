import crypto from "crypto";

export default function handler(req, res) {
  const verificationToken = "slabdexverificationtoken1234567890";
  const endpoint = "https://slabdex-ashy.vercel.app/api/ebay-account-deletion";

  const challengeCode = req.query.challenge_code || "";

  const challengeResponse = crypto
    .createHash("sha256")
    .update(challengeCode)
    .update(verificationToken)
    .update(endpoint)
    .digest("hex");

  res.setHeader("Content-Type", "application/json");
  res.status(200).json({ challengeResponse });
}
