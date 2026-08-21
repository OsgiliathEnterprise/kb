---
title: Streaming LLM tokens into React Native without the jank
diataxis: How-to Guide
domain: Software-Engineering
topic: Mobile-Architecture
source: DZone AI/ML
source_url: https://dzone.com/articles/streaming-llm-tokens-into-react-native
date: 2026-08-21
keywords:
- knowledge-base
- Mobile-Architecture
- Software-Engineering
- how-to
---
# Streaming LLM Tokens Into React Native Without the Jank

## Summary
A chat screen looks like a weekend project, but in React Native it is one of the hardest things to ship well because it sits on the two most hostile surfaces in mobile development: the **software keyboard** and a **scrolling list that changes size while you're looking at it**. Streaming LLM replies makes it worse: tokens arrive in bursts (a few every ~100 ms, a full reply over 2–3 s), and **each batch makes the last bubble taller**. The list is not just appending a finished message — it is *growing on every frame* while the user might be typing, scrolling, or dismissing the keyboard. This note is the story of the break and the fix, which shipped as a library release three months before the article.

## Why There's Nothing Good to Reach For
- `react-native-gifted-chat` is the default answer and it's **showing its age**: opinionated about your data shape, rendering, and layout; fighting those opinions costs more than writing your own.
- Most "chat UI" packages are really just a styled `FlatList` plus a text input. They solve the easy half and hand you the two genuinely hard problems: **keyboard choreography** and a **live-resizing list**.
- The keyboard utilities that do exist (`KeyboardAvoidingView` and friends) were built for **forms**, not for an inverted list whose last row is growing while the keyboard animates.

So the author hand-rolled a keyboard-and-scroll layer (~500 lines of `KeyboardAvoidingView` overrides, manual `scrollToOffset` calls, keyboard show/hide listeners, and offset math to keep the composer glued to the keyboard). It worked and shipped — until streaming was added.

## The Break: Streaming Meets the Keyboard
All bug reports were variations on "the chat is jumpy" — no crashes, just jank, and **unreproducible when each feature ran alone**. The keyboard animation was smooth; the streaming was smooth; the problem only showed at their **intersection**. Two systems were **writing to the scroll position on the same frames**:

1. Every batch of tokens makes the last bubble taller.
2. On an inverted list, growing the bottom row shifts the content offset.
3. React Native re-runs the layout to absorb the new height.
4. If the keyboard is open (or mid-animation), the keyboard layer is **also** adjusting offsets at the same time.

Result: content jumps, the composer twitches, and a user who scrolled up to re-read gets yanked around — **layout thrash** (a steady 60 fps collapsed into the low teens, worse on a mid-range Android phone). The naive streaming append that triggers it:

```typescript
// The naive streaming append: looks innocent, thrashes layout.
// Every chunk triggers a re-measure of the growing bubble,
// which fights whatever the keyboard handler is doing this frame.
for await (const chunk of stream) {
  setMessages((prev) => {
    const next = [...prev];
    next[0] = { ...next[0], text: next[0].text + chunk }; // index 0 = newest, inverted list
    return next;
  });
}
```

### Streaming sharp edges (each compounds the layout problem)
- **Stock React Native `fetch` cannot stream a response body.** There is no `response.body.getReader()` in stock RN. You reach for an SSE polyfill (`react-native-sse`) or, on Expo, the streaming-capable `fetch` from `expo/fetch`. Pick deliberately — this is the single most common day-one mistake.
  ```typescript
  import { fetch } from "expo/fetch";
  const res = await fetch(url, { method: "POST", body, signal: controller.signal });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  // ...read loop, parse SSE frames, dispatch tokens
  ```
- **Partial markdown will bite you.** Tokens arrive mid-syntax — at some frame your buffer is literally `The dragon turned and **stared` with the bold marker opened and not closed. A naive renderer either shows the asterisks as literal text or flips half the conversation bold. You need a renderer that tolerates **unterminated syntax**, or you **sanitize the buffer before each render**.
- **Cancellation has to be real.** The user closes the chat, switches characters, or fires a new message mid-reply. You need an `AbortController` whose `signal` actually reaches the fetch. Skip it and you're billed for tokens nobody will read, streamed into a view that already unmounted.

## The Fix
`react-native-keyboard-controller` shipped **`KeyboardChatScrollView`** in **v1.21.0 (2026-03-16)** — the first component built specifically for the **chat-plus-keyboard** problem (rather than the form-plus-keyboard one), and it solves the streaming case directly.

The key design choice: it is built on a `ClippingScrollView` that provides cross-platform `contentInset` behavior by **extending the scrollable geometry rather than recomputing the layout**. That one choice is why the thrash disappears — the keyboard no longer fights the list because absorbing keyboard height is **no longer a layout operation**.

