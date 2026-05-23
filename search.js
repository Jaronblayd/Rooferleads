// api/search.js — Vercel Serverless Function
// Sits between your frontend and Apify. API key never exposed to the browser.

export const config = { maxDuration: 60 }; // Vercel Pro allows up to 60s; free tier = 10s

export default async function handler(req, res) {
  // CORS — allow your frontend domain in production
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { city, state } = req.body ?? {};
  if (!city || !state) return res.status(400).json({ error: "city and state are required" });

  const APIFY_TOKEN = process.env.APIFY_TOKEN; // set in Vercel dashboard
  if (!APIFY_TOKEN) return res.status(500).json({ error: "APIFY_TOKEN not configured" });

  const query = `roofing contractors in ${city}, ${state}`;

  try {
    // 1. Start the actor run
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchStringsArray: [query],
          maxCrawledPlacesPerSearch: 20,
          language: "en",
          countryCode: "us",
        }),
      }
    );

    if (!runRes.ok) {
      const text = await runRes.text();
      return res.status(502).json({ error: `Apify start failed: ${runRes.status}`, detail: text });
    }

    const runData = await runRes.json();
    const runId = runData.data?.id;
    const datasetId = runData.data?.defaultDatasetId;
    if (!runId) return res.status(502).json({ error: "No run ID from Apify" });

    // 2. Poll until finished (max ~55s to stay within Vercel limit)
    let status = "RUNNING";
    let attempts = 0;
    const maxAttempts = 17; // 17 × 3s = 51s

    while (["RUNNING", "READY", "STARTED"].includes(status) && attempts < maxAttempts) {
      await sleep(3000);
      attempts++;
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
      );
      const statusData = await statusRes.json();
      status = statusData.data?.status ?? "FAILED";
    }

    if (status !== "SUCCEEDED") {
      return res.status(502).json({ error: `Actor ended with status: ${status}. Try a larger city.` });
    }

    // 3. Fetch results
    const itemsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=20`
    );
    if (!itemsRes.ok) return res.status(502).json({ error: "Failed to fetch dataset" });

    const items = await itemsRes.json();

    // 4. Normalize to our schema
    const results = items
      .filter(p => p.title)
      .map(p => ({
        name: p.title,
        address: p.address ?? p.street ?? "—",
        phone: p.phone ?? p.phoneUnformatted ?? "—",
        website: p.website ?? null,
        rating: p.totalScore ?? p.rating ?? null,
        reviews: p.reviewsCount ?? p.userRatingsTotal ?? 0,
        specialty: p.categoryName ?? p.categories?.[0] ?? "Roofing",
        placeUrl: p.url ?? null,
      }));

    return res.status(200).json({ results });

  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ error: err.message ?? "Unexpected server error" });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
