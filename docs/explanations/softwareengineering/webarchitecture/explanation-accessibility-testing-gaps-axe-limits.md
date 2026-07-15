---
title: The Gap Between Automated Accessibility Testing and Real Usability
diataxis: Explanation
domain: Software-Engineering
topic: Web-Architecture
source: DEV.to
source_url: https://dev.to/duncanfaulkner/axe-passes-but-its-still-unusable-the-accessibility-bugs-automated-tools-cant-catch-26ea
date: 2026-07-13
keywords:
- knowledge-base
- Web-Architecture
- Software-Engineering
- explanations
---
# The Gap Between Automated Accessibility Testing and Real Usability

## Overview

Automated accessibility testing tools like AXE check whether HTML is well-formed, not whether an interface is actually usable. AXE catches roughly **one-third of WCAG issues**. The remaining two-thirds require human testing — specifically keyboard navigation and screen reader validation.

This note documents five concrete failure patterns that pass AXE cleanly but break real accessibility, along with their Angular-specific fixes.

## The Core Insight

AXE works by inspecting a static snapshot of the DOM and checking it against a ruleset. It can see that an attribute is *present*. It cannot see whether:

- The attribute is *true* in context
- The interaction sequence *makes sense*
- Anything actually *happens* when a key is pressed
- Focus moves to a sensible location after state changes

These are temporal and behavioral properties — invisible to any DOM snapshot tool.

## Five Patterns That Pass AXE But Fail Users

### 1. Modal Dialog: Focus Lost After Close

**The Bug:** A dialog closes and focus falls to `<body>`, throwing keyboard users to the top of the page.

```typescript
// ❌ AXE passes, but focus is lost
confirm() {
  this.save();
  this.open.set(false);
}
```

**The Fix:** Store and restore the trigger element's focus:

```typescript
private trigger: HTMLElement | null = null;

openDialog() {
  this.trigger = this.doc.activeElement as HTMLElement;
  this.open.set(true);
}

close() {
  this.open.set(false);
  this.trigger?.focus(); // restore user's place
}
```

### 2. Form Validation: Visual-Only Error Signals

**The Bug:** A red border indicates validation failure, but no programmatic connection exists between the error message and the input field.

```html
<!-- ❌ passes AXE, communicates nothing to screen readers -->
<input formControlName="email" class="error">
<p class="error-text">Enter a valid email</p>
```

**The Fix:** Wire up `aria-invalid`, `aria-describedby`, and `role="alert"`:

```html
<input formControlName="email"
       [attr.aria-invalid]="showError()"
       [attr.aria-describedby]="showError() ? 'email-error' : null">
@if (showError()) {
  <p id="email-error" role="alert">Enter a valid email.</p>
}
```

- `aria-invalid` states the field has an error
- `aria-describedby` ties the explanation to the field
- `role="alert"` announces the message the moment it renders

### 3. Custom Toggle Switch: No Keyboard Handler

**The Bug:** A component has perfect ARIA markup (`role="switch"`, `aria-checked`, `tabindex="0"`) but pressing Space or Enter does nothing because no keyboard handler is wired.

```typescript
// ❌ AXE sees valid ARIA but cannot test interactivity
@Component({
  host: {
    'role': 'switch',
    '[attr.aria-checked]': 'checked()',
    'tabindex': '0',
    // ...no keyboard handler
  },
})
```

**The Fix:** Add keyboard event handlers or use a native `<button>`:

```typescript
host: {
  'role': 'switch',
  '[attr.aria-checked]': 'checked()',
  'tabindex': '0',
  '(keydown.space)': 'toggle(); $event.preventDefault()',
  '(keydown.enter)': 'toggle()',
}
```

**Better:** Wrap a native `<button>` and skip the custom role entirely. Native elements cannot have this bug.

### 4. Live Region: Destroyed and Recreated Instead of Updated

**The Bug:** Using Angular's `@if` to conditionally render an `aria-live` region means the region and its content arrive simultaneously — screen readers never announce the change because the element was not *already in the DOM*.

```html
<!-- ❌ Region created WITH content — nothing announced -->
@if (announcement()) {
  <p aria-live="polite">{{ announcement() }}</p>
}
```

**The Fix:** Keep the region persistently in the DOM, or use Angular CDK's `LiveAnnouncer`:

```html
<!-- ✅ Region always present, content updates -->
<p class="sr-only" aria-live="polite">{{ announcement() }}</p>
```

Or with CDK (preferred):

```typescript
private announcer = inject(LiveAnnouncer);
this.announcer.announce(`${count} results`, 'polite');
```

### 5. Data Visualization: SVG Chart Invisible to Screen Readers

**The Bug:** An SVG chart has proper contrast and a `<title>`, but SVG internals are not exposed as data to assistive technology. To a screen reader user, it is a blank rectangle.

**The Fix:** Provide the same data as a visually-hidden table:

```html
<figure>
  <svg aria-hidden="true">...</svg>
  <table class="sr-only">
    <caption>Monthly revenue, Jan–Dec</caption>
    <tr><th>Month</th><th>Revenue</th></tr>
    <!-- one row per data point -->
  </table>
</figure>
```

## The Real Test

The two manual tests that cover the two-thirds AXE cannot see:

1. **Put the mouse down and Tab through it.** Can you reach and operate everything? Does focus go somewhere sane after every action?
2. **Turn on a screen reader** — VoiceOver (⌘+F5 on macOS) or NVDA (Windows) — and listen. Does what you hear match what's on screen?

