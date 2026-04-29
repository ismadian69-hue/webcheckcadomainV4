export default async function handler(req, res) {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({ error: "Missing domain" });
    }

    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .trim();

    const apiKey = process.env.VT_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing VirusTotal API key"
      });
    }

    const response = await fetch(
      `https://www.virustotal.com/api/v3/domains/${cleanDomain}`,
      {
        headers: {
          "x-apikey": apiKey
        }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "VirusTotal request failed"
      });
    }

    const json = await response.json();

    const attr = json.data.attributes || {};
    const stats = attr.last_analysis_stats || {};

    const harmless = stats.harmless || 0;
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const undetected = stats.undetected || 0;
    const timeout = stats.timeout || 0;

    let score = 100;

    score -= malicious * 25;
    score -= suspicious * 15;
    score -= timeout * 5;

    if (score < 0) score = 0;
    if (score > 100) score = 100;

    let reputation = "Safe";

    if (malicious >= 3) reputation = "Dangerous";
    else if (malicious >= 1 || suspicious >= 2) reputation = "Suspicious";
    else if (score < 70) reputation = "Neutral";
    else reputation = "Safe";

    let category = "Website";

    if (attr.categories) {
      const vals = Object.values(attr.categories);
      if (vals.length) category = vals[0];
    }

    const whoisDate = attr.creation_date
      ? new Date(attr.creation_date * 1000).toISOString().slice(0, 10)
      : "-";

    return res.status(200).json({
      domain: cleanDomain,
      status: "Online",
      category,
      reputation,
      score,

      detections: {
        harmless,
        malicious,
        suspicious,
        undetected,
        timeout
      },

      registrar: attr.registrar || "-",
      creation_date: whoisDate,
      last_analysis: attr.last_analysis_date
        ? new Date(attr.last_analysis_date * 1000)
            .toISOString()
            .replace("T", " ")
            .slice(0, 19)
        : "-"
    });

  } catch (error) {
    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
