---
title: Commit the Conversation — Keep Partial Voice Turns Out of Your AI Companion's
  Context
diataxis: Tutorial
domain: ai-machine-learning
topic: multimodal
source: DEV.to Tech News
source_url: https://dev.to/susiewang/commit-the-conversation-keep-partial-voice-turns-out-of-your-ai-companions-context-mb
date: 2026-08-30
keywords:
- knowledge-base
- multimodal
- ai-machine-learning
- tutorials
---
# Commit the Conversation — Keep Partial Voice Turns Out of Your AI Companion's Context

A voice companion can sound convincing while maintaining a fictional conversation history. The usual demo implementation appends *everything* to one transcript — partial speech recognition, the final user utterance, the LLM response, and whatever text was sent to TTS — and that transcript becomes the next prompt. Some of that context was never actually said or heard: a partial recognition may be wrong, an interrupted model response may never reach the user, a late callback may belong to an abandoned turn. The model cannot repair this because it only sees the history your application presents.

The practical fix: treat conversation history as **committed application state**, not a log of every generated string. This tutorial builds a small TypeScript boundary enforcing four rules:

1. Partial user speech is provisional.
2. Only a final user utterance enters model context.
3. Assistant text enters context only after playback finishes.
4. Events from interrupted or superseded requests cannot revive an old turn.

## Where the boundary sits

```
microphone → RTC/media transport → speech recognition
→ turn commit controller (application-owned state)
→ LLM → speech synthesis → RTC/media transport → speaker
```

The controller uses an application-owned event interface; your integration adapter translates SDK callbacks into it.

## The commit protocol

A turn moves through a constrained lifecycle: `listening → thinking → speaking → complete`, with `aborted` and `failed` reachable from any active phase. There are **two independent commits**:

- **User commit:** recognition produces a final utterance.
- **Assistant commit:** synthesis playback finishes for the matching request.

An LLM completion is only a *draft*. Sending that draft to TTS does not prove the user heard it — which matters during barge-in: if the assistant generates "Your appointment is confirmed" but the user interrupts before playback completes, putting that sentence into history would tell the next model a confirmation was communicated. It was not.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "vc1",
      "type": "rectangle",
      "x": 40,
      "y": 80,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "listening\n(partialText provisional)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "vc2",
      "type": "rectangle",
      "x": 300,
      "y": 80,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "thinking\n(USER_FINAL committed)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "vc3",
      "type": "rectangle",
      "x": 560,
      "y": 80,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "speaking\n(assistantDraft only)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "vc4",
      "type": "rectangle",
      "x": 820,
      "y": 80,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "complete\n(SPEECH_FINISHED commits\ndeliveredAssistantText)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "vc5",
      "type": "rectangle",
      "x": 300,
      "y": 260,
      "width": 460,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f5c2c2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "aborted / failed\n(INTERRUPTED or FAILED — stale callbacks cannot revive)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "vc6",
        "type": "arrow",
        "x": 240,
        "y": 115,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            60,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "vc7",
        "type": "arrow",
        "x": 500,
        "y": 115,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            60,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "vc8",
        "type": "arrow",
        "x": 760,
        "y": 115,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            60,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "vc9",
        "type": "arrow",
        "x": 400,
        "y": 150,
        "width": 0,
        "height": 110,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            0,
            110
          ]
        ]
      }
    ],
    [
      {
        "id": "vc10",
        "type": "arrow",
        "x": 660,
        "y": 150,
        "width": 0,
        "height": 110,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            0,
            110
          ]
        ]
      }
    ]
  ]
}
```

## Building the boundary (TypeScript)

Scaffold:

```bash
mkdir voice-context-commit && cd voice-context-commit
npm init -y
npm install --save-dev typescript tsx @types/node
mkdir src
```

Represent provisional and committed data **separately** — `assistantDraft` vs `deliveredAssistantText` is the central invariant, not cosmetic bookkeeping:

```ts
type Phase = 'listening' | 'thinking' | 'speaking' | 'complete' | 'aborted' | 'failed';

type Turn = {
  id: string;
  phase: Phase;
  partialText?: string;          // provisional — never enters context
  userText?: string;             // committed on USER_FINAL
  requestId?: string;
  assistantDraft?: string;       // draft until playback finishes
  deliveredAssistantText?: string; // committed on SPEECH_FINISHED
  failureReason?: string;
};

type Event =
  | { type: 'TURN_OPENED'; turnId: string }
  | { type: 'USER_PARTIAL'; turnId: string; text: string }
  | { type: 'USER_FINAL'; turnId: string; text: string }
  | { type: 'MODEL_STARTED'; turnId: string; requestId: string }
  | { type: 'MODEL_COMPLETED'; turnId: string; requestId: string; text: string }
  | { type: 'SPEECH_FINISHED'; turnId: string; requestId: string }
  | { type: 'INTERRUPTED'; turnId: string }
  | { type: 'FAILED'; turnId: string; reason: string };
```

Reduce events immutably (`replaceTurn` returns a new session), and guard against stale callbacks: an event whose `requestId` no longer matches the turn's current request, or that arrives after `INTERRUPTED`, is dropped — it cannot revive an old turn.

## Key takeaways

- The model only sees what your application presents; garbage in history becomes confident fiction.
- Two commits (user final utterance, assistant playback finished) are independent and both required for a turn to be "real".
- This boundary decides *what happened during the current voice session* — it is not long-term memory.

## References

- [Commit the Conversation: Keep Partial Voice Turns Out of Your AI Companion's Context (DEV.to)](https://dev.to/susiewang/commit-the-conversation-keep-partial-voice-turns-out-of-your-ai-companions-context-mb)
- [Tencent RTC Conversational AI overview](https://trtc.io/document/conversational-ai-overview?product=conversationalai)
