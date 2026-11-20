---
title: Idempotent Review-Request Emails with Python, a JSON State File, and Cron
diataxis: Example
domain: developer-tools-practices
topic: workflow-automation
source: DEV.to Tech News
source_url: https://dev.to/greatest7/automate-review-requests-with-40-lines-of-python-h4h
date: 2026-11-20
keywords:
- knowledge-base
- workflow-automation
- developer-tools-practices
- examples
---
# Idempotent Review-Request Emails with Python, a JSON State File, and Cron

A ~40-line pattern for one-shot, at-most-once outbound notifications from a flat data source: read finished jobs from CSV, email a request, send exactly one reminder after N days, and persist contact state in a small JSON file so nobody is asked twice. The pattern generalizes to any "nudge once, remind once, then stop" workflow (feedback surveys, invoice follow-ups, onboarding check-ins).

## Design

- **Trigger**: row with `status == "done"` and empty `reviewed` column in `jobs.csv`.
- **Ask**: one short email with one link.
- **Reminder**: exactly one follow-up ≥ 4 days after the first ask, then stop.
- **State**: `sent.json` keyed by job id — the idempotency mechanism. Deleting it re-asks everyone; treat it as the source of truth and back it up.

`jobs.csv`:

```csv
id,name,email,status,reviewed
101,Dana,dana@example.com,done,
102,Lee,lee@example.com,in_progress,
```

## The script

```python
import csv, json, os, smtplib
from datetime import date, timedelta
from email.message import EmailMessage
from pathlib import Path

REVIEW_LINK = "https://example.com/review"
STATE = Path("sent.json")
state = json.loads(STATE.read_text()) if STATE.exists() else {}

def send(to, subject, body):
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = os.environ["SMTP_USER"], to, subject
    msg.set_content(body)
    with smtplib.SMTP_SSL(os.environ["SMTP_HOST"], 465) as s:
        s.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"])
        s.send_message(msg)

today = date.today()
with open("jobs.csv", newline="") as f:
    for job in csv.DictReader(f):
        if job["status"] != "done" or job["reviewed"]:
            continue
        record = state.get(job["id"])
        if record is None:
            send(job["email"], "Quick favor?",
                 f"Hi {job['name']},\n\nThanks again for working with me. "
                 f"If you're happy with the result, would you leave a quick review?\n\n{REVIEW_LINK}")
            state[job["id"]] = {"asked": today.isoformat(), "reminded": False}
        elif not record["reminded"] and today - date.fromisoformat(record["asked"]) >= timedelta(days=4):
            send(job["email"], "Just a gentle nudge",
                 f"Hi {job['name']}, no pressure at all. Here's the link if you have a minute:\n\n{REVIEW_LINK}")
            record["reminded"] = True

STATE.write_text(json.dumps(state, indent=2))
```

## Scheduling

Credentials come from the environment (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — use an app password, not your account password), then:

```cron
0 9 * * 1-5 cd /path/to/reviews && python3 review_requests.py
```

Every weekday at 09:00 it asks newly finished clients and nudges anyone due — exactly once, because the state file records `asked`/`reminded` per job id.

## Hardening notes (not in the original)

- The state file is written once at the end: a crash mid-run loses that run's updates and can re-send the day's emails. For production, write atomically (temp file + `os.replace`) and record the send *before* sending (at-least-once beats at-most-once for spam risk).
- `smtplib.SMTP_SSL(..., 465)` only; for START-on port 587 use `smtplib.SMTP(...)` + `starttls()`. Pass `timeout=30` to the constructor — the default is *no timeout*, so a hung SMTP connection blocks the cron run indefinitely (and later cron ticks can pile up).
- Wrap each `send()` in try/except and only flip `asked`/`reminded` on success; transient `SMTPServerDisconnected`/`SMTPResponseException` should leave the record unset so the next tick retries — but catch `SMTPAuthenticationException` separately and abort, or you'll loop a bad app password into provider lockout.
- Marking `reviewed` in the CSV is manual — wire it to a webhook or your review platform's export instead.
- Practical extensions: pull jobs from a CRM API instead of CSV, route negative replies to support instead of the public review page, log testimonials for reuse.

## References

- [Original post: Automate Review Requests With 40 Lines of Python (DEV.to)](https://dev.to/greatest7/automate-review-requests-with-40-lines-of-python-h4h)
- [Python smtplib docs](https://docs.python.org/3/library/smtplib.html)
- [Python email.message docs (EmailMessage)](https://docs.python.org/3/library/email.message.html)
- Related KB: [howto-qualify-inbound-leads-by-domain-apify-n8n](../../../how-to/developertoolspractices/workflowautomation/howto-qualify-inbound-leads-by-domain-apify-n8n.md)
