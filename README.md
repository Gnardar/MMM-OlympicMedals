# MMM-OlympicsMedals

MagicMirror module that displays Olympic medal standings.

## Install
1. Copy this folder into `MagicMirror/modules/` as `MMM-OlympicsMedals`.
2. Run `npm install` inside the module folder.

## Configuration
```js
{
  module: "MMM-OlympicsMedals",
  position: "top_left",
  config: {
    updateInterval: 6 * 60 * 60 * 1000,
    countryLimit: 10,
    useTotal: true,
    showFlags: false,
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

## Notes
- Replace `apiUrl` with another Wikipedia medal table page to switch events.
- `useTotal` and `showFlags` are reserved for future use.
