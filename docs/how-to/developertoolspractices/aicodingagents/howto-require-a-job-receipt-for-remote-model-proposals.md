---
title: Require a Job Receipt — Apply Nothing the Schema Cannot Parse
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: DEV.to Tech News
source_url: https://dev.to/aiio_8140/require-a-job-receipt-apply-nothing-the-schema-cannot-parse-18dn
date: 2026-09-19
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# Require a Job Receipt — Apply Nothing the Schema Cannot Parse

A free remote model can draft a patch. It cannot be the process that mutates your tree. Treat every remote run as a **proposal**, and make the proposal a **job receipt** — JSON you can validate, store, and reject in one function. If the receipt fails the schema, the job is over. No debate, no "just apply it this once."

Unconstrained generation is easy to confuse with engineering. Models writing code is the boring part; what still fails is **inspection**. The goal is a gate you can run in CI — and a receipt *is* that gate. If you keep the model off your shell but then accept a diff by eyeballing a chat window, you are the weakest parser in the loop (you cannot grep a chat window in a PR). So stop asking the agent for "the fix" — ask it for a **receipt**.

## What you will build (five pieces)

1. `job_envelope.json` — what the remote job may see and return
2. `receipt.schema.json` — the only shape of a passing proposal
3. `fixtures/receipt.valid.json` + `fixtures/receipt.invalid.json` — two frozen examples
4. `verify_receipt.py` — the local verifier
5. `Makefile` — one target per stage so each gate can fail on purpose

Each stage has a verification step. **If a stage does not fail when it should, stop — the rest is theater.** This is a proposed workflow you can run locally, not a benchmark or durability promise.

## Stage 1 — Freeze the job envelope

Do not ship a working tree; ship a contract. The envelope names the task, the allowlist, and the exact test command you will rerun at home. **The file is the source of truth, not the chat.**

```json
{
  "job_id": "2026-09-18-receipt-001",
  "task": "Make format_rate return 0 when the input is empty.",
  "language": "python",
  "allowlist": ["src/rates.py", "tests/test_rates.py"],
  "test_command": "python -m pytest tests/test_rates.py -q",
  "constraints": {
    "must_not_touch": [".env", "secrets/", "infra/"],
    "patch_format": "unified_diff",
    "result_must_be": "proposal"
  }
}
```

Example subject (not a war story): `format_rate` in `src/rates.py` currently raises on `None` and does `int(value)`; the test wants `format_rate("") == 0`.

Verification (dull on purpose):

```bash
mkdir -p src tests fixtures
python -c "import json; json.load(open('job_envelope.json')); print('envelope: ok')"
test "$(python -c "import json; print(len(json.load(open('job_envelope.json'))['allowlist']))")" -ge 1
```

If `allowlist` is empty, you just authorized the void — fix it before talking to any model.

## Stage 2 — Write the receipt schema (the product)

The schema is the product; everything else is glue. Reject extra fields, a missing patch, and any status that isn't `proposal`. Agents love adding "notes," "confidence," and a surprise file — **surprise files are how `.env` dies.**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AgentJobReceipt",
  "type": "object",
  "additionalProperties": false,
  "required": ["job_id", "status", "files", "test_command", "patch", "notes"],
  "properties": {
    "job_id": { "type": "string", "minLength": 8 },
    "status": { "const": "proposal" },
    "files": {
      "type": "array",
      "minItems": 1,
      "maxItems": 16,
      "items": { "type": "string", "pattern": "^[a-zA-Z0-9_./-]+$" }
    },
    "test_command": { "type": "string", "minLength": 8 },
    "patch": { "type": "string", "minLength": 20 },
    "notes": { "type": "string", "maxLength": 500 }
  }
}
```

Verification: `python -c "import json; json.load(open('receipt.schema.json')); print('schema: ok')"`. If that fails, your schema isn't JSON — debug yourself before debugging the agent.

## Stage 3 — Two fixtures, one of them poisonous

Always keep a valid and an invalid receipt in git. The invalid one is **the unit test for your spine** — what does "the model said it compiled" even mean if you cannot fail a fixture?

`fixtures/receipt.valid.json` (truncated patch is enough for the parser):
```json
{
  "job_id": "2026-09-18-receipt-001",
  "status": "proposal",
  "files": ["src/rates.py"],
  "test_command": "python -m pytest tests/test_rates.py -q",
  "patch": "diff --git a/src/rates.py b/src/rates.py\n--- a/src/rates.py\n+++ b/src/rates.py\n@@ -1,4 +1,6 @@\n def format_rate(value: str) -> int:\n+    if value == \"\":\n+        return 0\n     if value is None:\n         raise ValueError(\"missing\")\n     return int(value)\n",
  "notes": "Empty string returns 0. None still raises."
}
```

`fixtures/receipt.invalid.json` should fail for **three reasons at once** — status `applied`, files include `.env`, test command is a shrug:
```json
{
  "job_id": "wrong-id",
  "status": "applied",
  "files": ["src/rates.py", ".env"],
  "test_command": "echo done",
  "patch": "not a diff",
  "notes": "looks good to me"
}
```

Verification is only "these files parse": `python -c "import json; json.load(open('fixtures/receipt.valid.json')); json.load(open('fixtures/receipt.invalid.json')); print('fixtures: ok')"`. You are not proving the patch is correct yet — you're proving you can store a lie and a candidate in the same folder.

## Stage 4 — The verifier (four checks, in order)

Install the one library needed: `python -m pip install jsonschema`. The verifier does four checks in order: **schema → envelope match → allowlist inclusion → patch path extraction.** Any check fails → exit 2; reserve exit 1 for "you called me wrong."

```python
#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from pathlib import Path
import jsonschema

