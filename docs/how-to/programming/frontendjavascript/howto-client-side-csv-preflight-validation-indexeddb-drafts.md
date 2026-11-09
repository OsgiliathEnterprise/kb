---
title: 'Client-Side CSV Preflight: Validating 10,000 Rows in ~20ms with a Set-Based
  Validator and IndexedDB Draft Snapshots'
diataxis: How-to Guide
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/endlessfountain/validating-10000-row-csv-uploads-in-20ms-before-touching-your-server-react-indexeddb-2h4b
date: 2026-11-08
keywords:
- knowledge-base
- frontend-javascript
- programming
- how-to
---
# Client-Side CSV Preflight: Validating 10,000 Rows in ~20ms with a Set-Based Validator and IndexedDB Draft Snapshots

A frontend recipe from `react-offline-sheet-guard`: validate a 10,000-row billing CSV **in ~20 ms on the main thread** before sending a single byte, and survive refresh/offline with IndexedDB draft snapshots — no validation library, no IndexedDB wrapper package. The failure mode it kills: user uploads 10k rows, waits 10s, gets `400 Bad Request: Invalid amount on row 7,500`, fixes it, re-uploads, hits the *next* typo on row 8,102.

## Step 1 — Kill the hidden O(N²) in your duplicate check

Field checks (email regex, integer range) are cheap. What quietly freezes tabs is duplicate-ID detection written as `some()` inside a row loop:

```typescript
// Don't do this on 10k rows: O(N^2) = ~50,000,000 string comparisons
const isDuplicate = previousRows.some((prev) => prev.externalId === row.externalId);
```

Swap the array scan for a `Set` → O(1) per row:

```typescript
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInvoiceSheet(rawCsv: string) {
  const t0 = performance.now();
  const lines = rawCsv.trim().split(/\r?\n/);
  const seenIds = new Set<string>();
  const validRows: InvoiceRow[] = [];
  const issues: CellIssue[] = [];

  for (let i = 1; i < lines.length; i++) {
    const [externalId = "", customerEmail = "", amountUsd = "", seatCount = ""] =
      lines[i].split(",");
    const id = externalId.trim();
    const rowNumber = i + 1;
    let rowClean = true;

    if (!id || seenIds.has(id)) {
      issues.push({ rowNumber, column: "externalId", value: externalId,
        code: "DUPLICATE_ID", message: id ? `Duplicate invoice ID '${id}'` : "Missing invoice ID" });
      rowClean = false;
    } else { seenIds.add(id); }

    if (!EMAIL_RE.test(customerEmail.trim())) {
      issues.push({ rowNumber, column: "customerEmail", value: customerEmail,
        code: "INVALID_EMAIL", message: "Malformed billing email" });
      rowClean = false;
    }
    const amt = Number(amountUsd.trim());
    if (!amountUsd.trim() || Number.isNaN(amt) || amt <= 0 || amt > 100_000) {
      issues.push({ rowNumber, column: "amountUsd", value: amountUsd,
        code: "AMOUNT_OUT_OF_RANGE", message: "Expected plain decimal 0.01..100000" });
      rowClean = false;
    }
    const seats = Number(seatCount.trim());
    if (!Number.isInteger(seats) || seats < 1 || seats > 5000) {
      issues.push({ rowNumber, column: "seatCount", value: seatCount,
        code: "INVALID_SEAT_INTEGER", message: "Expected whole integer 1..5000" });
      rowClean = false;
    }
    if (rowClean) validRows.push({ rowNumber, externalId: id, /* ...normalized row... */ });
  }
  return {
    totalRows: Math.max(0, lines.length - 1),
    validRows, issues,
    elapsedMs: Number((performance.now() - t0).toFixed(2)),
    bytesAvoidedOnFailure: issues.length > 0 ? new TextEncoder().encode(rawCsv).byteLength : 0,
  };
}
```

Two design details that matter for UX:

- **Check every column per row — don't `continue` on the first bad cell.** A row with both a broken email and `"$1200"` reports both issues at once, instead of the user fixing one and getting yelled at again.
- Reported benchmark: 10,000 rows / 40,000 cells in **20.11 ms** — barely over one 60 Hz frame (16.6 ms) — catching 4 planted errors and avoiding a doomed 418.8 KB POST.

## Step 2 — Draft snapshots in IndexedDB (not localStorage)

localStorage caps around 5 MB and blocks the main thread synchronously on writes — you get `QuotaExceededError` exactly when the user needs a rescue most. Raw IndexedDB's 2012 callback API is ~35 lines to promise-wrap; no wrapper package needed:

```typescript
const DB_NAME = "offline_sheet_guard_db";
const STORE_NAME = "draft_batches";

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraftSnapshot(draft: SavedDraft): Promise<void> {
  const db = await openDraftDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(draft);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
```

In `App.tsx`: subscribe to `window` `online`/`offline` events for a live connectivity banner, and call `loadDraftSnapshot("current")` in a mount-time `useEffect`. Testable in DevTools → Network → Offline: edit the sample, save, reload, resume.

## Step 3 — Know the three boundaries of this design

1. **Preflight is UX + bandwidth, not security.** Mirror the exact same rules server-side — anyone can `curl` a malformed payload straight to your API.
2. **`line.split(",")` breaks the moment a quoted field contains a comma** (`"Acme, Inc."` shifts every column right). Switch the parse step to an RFC-4180 parser (e.g. PapaParse) when free-text columns arrive.
3. **Scale cliff**: 10k rows ≈ 20 ms on the main thread, but 150k rows ≈ 300 ms — sluggish if validating per keystroke. Above ~25k rows, debounce validation by 250 ms or move `validateInvoiceSheet` into a **Web Worker**.

## References

- **DEV.to: Validating 10,000-Row CSV Uploads in 20ms (React + IndexedDB)**: https://dev.to/endlessfountain/validating-10000-row-csv-uploads-in-20ms-before-touching-your-server-react-indexeddb-2h4b
- **Companion repo (sheetValidator.ts, draftDb.ts, benchmark harness)**: https://github.com/endlessfountain/react-offline-sheet-guard
- **MDN IndexedDB API**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
