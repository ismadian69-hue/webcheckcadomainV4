export default async function handler(req, res) {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({
        status: "Error",
        category: "-",
        ssl: "-",
        title: "-",
        score: 0,
        reputation: "Unknown"
      });
    }

    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .trim();

    let status = "Offline";
    let ssl = "No";
    let title = "-";
    let category = "Website";

    async function tryFetch(url) {
      try {
        const r = await fetch(url, {
          method: "GET",
          redirect: "follow",
          headers: {
            "user-agent": "Mozilla/5.0"
          }
        });

        return r;
      } catch {
        return null;
      }
    }

    let response =
      await tryFetch("https://" + cleanDomain) ||
      await tryFetch("http://" + cleanDomain);

    if (response) {
      if (
        response.status < 500 ||
        response.status === 403 ||
        response.status === 401
      ) {
        status = "Online";
      }

      if (response.url.startsWith("https://")) {
        ssl = "Yes";
      }

      try {
        const html = await response.text();

        const match = html.match(/<title[^>]*>(.*?)<\/title>/i);

        if (match && match[1]) {
          title = match[1]
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 70);
        }
      } catch {}
    }

    const d = cleanDomain;
    const t = title.toLowerCase();

    /* CATEGORY ENGINE */

    if (
      d.includes("google") ||
      d.includes("bing") ||
      d.includes("yahoo") ||
      t.includes("google")
    ) category = "Search Engine";

    else if (
      d.includes("facebook") ||
      d.includes("instagram") ||
      d.includes("twitter") ||
      d.includes("linkedin") ||
      d.includes("t.co")
    ) category = "Social Media";

    else if (
      d.includes("youtube") ||
      d.includes("spotify") ||
      d.includes("netflix") ||
      d.includes("twitch")
    ) category = "Streaming";

    else if (
      d.includes("amazon") ||
      d.includes("ebay") ||
      d.includes("etsy") ||
      d.includes("shop")
    ) category = "Ecommerce";

    else if (
      d.includes("github") ||
      d.includes("gitlab") ||
      d.includes("stackoverflow")
    ) category = "Developer";

    else if (
      d.includes("mediafire") ||
      d.includes("dropbox") ||
      d.includes("mega") ||
      d.includes("drive")
    ) category = "Cloud Storage";

    else if (
      d.includes("reuters") ||
      d.includes("cnn") ||
      d.includes("bbc") ||
      d.includes("news")
    ) category = "News";

    else if (
      d.includes("bank") ||
      d.includes("paypal") ||
      d.includes("visa")
    ) category = "Banking";

    else if (
      d.includes("casino") ||
      d.includes("bet") ||
      d.includes("poker")
    ) category = "Gambling";

    else if (
      d.includes("crypto") ||
      d.includes("coinbase") ||
      d.includes("binance")
    ) category = "Crypto";

    else if (
      d.includes("design") ||
      d.includes("studio") ||
      d.includes("agency")
    ) category = "Design";

    else if (
      d.includes("ai") ||
      d.includes("openai")
    ) category = "AI";

    else if (
      d.includes("business") ||
      d.includes("corp") ||
      d.includes("company")
    ) category = "Business";

    else category = "Website";

    /* REPUTATION ENGINE */

    let score = 45;

    if (status === "Online") score += 25;
    if (ssl === "Yes") score += 10;
    if (title !== "-") score += 10;

    if (
      d.endsWith(".com") ||
      d.endsWith(".org") ||
      d.endsWith(".net")
    ) score += 5;

    if (
      d.includes("google") ||
      d.includes("facebook") ||
      d.includes("amazon") ||
      d.includes("github")
    ) score += 10;

    if (
      d.includes("hack") ||
      d.includes("free-money") ||
      d.includes("casino") ||
      d.includes("xxx")
    ) score -= 30;

    if (d.length > 28) score -= 8;

    if (/[0-9]{4,}/.test(d)) score -= 15;

    if (d.endsWith(".xyz")) score -= 15;
    if (d.endsWith(".top")) score -= 20;
    if (d.endsWith(".click")) score -= 20;

    if (score > 100) score = 100;
    if (score < 0) score = 0;

    let reputation = "Unknown";

    if (score >= 90) reputation = "Safe";
    else if (score >= 75) reputation = "Trustworthy";
    else if (score >= 55) reputation = "Neutral";
    else if (score >= 35) reputation = "Suspicious";
    else reputation = "Dangerous";

    return res.status(200).json({
      status,
      category,
      ssl,
      title,
      score,
      reputation
    });

  } catch (error) {
    return res.status(500).json({
      status: "Error",
      category: "-",
      ssl: "-",
      title: "-",
      score: 0,
      reputation: "Unknown"
    });
  }
}
