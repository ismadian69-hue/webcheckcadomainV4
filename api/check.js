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

    /* ==========================
       VIRUSTOTAL REQUEST
    ========================== */

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

    /* ==========================
       CATEGORY
    ========================== */

    let category = "Website";

    if (attr.categories) {
      const vals = Object.values(attr.categories);
      if (vals.length) category = vals[0];
    }

    const cat = category.toLowerCase();

    /* ==========================
       DOMAIN AGE
    ========================== */

    let ageMonths = 0;

    if (attr.creation_date) {
      const created = new Date(attr.creation_date * 1000);
      const now = new Date();

      ageMonths =
        (now.getFullYear() - created.getFullYear()) * 12 +
        (now.getMonth() - created.getMonth());
    }

    /* ==========================
       POPULARITY
    ========================== */

    const popularity = harmless + undetected;

    /* ==========================
       HYBRID SCORE ENGINE
    ========================== */

    let score = 100;

    /* VirusTotal signals */
    score -= malicious * 22;
    score -= suspicious * 12;
    score -= timeout * 4;

    /* Age bonus */
    if (ageMonths >= 120) score += 10;
    else if (ageMonths >= 60) score += 7;
    else if (ageMonths >= 24) score += 4;
    else if (ageMonths <= 6) score -= 15;
    else if (ageMonths <= 12) score -= 8;

    /* Popularity */
    if (popularity >= 70) score += 8;
    else if (popularity >= 30) score += 4;
    else if (popularity <= 5) score -= 10;

    /* Risk categories */
    if (
      cat.includes("gambling") ||
      cat.includes("adult") ||
      cat.includes("porn") ||
      cat.includes("phishing") ||
      cat.includes("malware")
    ) score -= 20;

    if (
      cat.includes("bank") ||
      cat.includes("business") ||
      cat.includes("news") ||
      cat.includes("education")
    ) score += 4;

    /* Domain patterns */
    if (
      cleanDomain.endsWith(".xyz") ||
      cleanDomain.endsWith(".top") ||
      cleanDomain.endsWith(".click")
    ) score -= 12;

    if (cleanDomain.endsWith(".com")) score += 3;

    if (cleanDomain.length > 28) score -= 6;

    if (/[0-9]{4,}/.test(cleanDomain)) score -= 10;

    /* Clamp */

    if (score > 100) score = 100;
    if (score < 0) score = 0;

    /* ==========================
       REPUTATION LABEL
    ========================== */

    let reputation = "Safe";

    if (score >= 90) reputation = "Excellent";
    else if (score >= 75) reputation = "Trustworthy";
    else if (score >= 55) reputation = "Low Risk";
    else if (score >= 35) reputation = "Suspicious";
    else reputation = "Dangerous";

    /* ==========================
       DATE FORMAT
    ========================== */

    const creationDate = attr.creation_date
      ? new Date(attr.creation_date * 1000)
          .toISOString()
          .slice(0, 10)
      : "-";

    const lastAnalysis = attr.last_analysis_date
      ? new Date(attr.last_analysis_date * 1000)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19)
      : "-";

    /* ==========================
       RESPONSE
    ========================== */

    return res.status(200).json({
      domain: cleanDomain,
      status: "Online",

      category,
      reputation,
      score,

      age_months: ageMonths,
      creation_date: creationDate,
      popularity,

      detections: {
        harmless,
        malicious,
        suspicious,
        undetected,
        timeout
      },

      registrar: attr.registrar || "-",
      last_analysis: lastAnalysis
    });

  } catch (error) {
    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