DIFF_PATH = re.compile(r"^\+\+\+ b/(.+)$", re.M)

def load(path: Path):
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)

def main(argv: list[str]) -> int:
    if len(argv) != 4:
        sys.stderr.write("usage: verify_receipt.py ENVELOPE RECEIPT SCHEMA\n")
        return 1
    envelope = load(Path(argv[1]))
    receipt = load(Path(argv[2]))
    schema = load(Path(argv[3]))
    jsonschema.validate(instance=receipt, schema=schema)

    errors: list[str] = []
    if receipt["job_id"] != envelope["job_id"]:
        errors.append("job_id mismatch")
    if receipt["test_command"] != envelope["test_command"]:
        errors.append("test_command mismatch")
    allow = set(envelope["allowlist"])
    files = set(receipt["files"])
    if not files.issubset(allow):
        errors.append(f"files outside allowlist: {sorted(files - allow)}")
    paths = set(DIFF_PATH.findall(receipt["patch"]))
    if not paths:
        errors.append("patch has no +++ b/ paths")
    if not paths.issubset(allow):
        errors.append(f"patch paths outside allowlist: {sorted(paths - allow)}")
    if paths != files:
        errors.append(f"files field != patch paths: {sorted(files)} vs {sorted(paths)}")

    if errors:
        sys.stderr.write("\n".join(errors) + "\n")
        return 2
    print("receipt: ok")
    return 0

if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
```

Verification — **both directions, or the script is a decoration**:
```bash
chmod +x verify_receipt.py
python verify_receipt.py job_envelope.json fixtures/receipt.valid.json receipt.schema.json
echo "valid exit: $?"      # expect 0
python verify_receipt.py job_envelope.json fixtures/receipt.invalid.json receipt.schema.json
echo "invalid exit: $?"    # expect 2
```

## Stage 5 — The remote lane fills the same contract

The remote model (or any agent) produces a `receipt` that must satisfy the *same* schema and envelope. It never mutates your tree directly; it returns a proposal you run through `verify_receipt.py`. Only after the verifier exits 0 do you apply the patch — and even then, rerun `test_command` at home before trusting it.

## Why this works

- **The model is off your shell** — it can't touch files, secrets, or infra; it only returns JSON.
- **Inspection becomes mechanical** — a CI-runnable gate replaces eyeballing a chat window.
- **Failure is explicit and testable** — the poisonous fixture proves the verifier actually rejects bad input (exit 2), so the gate isn't theater.
- **The contract is versioned** — envelope + schema + fixtures live in git, so "what was allowed" is auditable.

## Diagram

![[job-receipt-workflow.excalidraw]]

## References
- [Require a Job Receipt. Apply Nothing the Schema Cannot Parse (DEV.to / aiio_8140)](https://dev.to/aiio_8140/require-a-job-receipt-apply-nothing-the-schema-cannot-parse-18dn)
