---
title: 'Accessibility Bugs Automated Tools Can''t Catch: Beyond AXE'
diataxis: How-to Guide
domain: Software-Engineering
topic: Web-Architecture
source: DEV.to (duncanfaulkner)
source_url: https://dev.to/duncanfaulkner/axe-passes-but-its-still-unusable-the-accessibility-bugs-automated-tools-cant-catch-26ea
date: 2026-07-05
keywords:
- knowledge-base
- Web-Architecture
- Software-Engineering
- how-to
---
# Accessibility Bugs Automated Tools Can't Catch: Beyond AXE

## Overview

Automated accessibility testing tools like **AXE**, **Lighthouse**, and **WAVE** are essential first-line defenses — but they can only detect roughly **30-40%** of WCAG violations. The remaining issues require human judgment, contextual understanding, and real-world usability testing.

This HOWTO covers the categories of accessibility bugs that automated tools miss, and practical strategies for catching them.

---

## What Automated Tools CAN Detect

Automated tools excel at checking **structural** and **programmatic** requirements:

| Category | Examples |
|----------|----------|
| **Color contrast** | Insufficient contrast ratios |
| **Missing attributes** | Alt text, ARIA labels, form labels |
| **HTML semantics** | Missing headings, landmark regions |
| **Keyboard traps** | Focus trapping without escape |
| **Duplicate IDs** | Conflicting element identifiers |

**Limitation**: These are necessary but not sufficient conditions for accessibility.

---

## What Automated Tools CANNOT Detect

### 1. Semantic Correctness

AXE can verify that an element has an `aria-label`, but it cannot determine whether the label is **meaningful** or **accurate**.

```html
<!-- AXE passes: alt attribute exists -->
<!-- But: the alt text is useless for screen reader users -->
<img src="chart.png" alt="image">

<!-- Better: descriptive alt text -->
<img src="chart.png" alt="Bar chart showing Q1-Q4 revenue growth: Q1 $120K, Q2 $145K, Q3 $130K, Q4 $180K">
```

### 2. Logical Focus Order

Automated tools check if elements are focusable, but not whether the **tab order** makes logical sense.

```
Common issue: Visual layout ≠ DOM order
┌──────────────────────────┐
│ Label    [Input Field]   │  ← Visually paired
│ [Submit]                 │  ← Tab order: Label → Submit → Input (WRONG)
└──────────────────────────┘
```

**Fix**: Use CSS Grid/Flexbox ordering or `tabindex` to ensure DOM order matches visual order.

### 3. Contextual Meaning

```html
<!-- AXE passes: button has text -->
<!-- But: "Click here" provides no context -->
<button>Click here</button>

<!-- Better: descriptive action text -->
<button>Download quarterly report (PDF, 2.3MB)</button>
```

### 4. Cognitive Load and Readability

- Complex sentence structures
- Jargon without definitions
- Information overload
- Inconsistent navigation patterns

### 5. Time-Based Media

- Captions that are technically present but inaccurate
- Audio descriptions that miss critical visual information
- Auto-playing content without pause controls

### 6. Touch Target Spacing

Automated tools check minimum touch target size (44×44 CSS pixels), but miss:

- Overlapping interactive elements
- Touch targets too close together
- Swipe gestures without alternatives

---

## Manual Testing Strategies

### Screen Reader Testing

| Tool | Platform | Use Case |
|------|----------|----------|
| **NVDA** | Windows (free) | Most widely used globally |
| **VoiceOver** | macOS/iOS (built-in) | Apple ecosystem |
| **JAWS** | Windows (commercial) | Enterprise environments |
| **TalkBack** | Android (built-in) | Mobile accessibility |

**Testing checklist**:
1. Navigate the page using only the screen reader (no mouse)
2. Verify all interactive elements are announced correctly
3. Check that dynamic content updates are announced (live regions)
4. Test form validation messages

### Keyboard-Only Testing

1. Disable the mouse entirely
2. Navigate using **Tab**, **Shift+Tab**, **Enter**, **Space**, and arrow keys
3. Verify every interactive element is reachable and operable
4. Check that focus indicators are visible

### Cognitive Accessibility Testing

- Use the **Flesch-Kincaid readability test** (target: Grade 8 or below)
- Check for consistent terminology
- Verify that error messages suggest solutions, not just problems
- Test with users who have cognitive disabilities

---

## The Accessibility Testing Pyramid

```
         /\
        /  \       Manual Testing (10%)
       /    \      - Screen reader testing
      /      \     - Keyboard testing
     /--------\    - User testing with disabled users
    /          \
   /            \    Semi-Automated (30%)
  /              \   - Browser extensions (AXE DevTools)
 /                \  - Visual regression testing
/------------------\
/                    \  Automated (60%)
/                      \ - CI/CD pipeline checks
/                        \ - Lighthouse CI
/__________________________\
```

**Recommended allocation**:
- **60%** automated (fast, repeatable, catches structural issues)
- **30%** semi-automated (developer-level tooling)
- **10%** manual (expert review, user testing)

---

## Integrating Accessibility into CI/CD

```yaml
# GitHub Actions example
name: Accessibility Check
on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run AXE
        run: |
          npx axe-cli https://staging.example.com
      - name: Lighthouse CI
        run: |
          npx lighthouse-ci --url https://staging.example.com
```

**Important**: Treat automated failures as **warnings**, not blockers. They catch obvious issues, but manual review is still required.

---

## Common Pitfalls

| Pitfall | Why It's Hard to Catch | Solution |
|---------|----------------------|----------|
| Decorative images with alt="" | AXE passes, but screen readers skip meaningful images | Manual review of image context |
| ARIA role mismatches | Element has ARIA role but wrong semantics | Expert review |
| Dynamic content not announced | Live regions technically exist but misconfigured | Screen reader testing |
| Color-only information | Contrast passes, but color conveys meaning | Manual visual review |
| Form error grouping | Errors announced individually, not as a group | Screen reader testing |

---

## References

- [AXE Passes, But It's Still Unusable](https://dev.to/duncanfaulkner/axe-passes-but-its-still-unusable-the-accessibility-bugs-automated-tools-cant-catch-26ea) — DEV.to, July 2026
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG/guidelines/2.2/)
- [Deque University: Accessibility Testing](https://dequeuniversity.com/)
- [MDN: Accessibility Testing](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Testing_for_accessibility)
