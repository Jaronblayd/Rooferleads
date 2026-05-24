export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { city, state, nicheQuery } = req.body ?? {};
  if (!city || !state) return res.status(400).json({ error: "city and state are required" });

  const APIFY_TOKEN = process.env.APIFY_TOKEN;
  if (!APIFY_TOKEN) return res.status(500).json({ error: "APIFY_TOKEN not configured" });

  const query = `${nicheQuery ?? "contractors"} in ${city}, ${state}`;

  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchStringsArray: [query],
          maxCrawledPlacesPerSearch: 40,
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

    let status = "RUNNING";
    let attempts = 0;
    while (["RUNNING","READY","STARTED"].includes(status) && attempts < 17) {
      await sleep(3000);
      attempts++;
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      const statusData = await statusRes.json();
      status = statusData.data?.status ?? "FAILED";
    }

    if (status !== "SUCCEEDED") {
      return res.status(502).json({ error: `Actor ended with status: ${status}.` });
    }

    const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=20`);
    if (!itemsRes.ok) return res.status(502).json({ error: "Failed to fetch dataset" });

    const items = await itemsRes.json();
    const results = items.filter(p => p.title).map(p => ({
      name: p.title,
      address: p.address ?? p.street ?? "—",
      phone: p.phone ?? p.phoneUnformatted ?? "—",
      website: p.website ?? null,
      rating: p.totalScore ?? p.rating ?? null,
      reviews: p.reviewsCount ?? p.userRatingsTotal ?? 0,
      specialty: p.categoryName ?? p.categories?.[0] ?? "Contractor",
      placeUrl: p.url ?? null,
    }));

    return res.status(200).json({ results });

  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ error: err.message ?? "Unexpected server error" });
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
