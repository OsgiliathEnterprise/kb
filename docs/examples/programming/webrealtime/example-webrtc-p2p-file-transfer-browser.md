---
title: Zero-Install Multi-Gigabyte P2P File Transfer in the Browser (WebRTC + File
  System Access API)
diataxis: Example
domain: programming
topic: web-realtime
source: DEV.to Tech News
source_url: https://dev.to/kingupe/how-i-built-a-zero-install-multi-gigabyte-p2p-file-transfer-engine-in-the-browser-with-webrtc--1doe
date: 2026-08-28
keywords:
- knowledge-base
- web-realtime
- programming
- examples
---
# Zero-Install Multi-Gigabyte P2P File Transfer in the Browser (WebRTC + File System Access API)

Concrete demonstration from **FluX** ([github.com/KING-UPE/FluX](https://github.com/KING-UPE/FluX)): a zero-install, peer-to-peer file-sharing tool that streams multi-gigabyte files directly between machines over the LAN — no desktop client, no cloud round-trip. The interesting part is how it survives three browser-specific failure modes when moving 10 GB+ of data through a tab.

## Hybrid architecture: signaling server + direct data channel

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "sig",
      "type": "rectangle",
      "x": 400,
      "y": 60,
      "width": 280,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Signaling server\nNode.js + Socket.io\n(SDP offers/answers, ICE)",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "sender",
      "type": "rectangle",
      "x": 80,
      "y": 240,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Sender browser\nslices file -> SCTP chunks",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "receiver",
      "type": "rectangle",
      "x": 700,
      "y": 240,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Receiver browser\nchunks -> disk (FS Access API)",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 200,
        "y": 240,
        "width": 300,
        "height": 150,
        "strokeColor": "#868e96",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 1,
        "points": [
          [
            0,
            0
          ],
          [
            300,
            -150
          ]
        ]
      }
    ],
    [
      {
        "id": "a2",
        "type": "arrow",
        "x": 800,
        "y": 240,
        "width": 300,
        "height": 150,
        "strokeColor": "#868e96",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 1,
        "points": [
          [
            0,
            0
          ],
          [
            -300,
            -150
          ]
        ]
      }
    ],
    [
      {
        "id": "a3",
        "type": "arrow",
        "x": 300,
        "y": 285,
        "width": 400,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 3,
        "points": [
          [
            0,
            0
          ],
          [
            400,
            0
          ]
        ]
      }
    ],
    {
      "id": "note1",
      "type": "text",
      "x": 320,
      "y": 350,
      "width": 460,
      "height": 40,
      "text": {
        "content": "Direct WebRTC data channel (SCTP/DTLS) over the LAN —\nall file bytes bypass the signaling server entirely.",
        "fontSize": 13,
        "fontFamily": 1,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent"
      }
    }
  ]
}
```

1. **Signaling** (Node.js + Socket.io): coordinates peer discovery and exchanges SDP offers/answers and ICE candidates. Stateless, tiny traffic.
2. **Data path** (WebRTC SCTP/DTLS data channel): once the handshake completes, every file byte travels directly peer-to-peer over the LAN at local-network speed — the server is out of the loop.

## Challenge A: bypassing the browser RAM crash (direct-to-disk streaming)

Naive downloads build an in-memory `Blob`/`ArrayBuffer` first → a 10 GB transfer OOM-kills the tab. The fix is the **File System Access API**: pick a destination file handle, then pipe incoming chunks straight to disk as they arrive.

```javascript
// Receiver: request a destination file handle from the user
const fileHandle = await window.showSaveFilePicker({
  suggestedName: incomingMetadata.name,
});
const writableStream = await fileHandle.createWritable();

// Write each WebRTC chunk directly to disk — nothing held in memory
dataChannel.onmessage = async (event) => {
  if (event.data instanceof ArrayBuffer) {
    await writableStream.write(event.data);
  } else if (event.data === "TRANSFER_COMPLETE") {
    await writableStream.close();
  }
};
```

## Challenge B: backpressure via `bufferedAmount`

WebRTC data channels have an internal send buffer. If you slice faster than the channel flushes, `bufferedAmount` climbs and packets drop (or the tab dies). Solution: a high/low-water-mark loop — pause slicing above 8 MB, resume on `bufferedamountlow`.

```javascript
const CHUNK_SIZE = 64 * 1024;              // 64 KB per chunk
const BUFFER_THRESHOLD = 8 * 1024 * 1024;  // 8 MB high watermark

dataChannel.bufferedAmountLowThreshold = 1 * 1024 * 1024; // 1 MB low watermark

async function sendFile(file, dataChannel) {
  let offset = 0;
  while (offset < file.size) {
    if (dataChannel.bufferedAmount > BUFFER_THRESHOLD) {
      await new Promise((resolve) => {
        dataChannel.onbufferedamountlow = () => {
          dataChannel.onbufferedamountlow = null;
          resolve();
        };
      });
    }
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    dataChannel.send(await chunk.arrayBuffer());
    offset += CHUNK_SIZE;
  }
  dataChannel.send("TRANSFER_COMPLETE");
}
```

## Challenge C: non-blocking UI with Web Workers

SHA-256 checksums and slicing multi-gigabyte files on the main thread freeze React rendering. Offload hashing + chunking to dedicated **Web Workers** so the UI stays at 60 FPS during transfer.

## Stack summary

| Layer | Choice |
|-------|--------|
| Frontend | React 18, Zustand, Framer Motion, Tailwind CSS |
| Protocols | WebRTC (SCTP/DTLS data channels), Socket.io for signaling |
| Browser APIs | File System Access API (`showSaveFilePicker`), Web Workers, `Blob.slice()` |
| Signaling backend | Node.js + Express + Socket.io (stateless) |

## Reusable lessons

- **Never buffer a large transfer in the tab** — stream to disk with the File System Access API.
- **Always throttle on `bufferedAmount`**, not on a fixed timer; watermarks adapt to actual channel drain rate.
- **Move crypto and slicing off the main thread.**
- A stateless signaling server is enough: it only carries SDP/ICE, never file bytes.

## References

- [How I Built a Zero-Install, Multi-Gigabyte P2P File Transfer Engine in the Browser with WebRTC & File System Access API](https://dev.to/kingupe/how-i-built-a-zero-install-multi-gigabyte-p2p-file-transfer-engine-in-the-browser-with-webrtc--1doe)
- [FluX source code (GitHub)](https://github.com/KING-UPE/FluX)
- [PubNub: WebRTC file transfer in the browser — chunking and data-channel patterns](https://www.pubnub.com/blog/transfer-files-in-the-browser-pubnub-rtc-fileshare/)
