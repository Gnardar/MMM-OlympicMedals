const NodeHelper = require("node_helper");
const cheerio = require("cheerio");

function isWikipediaPage(url) {
  try {
    const u = new URL(url);
    return u.hostname.endsWith("wikipedia.org") && u.pathname.startsWith("/wiki/");
  } catch (e) {
    return false;
  }
}

function buildWikipediaParseUrl(url) {
  const u = new URL(url);
  const page = decodeURIComponent(u.pathname.replace("/wiki/", "")).replace(/_/g, " ");
  return u.origin + "/w/api.php?action=parse&format=json&prop=text&page=" + encodeURIComponent(page);
}

function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\*/g, "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function normalizeHeader(text) {
  return cleanText(text).toLowerCase();
}

function findMedalTable($) {
  let best = null;
  let bestScore = -1;

  $("table.wikitable").each((_, el) => {
    const headers = $(el)
      .find("tr")
      .first()
      .find("th")
      .map((__, th) => normalizeHeader($(th).text()))
      .get();

    const hasRank = headers.some((h) => h === "rank" || h === "place");
    const hasNoc = headers.some((h) => h === "noc" || h === "nation" || h === "team" || h === "country");
    const hasGold = headers.some((h) => h === "gold" || h === "g");
    const hasSilver = headers.some((h) => h === "silver" || h === "s");
    const hasBronze = headers.some((h) => h === "bronze" || h === "b");
    const hasTotal = headers.some((h) => h === "total" || h === "t");

    const score =
      (hasRank ? 2 : 0) +
      (hasNoc ? 2 : 0) +
      (hasGold ? 1 : 0) +
      (hasSilver ? 1 : 0) +
      (hasBronze ? 1 : 0) +
      (hasTotal ? 1 : 0);

    if (score > bestScore) {
      bestScore = score;
      best = el;
    }
  });

  return best;
}

function parseWikipediaMedalTable(html) {
  const $ = cheerio.load(html);
  const table = findMedalTable($);

  if (!table) {
    throw new Error("Medal table not found on Wikipedia page.");
  }

  const medals = [];
  let lastRank = "";

  $(table)
    .find("tr")
    .slice(1)
    .each((_, row) => {
      const cells = $(row).find("th, td");
      if (cells.length < 5) return;

      const rankText = cleanText($(cells[0]).text());
      const countryText = cleanText($(cells[1]).text());

      if (/^Totals?/i.test(rankText) || /^Totals?/i.test(countryText)) {
        return false;
      }

      const rank = rankText || lastRank;
      const gold = parseInt(cleanText($(cells[2]).text()), 10) || 0;
      const silver = parseInt(cleanText($(cells[3]).text()), 10) || 0;
      const bronze = parseInt(cleanText($(cells[4]).text()), 10) || 0;
      const total = parseInt(cleanText($(cells[5]).text()), 10) || gold + silver + bronze;

      if (rank) lastRank = rank;

      if (!countryText) return;

      medals.push({
        rank,
        country: countryText,
        gold,
        silver,
        bronze,
        total
      });
    });

  if (!medals.length) {
    throw new Error("Medal table parsed but no rows found.");
  }

  return medals;
}

module.exports = NodeHelper.create({
  start: function () {
    // no-op
  },

  socketNotificationReceived: async function (notification, payload) {
    if (notification !== "MMM_OM_FETCH") return;

    try {
      const fetch = (await import("node-fetch")).default;

      if (isWikipediaPage(payload.apiUrl)) {
        const apiUrl = buildWikipediaParseUrl(payload.apiUrl);
        const res = await fetch(apiUrl, { timeout: 15000 });
        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }

        const data = await res.json();
        const html = data?.parse?.text?.["*"];
        if (!html) {
          throw new Error("Wikipedia response missing HTML.");
        }

        const medals = parseWikipediaMedalTable(html);
        this.sendSocketNotification("MMM_OM_DATA", { medals });
        return;
      }

      const res = await fetch(payload.apiUrl, { timeout: 15000 });
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      const data = await res.json();

      // Expect data.medals as array; fall back to data
      const medals = Array.isArray(data.medals) ? data.medals : data;
      this.sendSocketNotification("MMM_OM_DATA", { medals });
    } catch (err) {
      this.sendSocketNotification("MMM_OM_ERROR", { error: err.message });
    }
  }
});
