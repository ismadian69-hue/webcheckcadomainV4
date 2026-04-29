async function checkDomain(domain) {
  try {
    const cleanDomain = domain.trim().toLowerCase();
    if (!cleanDomain) return null;

    // ===== DEFAULT VALUES =====
    let status = "Offline";
    let category = "Website";
    let ssl = "-";
    let score = 0;
    let reputation = "Unknown";
    let title = "-";

    // =========================
    // 1. CHECK WEBSITE ONLINE
    // =========================
    let siteData = null;

    try {
      const res = await fetch(`https://api.allorigins.win/raw?url=https://${cleanDomain}`, {
        method: "GET"
      });

      if (res.ok) {
        const html = await res.text();
        status = "Online";

        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) title = titleMatch[1].trim();

        siteData = html;
      }
    } catch (e) {}

    // =========================
    // 2. SSL CHECK
    // =========================
    try {
      const sslRes = await fetch(`https://${cleanDomain}`, { mode: "no-cors" });
      ssl = "Yes";
    } catch {
      ssl = "-";
    }

    // =========================
    // 3. CATEGORY SMART DETECT
    // =========================
    const text = `${cleanDomain} ${title}`.toLowerCase();

    if (
      text.includes("google") ||
      text.includes("bing") ||
      text.includes("yahoo")
    ) category = "Search Engine";

    else if (
      text.includes("github") ||
      text.includes("gitlab") ||
      text.includes("developer")
    ) category = "Developer";

    else if (
      text.includes("facebook") ||
      text.includes("instagram") ||
      text.includes("twitter") ||
      text.includes("tiktok")
    ) category = "Social Media";

    else if (
      text.includes("amazon") ||
      text.includes("ebay") ||
      text.includes("shop") ||
      text.includes("store")
    ) category = "Ecommerce";

    else if (
      text.includes("bank") ||
      text.includes("paypal") ||
      text.includes("visa")
    ) category = "Finance";

    else if (
      text.includes("youtube") ||
      text.includes("netflix") ||
      text.includes("spotify")
    ) category = "Entertainment";

    else if (
      text.includes("news") ||
      text.includes("cnn") ||
      text.includes("bbc")
    ) category = "News";

    // =========================
    // 4. SCORE SYSTEM
    // =========================
    if (status === "Online") score += 40;
    if (ssl === "Yes") score += 20;
    if (title !== "-") score += 20;
    if (category !== "Website") score += 20;

    if (score > 100) score = 100;

    // =========================
    // 5. REPUTATION
    // =========================
    if (score >= 90) reputation = "Excellent";
    else if (score >= 75) reputation = "Trustworthy";
    else if (score >= 50) reputation = "Suspicious";
    else reputation = "Dangerous";

    return {
      domain: cleanDomain,
      status,
      category,
      ssl,
      score,
      reputation,
      title
    };

  } catch (error) {
    return {
      domain,
      status: "Offline",
      category: "-",
      ssl: "-",
      score: 0,
      reputation: "Unknown",
      title: "-"
    };
  }
}
