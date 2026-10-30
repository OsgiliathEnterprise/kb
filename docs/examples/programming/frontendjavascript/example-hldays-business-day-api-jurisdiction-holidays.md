---
title: 'hldays: Business-Day Endpoints That Know Local (Municipality-Level) Holidays'
diataxis: Example
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/altofire/building-hldays-4-business-days-that-know-local-holidays-38kf
date: 2026-10-30
keywords:
- knowledge-base
- frontend-javascript
- programming
- examples
---
# hldays: Business-Day Endpoints That Know Local (Municipality-Level) Holidays

"Is this a working day?" sounds like a one-line function — check the weekday, check a holiday list. Then you ask it about **24 June in Porto**: Wednesday in 2026, not a national holiday, but it's São João, a *municipal* holiday — the city is closed. Ask the same question about Lisbon and the answer is opposite. That's why hldays (public API at `api.hldays.dev`) has business-day endpoints: the answer depends on *where you are*, down to the municipality.

## The two endpoints

- **Is this date a business day here?** — `GET /v1/business-day`
- **What date is N business days from this one?** — `GET /v1/business-days/add`

Both take a `jurisdiction` (an id like `PT-M-1312` or a name like `porto`) and use the same holiday resolution as the rest of the API: the place's own holidays plus everything it inherits from its region and country.

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "t1", "type": "text", "x": 40, "y": 20, "width": 600, "height": 24, "text": {"content": "Jurisdiction inheritance: holidays resolve bottom-up, union of the tree", "fontSize": 15, "fontFamily": 1}, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}, {"id": "r1", "type": "rectangle", "x": 230, "y": 60, "width": 230, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Municipality\nPT-M-1312 'porto'\nS\u00e3o Jo\u00e3o (24 Jun) + inherited", "fontSize": 13, "fontFamily": 1}}, {"id": "r2", "type": "rectangle", "x": 60, "y": 200, "width": 190, "height": 60, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Region / subdivision\n(GB-ENG 'England')", "fontSize": 13, "fontFamily": 1}}, {"id": "r3", "type": "rectangle", "x": 330, "y": 200, "width": 190, "height": 60, "strokeColor": "#1e1e1e", "backgroundColor": "#ffec99", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Country\n(GB 'United Kingdom')", "fontSize": 13, "fontFamily": 1}}, {"id": "a1", "type": "arrow", "x": 300, "y": 130, "width": -150, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [-150, 70]]}, {"id": "a2", "type": "arrow", "x": 370, "y": 130, "width": 150, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [150, 70]]}, {"id": "n1", "type": "text", "x": 40, "y": 300, "width": 640, "height": 50, "text": {"content": "isBusinessDay = weekday NOT in country's weekend list\nAND no holiday (own + inherited) matches the date.", "fontSize": 13, "fontFamily": 1}, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}]}
```

## Example responses

England at Christmas 2026 — 25 Dec is a Friday, so Boxing Day (Saturday) gets a substitute on Monday 28:

```bash
curl "https://api.hldays.dev/v1/business-day?jurisdiction=GB-ENG&date=2026-12-28&include_sources=false"
```

```json
{
  "jurisdiction": { "id": "GB-ENG", "name": "England", "level": "subdivision", "kind": "nation", "country": "GB", "parent": "GB" },
  "date": "2026-12-28",
  "business_day": false,
  "weekend": false,
  "holidays": [
    {
      "date": "2026-12-28",
      "holiday_id": "boxing-day",
      "name": { "en": "Boxing Day" },
      "type": "public",
      "status": "unverified",
      "jurisdiction": { "id": "GB", "name": "United Kingdom", "level": "country" },
      "substitute_for": "2026-12-26"
    }
  ],
  "observances": []
}
```

The response says *why*: `weekend` is separate from `holidays`, and the holiday carries `substitute_for` so you can tell a substitute day from the real date.

Adding business days from Christmas Eve skips Friday (Christmas), the weekend, and Monday (the substitute):

```bash
curl "https://api.hldays.dev/v1/business-days/add?jurisdiction=GB-ENG&from=2026-12-24&days=2"
```

```json
{ "jurisdiction": { "id": "GB-ENG", "name": "England" }, "from": "2026-12-24", "days": 2, "date": "2026-12-30", "observances": [] }
```

## The code (small on purpose)

Both endpoints sit on two methods in `src/core/calendar.ts`:

```ts
isBusinessDay(j: Jurisdiction, date: string, types: HolidayType[] = DEFAULT_TYPES, municipal = true) {
  const d = parseDate(date)!;
  const weekend = this.data.countries[j.country]?.weekend ?? [6, 7];
  const holidays = this.holidays(j, d.getUTCFullYear(), types, municipal).filter((o) => o.date === date);
  const isWeekend = weekend.includes(isoWeekday(d));
  return { business_day: !isWeekend && holidays.length === 0, weekend: isWeekend, holidays };
}

/** Move |days| business days forward (or backward if negative). The start date itself is not counted. */
addBusinessDays(j: Jurisdiction, from: string, days: number, types = DEFAULT_TYPES, municipal = true): string {
  const step = days < 0 ? -1 : 1;
  let d = parseDate(from)!;
  for (let left = Math.abs(days); left > 0; ) {
    d = addDays(d, step);
    if (this.isBusinessDay(j, formatDate(d), types, municipal).business_day) left--;
  }
  return formatDate(d);
}
```

Design notes:

- **The expensive part is cached.** Expanding a jurisdiction's rules into dates for a year is cached per (jurisdiction, year). After the first call, each step is a lookup and a filter — the plain loop is cheap.
- **A plain loop on purpose.** Every clever shortcut ("skip whole weeks, then fix up") breaks the moment a substitute day or a regional holiday lands somewhere unexpected.
- **UTC midnight `Date` objects** — no time-zone surprises on the Worker.

## Weekends are per-country

The weekend is a property of the country, in `data/<CC>/country.yaml`, as ISO weekdays (1 = Monday … 7 = Sunday):

```yaml
country:
  code: GB
  name: "United Kingdom"
  weekend: [6, 7]
```

All six countries hldays covers today (Portugal, Brazil, Germany, UK, Greece, US) use `[6, 7]`, so this hasn't been tested by real data yet — but it exists so a Friday/Saturday-weekend country (e.g. parts of the Middle East) can be added without touching the engine. The same `weekend` list is used when *moving* substitute days, so the two stay consistent.

## Practical implications

| If you need... | Use... |
| --- | --- |
| "Is this date a working day in place X?" | `GET /v1/business-day?jurisdiction=X&date=...` — response distinguishes `weekend` vs `holidays` and carries `substitute_for` |
| "N working days from date X" | `GET /v1/business-days/add?jurisdiction=X&from=...&days=N` — start date not counted; negative `days` walks backward |
| Municipal-level precision | Jurisdiction ids like `PT-M-1312` (or names like `porto`) — inherits region + country holidays automatically |
| Non-standard weekends | Per-country `weekend` list in `country.yaml` (ISO weekday numbers) |

## Related notes

- [Browser APIs Replacing NPM Packages](../../../explanations/programming/frontendjavascript/explanation-browser-apis-replacing-npm-packages.md) — the same bet: the platform's built-ins (here a business-day calendar instead of date libraries) can replace an npm dependency.
- [Intl.Segmenter for Text Analysis](example-intl-segmenter-text-analysis.md) — another platform API doing the domain work (text segmentation) that a package would do.

## References

- [Building hldays #4: Business days that know local holidays (DEV.to)](https://dev.to/altofire/building-hldays-4-business-days-that-know-local-holidays-38kf)
- [hldays API](https://api.hldays.dev/)
- [Datewise](https://datewise.dev/) — a comparable business-day/holiday API with national-level coverage (247 countries, adjudicated against authoritative sources) and deep US state/territory data; a useful contrast to hldays' municipality-level granularity.
- [holidays (Python library)](https://holidays.readthedocs.io/en/latest/api/) — self-hosted open-source holiday calendars for 60+ countries; handy for cross-checking a hosted API's jurisdiction coverage or as an offline fallback.
