---
title: 'Advanced JavaFX Accessibility: Making a Custom Seat Map Screen-Reader Operable'
diataxis: Tutorial
domain: programming
topic: java
source: Inside Java
source_url: https://inside.java/2026/11/24/advanced-a11y-javafx-tutorial/
date: 2026-11-24
keywords:
- knowledge-base
- java
- programming
- tutorials
---
# Advanced JavaFX Accessibility: Making a Custom Seat Map Screen-Reader Operable

Guided walkthrough (from the official Inside Java / dev.java tutorial, validated on **JDK 27 +
JavaFX 27**) of JavaFX's advanced accessibility APIs, taught by building an interactive venue seat
map. The core lesson: a custom control is only as accessible as the three callbacks it implements on
`javafx.scene.Node`. Full tutorial: [dev.java/learn/javafx/a11y/advanced](https://dev.java/learn/javafx/a11y/advanced/).

## The three callbacks that make a node accessible

Defined on `javafx.scene.Node` and inherited by controls, shapes, and canvas subclasses:

| API | Who calls it | Responsibility |
| --- | --- | --- |
| `Object queryAccessibleAttribute(AccessibleAttribute, Object...)` | JavaFX accessibility bridge, when assistive tech requests info | Return the requested information |
| `void executeAccessibleAction(AccessibleAction, Object...)` | The bridge, when assistive tech requests an action | Perform the action |
| `notifyAccessibleAttributeChanged(AccessibleAttribute)` | **Your code**, after changing an exposed attribute | Tell the bridge to re-query |

The Node API requires **superclass delegation** for any query/action your subclass does not handle
(`return super.queryAccessibleAttribute(...)` as the fallback path).

Three enums define the contract:

- `AccessibleRole` — kind of interaction: `BUTTON`, `LIST_VIEW`, `SLIDER`, `TOGGLE_BUTTON`, ...
- `AccessibleAttribute` — information requested: `TEXT`, `SELECTED`, `VALUE`, ...
- `AccessibleAction` — operation requested: `FIRE`, `EXPAND`, `SET_VALUE`, ...

**Pick the role that matches the interaction semantics first** — the role determines which attributes
and actions the node must support. A seat toggles independently → `TOGGLE_BUTTON` role, so it must
answer `TEXT` and `SELECTED` and perform `FIRE`.

## Step-by-step structure

1. **Base app** (`SeatAllocationApp.java` + tiny `Launcher` entry point so the app class stays
   UI-focused). Launch with `PATH_TO_FX` set to the JavaFX SDK `lib` dir; ensure the JDK meets the
   JavaFX release's minimum (e.g. JavaFX 26 requires JDK 24+ — major versions need not match).
2. **`Seat.java`** — a canvas per seat drawing its id + status word (`Free`/`Chosen`/`Occupied`).
   Selection goes only through `setSelected()`, which guards unavailable seats and no-ops when the
   state is unchanged; observers use the *read-only* selection property.
3. **`SeatMap.java`** — custom `Pane` laying seats in curved rows with an aisle; arrow keys move
   focus between neighbours without changing selection; Tab/Shift+Tab traverse and may leave the map;
   **unavailable seats stay focusable** (keyboard users can inspect them) but are not selectable.
4. **Expose state to the screen reader** — in the `Seat` constructor, set the accessible text
   ("Row A, seat 3, unavailable") and help text; then override the query:

```java
@Override
public Object queryAccessibleAttribute(AccessibleAttribute attribute, Object... parameters) {
    return switch (attribute) {
        case TEXT      -> "Row " + row + ", seat " + number + ", " + statusWord();
        case SELECTED  -> isSelected();               // same state that drives rendering
        case DISABLED  -> !isAvailable() || isDisabled();
        default        -> super.queryAccessibleAttribute(attribute, parameters);
    };
}
```

| Attribute | Return | Source |
| --- | --- | --- |
| `TEXT` | `String` | Accessible name set in the constructor |
| `SELECTED` | `Boolean` | `isSelected()` — the single source of truth also used for drawing |
| `DISABLED` | `Boolean` | True when unavailable or node disabled |
| others | varies | Superclass (bounds, focus, ...) |

5. **Perform actions for the screen reader** — override `executeAccessibleAction` to map `FIRE` onto
   the same `setSelected()` path used by mouse and keyboard, then call
   `notifyAccessibleAttributeChanged(AccessibleAttribute.SELECTED)` after the state actually changes,
   so assistive tech re-queries. **Reading must never mutate**: a `TEXT` query must not toggle
   selection or move focus.
6. **React to accessibility becoming active** — JavaFX exposes an *accessibility-active* property;
   the tutorial adds a copyable selection summary that appears when it becomes `true`, even if
   activation happens after launch.

## Verification checklist (test with real assistive tech, on the target OS)

- Seats individually discoverable; name/state match the display.
- `FIRE` via screen reader obeys the same rules as mouse/keyboard (unavailable seats refuse).
- Tab/Shift+Tab can enter and leave the map; arrow keys never change selection.
- Clearing selection sends a `SELECTED` change notification for **each** changed seat.
- Record OS + JavaFX runtime + screen-reader version per test run — readers intercept arrow keys
  differently, so test their own navigation commands too.

## Production gaps the tutorial leaves open (by design)

Fixed geometry/colors/English and a small seat count are demo constraints: a real venue map needs
resize/zoom, high-contrast theming, localization, booking-server validation (local selection ≠
reservation), and a different rendering/navigation strategy at thousands of seats.

Design rule to take away: **start from the role that matches the interaction, implement only its
documented attributes/actions against state you already maintain, prefer standard JavaFX controls
where they fit, and test custom behavior with real assistive technology on the target platform.**

## References

- [Inside Java: Tutorial — Advanced Accessibility in JavaFX](https://inside.java/2026/11/24/advanced-a11y-javafx-tutorial/) (original source)
- [dev.java: Advanced Accessibility in JavaFX (full tutorial)](https://dev.java/learn/javafx/a11y/advanced/)
- [JavaFX 27 API: javafx.scene.Node](https://download.java.net/java/GA/javafx27/docs/api/javafx.graphics/javafx/scene/Node.html)
- [JavaFX API: AccessibleRole](https://download.java.net/java/GA/javafx27/docs/api/javafx.graphics/javafx/scene/AccessibleRole.html)
- Related in KB: [Java Sealed Classes and Exhaustive Pattern Matching](../../../explanations/programming/java/explanation-java-sealed-classes-exhaustive-pattern-matching.md)
