import axios from "axios";

export default async function handler(req, res) {
  const domain = (req.query.domain || "").trim().toLowerCase();

  if (!domain) {
    return res.status(400).json({
      status: "Error",
      category: "-",
      score: 0,
      reputation: "Unknown",
      ssl: "-",
      title: "-"
    });
  }

  try {
    const apiKey = process.env.VT_API_KEY;

    let score = 50;
    let status = "Online";
    let ssl = "-";
    let title = "-";
    let category = "Website";
    let reputation = "Neutral";

    // ---------- VIRUSTOTAL ----------
    if (apiKey) {
      try {
        const id = Buffer.from(domain).toString("base64").replace(/=/g, "");

        const vt = await axios.get(
          `https://www.virustotal.com/api/v3/domains/${domain}`,
          {
            headers: {
              "x-apikey": apiKey
            },
            timeout: 8000
          }
        );

        const data = vt.data.data.attributes || {};

        const stats = data.last_analysis_stats || {};
        const harmless = stats.harmless || 0;
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;
        const undetected = stats.undetected || 0;

        const total = harmless + malicious + suspicious + undetected;

        if (total > 0) {
          score = Math.round((harmless / total) * 100);
        }

        if (malicious > 0) score -= malicious * 15;
        if (suspicious > 0) score -= suspicious * 8;

        if (score < 0) score = 0;
        if (score > 100) score = 100;

        if (data.categories) {
          const vals = Object.values(data.categories);
          if (vals.length) category = vals[0];
        }

        if (data.last_https_certificate) ssl = "Yes";

      } catch (e) {}
    }

    // ---------- TITLE ----------
    try {
      const page = await axios.get(`https://${domain}`, {
        timeout: 6000,
        maxRedirects: 5
      });

      const html = page.data || "";

      const match = html.match(/<title>(.*?)<\/title>/i);
      if (match) title = match[1].trim().slice(0, 70);

      status = "Online";
      ssl = "Yes";

    } catch (e) {
      try {
        const page2 = await axios.get(`http://${domain}`, {
          timeout: 6000,
          maxRedirects: 5
        });

        const html2 = page2.data || "";
        const match2 = html2.match(/<title>(.*?)<\/title>/i);
        if (match2) title = match2[1].trim().slice(0, 70);

        status = "Online";

      } catch (e2) {
        status = "Offline";
      }
    }

    // ---------- SMART CATEGORY ----------
    category = smartCategory(domain, title, category);

    // ---------- EXTRA SCORE ----------
    if (status === "Online") score += 10;
    if (ssl === "Yes") score += 10;
    if (title !== "-") score += 5;

    // risky TLD
    if (
      domain.endsWith(".xyz") ||
      domain.endsWith(".top") ||
      domain.endsWith(".click") ||
      domain.endsWith(".live")
    ) {
      score -= 20;
    }

    // risky keywords
    const risky = [
      "hack",
      "crack",
      "adult",
      "casino",
      "bet",
      "porn",
      "dark",
      "fraud",
      "phish"
    ];

    for (const word of risky) {
      if (domain.includes(word)) score -= 15;
    }

    if (score < 0) score = 0;
    if (score > 100) score = 100;

    // ---------- REPUTATION ----------
    if (score >= 90) reputation = "Excellent";
    else if (score >= 75) reputation = "Trustworthy";
    else if (score >= 55) reputation = "Neutral";
    else if (score >= 35) reputation = "Suspicious";
    else reputation = "Dangerous";

    return res.status(200).json({
      domain,
      status,
      category,
      ssl,
      score,
      reputation,
      title
    });

  } catch (err) {
    return res.status(200).json({
      domain,
      status: "Offline",
      category: "Website",
      ssl: "-",
      score: 0,
      reputation: "Dangerous",
      title: "-"
    });
  }
}

// ---------- CATEGORY ENGINE ----------
function smartCategory(domain, title, oldCat) {
  const txt = (domain + " " + title + " " + oldCat).toLowerCase();

  if (txt.includes("google")) return "Search Engine";
  if (txt.includes("bing")) return "Search Engine";
  if (txt.includes("yahoo")) return "Search Engine";

  if (
    txt.includes("facebook") ||
    txt.includes("instagram") ||
    txt.includes("twitter") ||
    txt.includes("linkedin") ||
    txt.includes("tiktok")
  ) return "Social Media";

  if (
    txt.includes("youtube") ||
    txt.includes("netflix") ||
    txt.includes("spotify")
  ) return "Streaming";

  if (
    txt.includes("github") ||
    txt.includes("gitlab") ||
    txt.includes("developer") ||
    txt.includes("code")
  ) return "Developer";

  if (
    txt.includes("bank") ||
    txt.includes("paypal") ||
    txt.includes("finance") ||
    txt.includes("crypto")
  ) return "Finance";

  if (
    txt.includes("amazon") ||
    txt.includes("shop") ||
    txt.includes("store") ||
    txt.includes("ebay")
  ) return "Ecommerce";

  if (
    txt.includes("news") ||
    txt.includes("reuters") ||
    txt.includes("cnn") ||
    txt.includes("bbc")
  ) return "News";

  if (
    txt.includes("game") ||
    txt.includes("steam") ||
    txt.includes("playstation")
  ) return "Gaming";

  if (
    txt.includes("university") ||
    txt.includes("school") ||
    txt.includes("academy") ||
    txt.includes("edu")
  ) return "Education";

  return oldCat || "Website";
}
