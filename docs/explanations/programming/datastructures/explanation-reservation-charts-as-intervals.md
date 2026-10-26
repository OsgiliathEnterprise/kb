---
title: 'Reservation Charts as Intervals: Finding Empty Berths with Seat Hopping'
diataxis: Explanation
domain: programming
topic: data-structures
source: DEV.to Tech News
source_url: https://dev.to/gapseat/finding-empty-berths-on-fully-booked-indian-trains-reservation-charts-as-intervals-1anf
date: 2026-10-24
keywords:
- knowledge-base
- data-structures
- programming
- explanations
---
# Reservation Charts as Intervals: Finding Empty Berths with Seat Hopping

Indian Railways trains can show "waiting list" for days and still leave with empty berths — late cancellations, no-shows, and partial-route bookings. Once the **reservation chart** is prepared, the berth-level picture is public (per berth: booked A→D, vacant D→F, booked again…). The problem solved by the GapSeat project: *is there a berth usable between my two stations?* and, if not, *what's the fewest number of berth changes that does* ("seat hopping")?

## Data model: a berth is a list of segments

Index each station by its position in the schedule. Each berth then becomes a list of `(from, to, occupied?)` segments. Two rules dominate:

1. **Segments are half-open intervals.** A booking A→D occupies legs A→B, B→C, C→D — not D→E. The passenger gets off at D; the berth is free from there.
2. **Occupied always wins; unknown is never vacant.** If overlapping chart data marks a leg both vacant and occupied, treat it as occupied. If a station isn't in the schedule, ignore the segment instead of guessing.

With stations indexed, a berth becomes a set of vacant *legs* (leg `i` = stretch from station `i` to `i+1`); consecutive legs merge into `[from, to)` ranges:

```dart
List<VacantSeatRange> vacantSeatRanges(SeatResult seat, Map<String, int> index) {
  final vacant = <int>{}, occupied = <int>{};
  for (final s in seat.segments) {
    final from = index[s.from], to = index[s.to];
    if (from == null || to == null || from >= to) continue; // unknown never counts
    for (var i = from; i < to; i++) {
      (s.occupied ? occupied : vacant).add(i);              // half-open: [from, to)
    }
  }
  vacant.removeAll(occupied);                               // occupied wins
  // ...merge sorted consecutive legs into [from, to) ranges
}
```

A single-berth trip check is now just a range test: is there a vacant range with `from &lt;= boarding` and `to >= destination`?

## Seat hopping: a shortest path, built backwards

When no single berth covers the trip, want a sequence of berths minimizing **changes** (each change = moving luggage, possibly across coaches). Model each station as a node; every vacant range covering station `s` gives an edge from `s` to every later station it reaches. "Shortest" = fewest edges.

The planner works **backwards from the destination**, keeping the best few ways to finish the trip from each station:

```dart
final best = <int, List<List<JourneyStep>>>{ to: [[]] };   // at destination: nothing left

for (var start = to - 1; start >= from; start--) {
  // edges: every station reachable from `start` on one berth
  // candidates: one step to `next`, then the best ways from `next`
  // keep the top `limit`, ranked by number of steps
  best[start] = rank(candidates).take(limit).toList();
}
return best[from];
```

### Details that make results feel right to a passenger

- **No branch cutoff.** Every station is a possible change point. A pruning heuristic would be faster but could hide the direct berth or a one-change route — the one result a user must never miss.
- **One representative berth per reachable station.** Ten berths going 4→9: the path needs one; the UI still offers the others covering the same stretch (lower berth, same coach).
- **Staying on the same berth is one step.** If the best continuation starts on the very berth you're on, the two steps merge — a berth vacant across two separate data segments shouldn't look like a change.
- **Tie-break: travel farther first.** Same number of changes → prefer keeping the first berth longer; people prefer changing once near the end.
- **Deduplicate by station pattern.** Two paths changing at the same stations are the same plan to a passenger; keep one.
- **Bounds.** At most 5 paths, at most 8 steps per path — beyond that nobody would follow it.

### Complexity

Each station × vacant ranges covering it × reachable stations: roughly **stations × ranges × stations**. A long-distance train has well under 100 halts and fewer than 2,000 berths → runs comfortably on a phone.

## Testing the edge cases

Most tests are named after a way the planner could mislead a passenger: adjacent legs on the same berth need no change; occupied overlap overrides vacancy; unknown stations can't prove vacancy; it doesn't bridge a vacancy gap on the same berth; it can return to a berth through that berth's gap; it finds the direct seat after many shorter candidate ranges; it rejects disconnected paths even when endpoints match.

The trust anchor is a **property test**: generate 100 seeded random trains, compute the true minimum berth count with a separate deliberately simple search over every station pair, then check (a) the planner's best path uses exactly that many berths, (b) every step of every path is really vacant on its berth, (c) the planner returns nothing when no path exists. "Hand-picked cases catch the bugs you thought of; that test catches the ones you didn't."

## The app around it

Flutter app (`flutter_bloc` state, `get_it` DI) plus a static website. Audience-shaping choices:

- **Offline timetable**: download a compact binary timetable once; query it in a long-lived worker isolate. Chart/vacancy data always live (occupancy can't be cached).
- **Hindi, Marathi, Tamil** alongside English.
- **TalkBack** support across the main vacancy-search journey.

**Limits, honestly**: a vacancy result is a snapshot of the published chart — berths can be booked through current booking or allotted by the TTE afterwards. The app doesn't book; you book through IRCTC or a counter.

## Diagram

[explanation-reservation-charts-as-intervals.excalidraw](explanation-reservation-charts-as-intervals.svg)

## References

- [Finding empty berths on 'fully booked' Indian trains: reservation charts as intervals — GapSeat](https://dev.to/gapseat/finding-empty-berths-on-fully-booked-indian-trains-reservation-charts-as-intervals-1anf)
- [GapSeat web checker](https://gapseat.in/chart-vacancy)
- [GapSeat on Android](https://play.google.com/store/apps/details?id=com.gapseat.app)
