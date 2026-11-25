---
title: 'Decoding Tether''s TRON Multisig: Reading USDT Freeze Proposals Before They
  Execute'
diataxis: Example
domain: security-privacy
topic: blockchain-forensics
source: DEV.to Tech News
source_url: https://dev.to/freeze_check_d8bafeeb80db/reading-tethers-tron-multisig-usdt-freezes-are-public-before-they-land-59lj
date: 2026-11-25
keywords:
- knowledge-base
- blockchain-forensics
- security-privacy
- examples
---
# Decoding Tether's TRON Multisig: Reading USDT Freeze Proposals Before They Execute

Most AML tooling learns about a USDT freeze when `AddedBlackList` fires on the TRON USDT contract — **at that moment the address is already frozen**. But the freeze starts earlier: as a fully public `submitTransaction` in a **2-of-3 Gnosis-style multisig**, with the target address in plain view in the call data. This note reproduces a ~40-line Python decoder that reads those proposals with nothing but the free TronGrid API, plus the year-long measurement built on it.

## The freeze flow (three on-chain steps)

- USDT contract: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
- Owner: multisig `TBPxhVAsuzoFnKyXtc1o2UySEydPHgATto` (2 of 3 owners required)

1. **Submit** — one owner calls `submitTransaction(destination, value, data)` where `data` is an encoded `addBlackList(address)` call against USDT. The multisig emits `Submission(transactionId)` + `Confirmation(owner, transactionId)`.
2. **Confirm** — a second owner calls `confirmTransaction(transactionId)`.
3. **Execute** — threshold met, the multisig calls USDT in the same tx: `Execution(transactionId)` + `AddedBlackList(_user)`. From here `isBlackListed(address)` returns `true`; outgoing transfers are rejected, **incoming still work** (the contract only checks the sender).

Unfreezes (`removeBlackList`) and burns (`destroyBlackFunds`) go through the same multisig with different selectors.

## Working decoder (TronGrid API + raw ABI parsing)

Selectors: `c6427474` = `submitTransaction(address,uint256,bytes)`; inner calls `0ecb93c0` = `addBlackList`, `e4997dc5` = `removeBlackList`, `f3bdc228` = `destroyBlackFunds`. TRON addresses are the 20 bytes with a `0x41` prefix, Base58Check-encoded.

```python
import hashlib, requests

API = "https://api.trongrid.io"
MULTISIG = "TBPxhVAsuzoFnKyXtc1o2UySEydPHgATto"
SUBMIT = "c6427474"
CALLS = {"0ecb93c0": "addBlackList", "e4997dc5": "removeBlackList",
         "f3bdc228": "destroyBlackFunds"}

def to_base58(hex20: str) -> str:
    raw = bytes.fromhex("41" + hex20)
    raw += hashlib.sha256(hashlib.sha256(raw).digest()).digest()[:4]
    n, out = int.from_bytes(raw, "big"), ""
    alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    while n:
        n, r = divmod(n, 58)
        out = alphabet[r] + out
    return out

def decode(calldata: str):
    h = calldata.lower().removeprefix("0x")
    if not h.startswith(SUBMIT):
        return None
    body = h[8:]
    off = int(body[128:192], 16) * 2        # offset of `bytes data`
    size = int(body[off:off + 64], 16) * 2
    inner = body[off + 64:off + 64 + size]  # selector + padded address
    method = CALLS.get(inner[:8])
    return (method, to_base58(inner[-40:])) if method else None

events = requests.get(f"{API}/v1/contracts/{MULTISIG}/events",
    params={"event_name": "Submission", "limit": 5,
            "order_by": "block_timestamp,desc"}, timeout=30).json()["data"]

for ev in events:
    tx = requests.post(f"{API}/wallet/gettransactionbyid",
        json={"value": ev["transaction_id"]}, timeout=30).json()
    data = tx["raw_data"]["contract"][0]["parameter"]["value"].get("data", "")
    print(ev["result"]["transactionId"], ev["block_timestamp"], decode(data))
```

Production hardening the author adds: destination **must** equal the USDT contract, inner calldata must be exactly 36 bytes, anything else is classified `"other"` — never guessed.

### Has it executed yet? Free constant call

```bash
curl -s -X POST https://api.trongrid.io/wallet/triggerconstantcontract \
  -H 'Content-Type: application/json' \
  -d '{"owner_address": "TBPxhVAsuzoFnKyXtc1o2UySEydPHgATto",
       "contract_address": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
       "function_selector": "isBlackListed(address)",
       "parameter": "000000000000000000000000<20-byte hex, no 41 prefix>",
       "visible": true}'
# constant_result ends in ...01 if frozen, ...00 if not
```

## Joining proposals to freezes

The join key is the transaction hash: the freeze tx carries **both** `AddedBlackList` (USDT) and `Execution(transactionId)` (multisig) under one `transaction_id`; the id links back to `Submission` for the proposal time. Pull four event streams (`Submission`, `Confirmation`, `Execution` on the multisig; `AddedBlackList` on USDT), page with the `fingerprint` cursor, and fetch submissions with a **30-day margin** before your window — proposals can be much older than their execution. Operational notes: TronGrid paginates at 200/page and rate-limits anonymous clients (back off on non-200); unconfirmed-block events can vanish — drop a pending proposal only after two consecutive missing polls and reconcile every 10 minutes against `AddedBlackList`.

## What a year of freezes looks like (Nov 2025 – Nov 2026)

- **4,221 `AddedBlackList` events / 4,199 addresses — all matched a multisig proposal**, each with exactly two confirmations.
- **Median proposal→freeze gap: 9.7 minutes.** 30% (1,257) waited >1 hour; 338 >6 hours; 35 >1 day; longest window **167 hours**.
- Inside freeze windows, the 3,476 still-frozen addresses moved **65.4M USDT out — 2.3x the 27.9M** in the equal pre-proposal baseline (1.42M transfers analyzed). Correlation, not proof of insider monitoring — which is exactly why the baseline matters.

**Forensic takeaway**: for AML/compliance, the actionable signal is the *proposal*, not the freeze event — minutes to days of public warning that `AddedBlackList`-based tools throw away.

## References

- [Reading Tether's TRON multisig: USDT freezes are public before they land — DEV.to](https://dev.to/freeze_check_d8bafeeb80db/reading-tethers-tron-multisig-usdt-freezes-are-public-before-they-land-59lj)
- [The signing window — full method, CSV, Zenodo DOI](https://freezecheck.org/research/freeze-window-en.html)
- [USDT Blacklist 2026: Who's On It, How Tether Decides — BlockSec](https://blocksec.com/blog/usdt-blacklist-explained-2026)
- [The Tether Freeze Regime: Every USDT Freeze Audited — Bitquery](https://bitquery.io/investigations/tether-blacklist-audit)
