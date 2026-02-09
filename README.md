# MMM-OlympicMedals

MagicMirror module that displays Olympic medal standings. This is a quick MVP as I did not see anything that was current. 

<img width="316" height="283" alt="image" src="https://github.com/user-attachments/assets/5913935d-93ef-4f06-9f23-ecbe6e73523b" />


## Install
1. Copy this folder into `MagicMirror/modules/` as `MMM-OlympicMedals`. git clone works great
2. Run `npm install` inside the module folder.

## Configuration
```js
{
  module: "MMM-OlympicMedals",
  position: "top_left",
  config: {
    showTitle: true,
    title: "Olympic Medals",
    size: "med",
    updateInterval: 6 * 60 * 60 * 1000,
    countryLimit: 10,
    useTotal: true,
    showFlags: true,
    focusCountry: "Canada",
    apiUrl: "https://en.wikipedia.org/wiki/2026_Winter_Olympics_medal_table"
  }
}
```

## Data source
By default the module fetches and parses the medal table from the Wikipedia page above.

If you point `apiUrl` to a JSON endpoint, it should return either:
```json
{
  "medals": [
    { "rank": 1, "country": "USA", "gold": 10, "silver": 8, "bronze": 6, "total": 24 }
  ]
}
```


or a JSON array of that shape.

## Options
- `showTitle`: show the title above the table.
- `title`: text to display when `showTitle` is enabled.
- `size`: `small`, `med`, or `large` for compactness.
- `showFlags`: show country flags when available (Wikipedia pages provide them).
- `focusCountry`: case-insensitive match of a country name or NOC code to highlight the row.

## Notes
- Replace `apiUrl` with another Wikipedia medal table page to switch events.
- `useTotal` is reserved for future use.