Props worth knowing (they read like a tour of every chat app you've used):
- **`keyboardLiftBehavior`** — how content reacts to the keyboard:
  - `"always"`: keep latest messages visible no matter where you've scrolled (Telegram, WhatsApp).
  - `"whenAtEnd"`: lift only when you're already at the bottom; leave you alone if you've scrolled up to read history (ChatGPT).
  - `"persistent"`: lift when the keyboard opens and **stay put when it closes** instead of snapping back (Claude).
  - `"never"`: let the keyboard cover the content, move nothing (Perplexity).
- **`blankSpace`** — reserve room for an incoming response while absorbing keyboard height. This is the **direct antidote to streaming jank**: instead of the list growing reactively frame-by-frame and fighting the keyboard, you **reserve the space up front** and let the tokens fill it.
- **`extraContentPadding`** — handle a composer that grows as the user types a long message, without jumping the content.
- **`freeze`** — lock the layout during emoji and attachment-picker transitions (the other place chat UIs jump).

```typescript
import { KeyboardChatScrollView } from "react-native-keyboard-controller";

<KeyboardChatScrollView
  keyboardLiftBehavior="persistent" // the Claude pattern: lifts on open, stays put on close
  blankSpace={pendingReply ? estimatedReplyHeight : 0}
>
  {messages.map(renderBubble)}
</KeyboardChatScrollView>;
```

On paper `whenAtEnd` is the tidy answer for a reading-heavy app. The author shipped `persistent` anyway — so many users live in assistant apps that Claude's settle-and-stay behavior is what their hands expect, and familiarity beat theory.

## What to Keep, What to Throw Away
- **Delete** the hand-rolled keyboard layer and start from `KeyboardChatScrollView`.
- **Keep** the custom code that was always yours to own: the **streaming reader**, the **partial-markdown guard**, and the **cancellation plumbing**. Those aren't keyboard problems, and no layout library solves them for you.

### The general lesson
The expensive bug is almost never one broken feature. It's **two correct features interacting on the same frame** — the keyboard handler was right, the streaming was right, and the week disappeared into the seam between them. When something janks and every part tests clean in isolation, **stop testing the parts and look at what they're both writing to.** And the practical one: the chat box is never the easy part of the app — budget for it like it's a feature, because it is.

## Streaming-Layout Conflict Diagram (Excalidraw)
```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "title",
      "type": "rectangle",
      "x": 120, "y": 20,
      "width": 560, "height": 44,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Streaming LLM into RN chat: the two-systems-on-one-frame bug", "fontSize": 15, "fontFamily": 1 }
    },
    {
      "id": "streaming",
      "type": "rectangle",
      "x": 60, "y": 110,
      "width": 240, "height": 100,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "LLM streaming\nSSE tokens in bursts (~100ms)\nlast bubble grows every frame\nexpo/fetch res.body.getReader()", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "keyboard",
      "type": "rectangle",
      "x": 500, "y": 110,
      "width": 240, "height": 100,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Keyboard layer\nKeyboardAvoidingView + scrollToOffset\nadjusts content offset while open\n(was built for forms, not chat)", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "conflict",
      "type": "rectangle",
      "x": 250, "y": 130,
      "width": 200, "height": 60,
      "strokeColor": "#e52727",
      "backgroundColor": "#ff9c9c",
      "fillStyle": "solid",
      "strokeWidth": 3,
      "roundness": { "type": 3 },
      "text": { "content": "BOTH write scroll offset\nSAME FRAME -> jank / thrash\n(60fps -> low teens)", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "fix",
      "type": "rectangle",
      "x": 120, "y": 280,
      "width": 560, "height": 90,
      "strokeColor": "#bf8401",
      "backgroundColor": "#fff3b0",
      "fillStyle": "solid",
      "strokeWidth": 3,
      "roundness": { "type": 3 },
      "text": { "content": "FIX: react-native-keyboard-controller KeyboardChatScrollView (v1.21.0)\nClippingScrollView extends scrollable GEOMETRY (not layout)\nkeyboardLiftBehavior + blankSpace => streaming is the only writer to layout", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "arrow-streaming-conflict",
      "type": "arrow",
      "x": 300, "y": 160,
      "width": 0, "height": 0,
      "strokeColor": "#30665c",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [50, 0]]
    },
    {
      "id": "arrow-keyboard-conflict",
      "type": "arrow",
      "x": 500, "y": 160,
      "width": 0, "height": 0,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [-50, 0]]
    },
    {
      "id": "arrow-conflict-fix",
      "type": "arrow",
      "x": 350, "y": 190,
      "width": 0, "height": 90,
      "strokeColor": "#bf8401",
      "strokeWidth": 3,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 90]]
    }
  ]
}
```

## References
- [DZone — Stop Hand-Rolling Chat UIs: Streaming LLM Tokens Into React Native Without the Jank](https://dzone.com/articles/streaming-llm-tokens-into-react-native) (2026-08-20)
- [react-native-keyboard-controller (v1.21.0 `KeyboardChatScrollView`)](https://github.com/krystofwoldrich/react-native-keyboard-controller)
- [expo/fetch (streaming-capable fetch)](https://docs.expo.dev/versions/latest/sdk/fetch/)
- [react-native-sse (SSE polyfill)](https://www.npmjs.com/package/react-native-sse)