## Architecture Decision

| Approach | Coverage | Cost | Reliability |
|----------|----------|------|-------------|
| AXE in CI | ~33% of WCAG issues | Free, automated | Excellent regression net |
| Keyboard-only testing | ~50% of remaining | Manual, per-component | Catches focus and interaction bugs |
| Screen reader testing | ~100% of remaining | Manual, per-component | Catches semantic and announcement bugs |

**Recommendation:** Keep AXE in CI as your regression net. Add keyboard and screen reader testing as a manual gate before shipping any user-facing component.

## Excalidraw Diagram

```excalidraw
* Excalidraw below
* You can draw in the message, and call draw_excalidraw to update the drawing
* When you send messages, include the drawing in the response to me so that I can see your drawings
* I can edit settings with Excalidraw+ settings, or draw text by starting lines with '> '

{"type":"default","values":{"appScale":1.0,"pageId":"p1","pages":{"p1":{"id":"p1","type":"tumbleweed","name":"Page 1","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":false},"page2":{"id":"page2","type":"tumbleweed","name":"Page 2","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":true}},"exportPadding":120,"toView":null,"gridSettings":{"customSize":20,"circular":false,"type":"square","dashed":true},"viewBackgroundColor":"#FFFFFF","theme":"dark","strokeColor":"#e6422c","backgroundColor":"#FFFFFF","fontSize":20,"font":"Cascadia","strokeWidth":2,"roughness":0,"seed":117588423,"view":null,"gridMode":false,"gridModeEnabled":false,"gridStep":5,"gridCounter":3}}
text {"id":"1","x":430.0,"y":230.0,"text":"AXE Automated Testing","fontSize":24,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aV","seed":149553083,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"2","x":430.0,"y":280.0,"text":"Checks DOM structure","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aW","seed":154724707,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"3","x":430.0,"y":310.0,"text":"~33% WCAG coverage","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aX","seed":134999955,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"4","x":430.0,"y":340.0,"text":"Static snapshot only","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aY","seed":150582691,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"5","x":930.0,"y":230.0,"text":"Keyboard Testing","fontSize":24,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aZ","seed":277501699,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"6","x":930.0,"y":280.0,"text":"Tab through UI","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"ba","seed":163038403,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"7","x":930.0,"y":310.0,"text":"Focus management","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bb","seed":163038404,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"8","x":930.0,"y":340.0,"text":"Interaction sequences","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bc","seed":163038405,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"9","x":1430.0,"y":230.0,"text":"Screen Reader Testing","fontSize":24,"fontFamily":1,"type":"text","strokeColor":"#2c2d34","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bd","seed":163038406,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"10","x":1430.0,"y":280.0,"text":"VoiceOver / NVDA","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"be","seed":163038407,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"11","x":1430.0,"y":310.0,"text":"Semantic meaning","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bf","seed":163038408,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"12","x":1430.0,"y":340.0,"text":"Live region announcements","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bg","seed":163038409,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"13","x":730.0,"y":430.0,"text":"❌ Focus lost after modal close","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bh","seed":163038410,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"14","x":730.0,"y":460.0,"text":"❌ Visual-only error signals","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bi","seed":163038411,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"15","x":730.0,"y":490.0,"text":"❌ Toggle with no keyboard handler","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bj","seed":163038412,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"16","x":730.0,"y":520.0,"text":"❌ Live region destroyed+recreated","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bk","seed":163038413,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"17","x":730.0,"y":550.0,"text":"❌ SVG chart invisible to SR","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bl","seed":163038414,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"18","x":130.0,"y":430.0,"text":"GAP:","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bm","seed":163038415,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"19","x":130.0,"y":460.0,"text":"What AXE","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bn","seed":163038416,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"20","x":130.0,"y":490.0,"text":"Cannot See","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bo","seed":163038417,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"21","x":700.0,"y":270.0,"binding":{"elementID":"aQ","focus":0.5,"gap":50,"startHeadId":null},"lastPos":{"x":700.0,"y":270.0},"points":"[0,0],[1,0]","startArrowSharpness":0.25,"endArrowSharpness":0.25,"startPoints":[[0,0],[1,0]],"endPoints":[[0,0],[1,0]],"startBinding":null,"endBinding":null,"startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bp","seed":163038418,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"22","x":1200.0,"y":270.0,"binding":{"elementID":"aR","focus":0.5,"gap":50,"startHeadId":null},"lastPos":{"x":1200.0,"y":270.0},"points":"[0,0],[1,0]","startArrowSharpness":0.25,"endArrowSharpness":0.25,"startPoints":[[0,0],[1,0]],"endPoints":[[0,0],[1,0]],"startBinding":null,"endBinding":null,"startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bq","seed":163038419,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
```

## References

- [Original Article: AXE Passes, But It's Still Unusable](https://dev.to/duncanfaulkner/axe-passes-but-its-still-unusable-the-accessibility-bugs-automated-tools-cant-catch-26ea)
- [Angular CDK LiveAnnouncer API](https://angular.io/api/cdk/a11y/LiveAnnouncer)
- [WCAG 2.1 Success Criteria](https://www.w3.org/WAI/WCAG21/quickref/)
- [Angular Accessibility Best Practices](https://angular.dev/best-practices/a11y)
