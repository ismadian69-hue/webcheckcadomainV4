async function checkDomain(domain) {
  try {
    const cleanDomain = domain.trim().toLowerCase();

    let status = "Offline";
    let category = "-";
    let ssl = "-";
    let score = 0;
    let reputation = "Unknown";
    let title = "-";

    // CHECK WEBSITE
    try {
      const res = await fetch(`https://r.jina.ai/http://${cleanDomain}`);
      const html = await res.text();

      if (html && html.length > 50) {
        status = "Online";

        const match = html.match(/<title>(.*?)<\/title>/i);
        if (match) title = match[1].trim();
      }
    } catch {}

    // SSL
    try {
      await fetch(`https://${cleanDomain}`, { mode: "no-cors" });
      ssl = "Yes";
    } catch {}

    const text = (cleanDomain + " " + title).toLowerCase();

    if (text.includes("google")) category = "Search Engine";
    else if (text.includes("github")) category = "Developer";
    else if (text.includes("facebook")) category = "Social Media";
    else if (text.includes("amazon")) category = "Ecommerce";
    else if (text.includes("bank")) category = "Finance";
    else category = "Website";

    // SCORE
    if (status === "Online") score += 40;
    if (ssl === "Yes") score += 20;
    if (title !== "-") score += 20;
    if (category !== "Website") score += 20;

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

  } catch {
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
