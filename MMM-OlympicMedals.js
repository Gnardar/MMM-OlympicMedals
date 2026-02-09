/*
 * MMM-OlympicMedals
 * Displays Olympic medal standings.
 */

Module.register("MMM-OlympicMedals", {
  defaults: {
    showTitle: true,
    title: "Olympic Medals",
    size: "med", // small | med | large
    updateInterval: 6 * 60 * 60 * 1000, // 6 hours
    countryLimit: 10,
    useTotal: true,
    showFlags: false,
    focusCountry: "",
    apiUrl: "https://en.wikipedia.org/wiki/2026_Winter_Olympics_medal_table"
  },

  start: function () {
    this.medals = [];
    this.loaded = false;
    this.error = null;

    this.sendSocketNotification("MMM_OM_FETCH", {
      apiUrl: this.config.apiUrl
    });

    this.scheduleUpdate();
  },

  scheduleUpdate: function () {
    setInterval(() => {
      this.sendSocketNotification("MMM_OM_FETCH", {
        apiUrl: this.config.apiUrl
      });
    }, this.config.updateInterval);
  },

  getStyles: function () {
    return ["MMM-OlympicMedals.css"];
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    const size = (this.config.size || "med").toLowerCase();
    wrapper.className = "mmm-om mmm-om--" + size;
    const normalize = (value) =>
      (value || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "");

    if (this.error) {
      wrapper.innerHTML = "<div class='mmm-om__error'>" + this.error + "</div>";
      return wrapper;
    }

    if (!this.loaded) {
      wrapper.innerHTML = "<div class='mmm-om__loading'>Loading medal standings...</div>";
      return wrapper;
    }

    if (this.config.showTitle) {
      const title = document.createElement("div");
      title.className = "mmm-om__title";
      title.textContent = this.config.title || "Olympic Medals";
      wrapper.appendChild(title);
    }

    const table = document.createElement("table");
    table.className = "mmm-om__table";

    const header = document.createElement("tr");
    header.innerHTML = "<th>Rank</th><th>Country</th><th>G</th><th>S</th><th>B</th><th>T</th>";
    table.appendChild(header);

    const focus = normalize(this.config.focusCountry);

    this.medals.slice(0, this.config.countryLimit).forEach((row, idx) => {
      const tr = document.createElement("tr");
      const rank = row.rank || (idx + 1);
      const country = row.country || row.code || "";
      const countryKey = normalize(country);
      const codeKey = normalize(row.code);
      const nocKey = normalize(row.noc);

      if (focus && (countryKey === focus || codeKey === focus || nocKey === focus)) {
        tr.className = "mmm-om__row--focus";
      }

      const flagCell = this.config.showFlags && row.flagUrl
        ? "<img class='mmm-om__flag' src='" + row.flagUrl + "' alt=''>"
        : "";

      tr.innerHTML =
        "<td>" + rank + "</td>" +
        "<td class='mmm-om__country'>" + flagCell + "<span>" + country + "</span></td>" +
        "<td class='mmm-om__g'>" + (row.gold || 0) + "</td>" +
        "<td class='mmm-om__s'>" + (row.silver || 0) + "</td>" +
        "<td class='mmm-om__b'>" + (row.bronze || 0) + "</td>" +
        "<td class='mmm-om__t'>" + (row.total || (row.gold + row.silver + row.bronze) || 0) + "</td>";

      table.appendChild(tr);
    });

    wrapper.appendChild(table);
    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "MMM_OM_DATA") {
      this.error = null;
      this.medals = payload.medals || [];
      this.loaded = true;
      this.updateDom();
    }

    if (notification === "MMM_OM_ERROR") {
      this.error = payload.error || "Unable to load medal data.";
      this.loaded = false;
      this.updateDom();
    }
  }
});
