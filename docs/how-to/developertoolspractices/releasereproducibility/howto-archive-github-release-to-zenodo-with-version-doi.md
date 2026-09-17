---
title: How to Archive a GitHub Release to Zenodo with a Version DOI and Verify the
  Result
diataxis: How-to Guide
domain: developer-tools-practices
topic: release-reproducibility
source: DEV.to Tech News
source_url: https://dev.to/dmytronasyrov/github-release-to-zenodo-doi-265f
date: 2026-09-17
keywords:
- knowledge-base
- release-reproducibility
- developer-tools-practices
- how-to
---
# How to Archive a GitHub Release to Zenodo with a Version DOI and Verify the Result

A GitHub release can exist before its Zenodo archive is ready; a DOI can resolve while the metadata still misrepresents the files; a discovery service can list the record without having checked whether the software works. **Treating those events as one success state makes a release hard to reproduce and easy to describe incorrectly.** This note follows a real release (v1.1.0 of an LLM-as-a-judge cost calculator) through those boundaries and produces a small *verification receipt* telling the next developer exactly what was preserved and what each check established.

## Step 1 — Start with the object someone will cite

Pick the smallest package that supports independent use: source, install/run instructions, dependency info, representative tests, and the data needed for the documented example. If a benchmark depends on a private dataset, say what's unavailable and how that limits reproduction. Preserve the **invocation** as well as the program — a DOI pointing at the right code doesn't tell a reader which options produced a reported number; put those inputs in a run manifest with expected outputs and tolerances.

Record identities separately:

| Object | Identifier (example) | What it identifies |
| --- | --- | --- |
| GitHub release | `v1.1.0` | The named release + notes |
| Git commit | `67b6d1d9…` | Source revision resolved from that tag |
| Zenodo record | `21963489` | Published archive + metadata |
| Version DOI | `10.5281/zenodo.21963489` | This particular archived version |
| Concept DOI | `10.5281/zenodo.21963488` | The work across its versions |

Record the commit **separately from the tag**: GitHub's release response reported `immutable: false`, so a release URL alone does not establish immutability — the version DOI and retained archive checksum provide different evidence than a mutable repository page.

## Step 2 — Preflight before enabling automatic deposits

- Check actual archive contents (generated binaries, submodules, large files, separately-hosted assets) — a successful source archive doesn't prove every README resource was deposited.
- Remove secrets, private config, customer records, accidental build outputs **before** tagging; decide authorship from contributions, verify creator name/affiliation/ORCID against the intended citation.
- Confirm publishing every included file is intended. A repository-level license badge is too coarse for a package with differently-licensed components — an archive cannot repair missing permission by assigning an identifier.
- Enabling the Zenodo GitHub integration and creating the release are **separate steps**: syncing the repo list + enabling the repo is preparation; only creating the GitHub release triggers the deposit. Don't read a successful account connection as evidence the right repository is enabled.

## Step 3 — Give citation metadata one clear owner

Keep `CITATION.cff` in the repo root for GitHub's citation UI, and note that Zenodo also accepts `.zenodo.json`. **Precedence matters**: when both exist, the GitHub archiving integration uses `.zenodo.json` and *ignores* `CITATION.cff` — it does not merge them. A corrected author in CFF cannot compensate for a stale creator in the JSON file. Assign an owner per repeated field (e.g., require title/version/creators to agree across both files, reserve Zenodo-specific related identifiers for JSON).

Validate the **exact files contained in the tag** — checking only the default branch after publication can inspect a later correction that never entered the archive. JSON syntax validation catches malformed JSON but not an inappropriate identifier/relationship/license choice; schema validity and correct citation intent are separate checks.

## Step 4 — Choose a version DOI for reproducible claims

Zenodo distinguishes a **version DOI** (one specific version) from a **concept DOI** (the work across versions); the first publication creates both, later versions get their own version identifiers. Use the *version* DOI when a result depends on the exact software/data you used; use the *concept* DOI for describing the evolving project. Both may resolve to the same record at a point in time — that shared destination does **not** make their meanings interchangeable. Store both with explicit field names, not one ambiguous `doi` copied from whichever badge was easiest to find. Keep release version, publication date, and data-verification date separate (a price registry "verified August 13" is not current in September).

## Step 5 — Preserve mixed licenses across representations

The example assigns MIT to source code/static app and CC BY 4.0 (via `DATA-LICENSE.md`) to normalized pricing records under specific paths. Two license names without file scope can be misread as offering a choice of terms for every file; keep the file-level explanation inside the archive *and* in record metadata. A September inspection found three different representations of the same release: archived JSON retained `other-open`, the legacy Records API exposed a single MIT object + notes, while DataCite's `rightsList` and OAI-PMH each included MIT **and** CC BY 4.0 — so reading only `metadata.license.id` would have produced an incomplete account. Compare rights arrays, human-readable notes, *and* actual license files before declaring the metadata preserved every condition.

## Step 6 — Publish once, then reconcile the integration result

Use separate operational states: **release published → ingestion pending → record published → DOI resolved → metadata verified**, storing a timestamp + evidence URL for each. When ingestion reports a metadata error, inspect it for that exact release and correct the responsible metadata before deciding on a new release. When the result is merely *unknown* (a timed-out request), first look for an existing matching record — repeating publication immediately can create another object without resolving uncertainty about the first. Tie any retry to repository + tag + resolved commit; never interpret an empty response as permission for a fresh deposit. For CI, put preflight checks before release creation and verification after it; keep publication credentials out of the read-only verifier.

## Step 7 — Verify the archive and exported metadata (read-only)

A bounded set of public, read-only requests makes each box require its own observation — a successful archive does not certify software correctness or completion in every downstream service:

```python
import hashlib, json
from pathlib import Path
from urllib.request import urlopen
import xml.etree.ElementTree as ET

DOI = "10.5281/zenodo.21963489"
RECORD = "21963489"

def read(url, filename):
    with urlopen(url, timeout=30) as response:
        payload = response.read()
    Path(filename).write_bytes(payload)
    return payload

record = json.loads(read(f"https://zenodo.org/api/records/{RECORD}", "record.json"))
assert record["doi"] == DOI
assert record["metadata"]["version"] == "1.1.0"
assert record["status"] == "published"

files = record["files"]
archive = read(files[0]["links"]["self"], "release.zip")
assert len(archive) == files[0]["size"]
assert "md5:" + hashlib.md5(archive).hexdigest() == files[0]["checksum"]

attributes = json.loads(read(f"https://api.datacite.org/dois/{DOI}", "datacite.json"))["data"]["attributes"]
assert attributes["state"] == "findable"
rights = {x.get("rightsIdentifier") for x in attributes["rightsList"]}
assert {"mit", "cc-by-4.0"} <= rights

oai = ET.fromstring(read(
    f"https://zenodo.org/oai2d?verb=GetRecord&metadataPrefix=oai_dc"
    f"&identifier=oai:zenodo.org:{RECORD}", "oai.xml"))
ns = {"o": "http://www.openarchives.org/OAI/2.0/"}
assert oai.find("o:error", ns) is None
```

Run it in an empty directory (it saves four response snapshots + the archive). It does not execute downloaded software, create a deposit, modify permissions, or require a token; any failed request or assertion stops the check. The useful deliverable is the **verification receipt** — what was preserved and what each check established — handed to the next developer.

## References

- [GitHub Release to Zenodo DOI (dev.to)](https://dev.to/dmytronasyrov/github-release-to-zenodo-doi-265f)
- [Zenodo: describe software with .zenodo.json](https://help.zenodo.org/docs/github/describe-software/zenodo-json/)
- [Zenodo DOI versioning explanation](https://support.zenodo.org/help/en-gb/1-upload-deposit/97-what-is-doi-versioning)
- [Zenodo license guidance for mixed uploads](https://help.zenodo.org/docs/deposit/describe-records/licenses/)
- [GitHub: referencing and citing content](https://docs.github.com/en/repositories/archiving-a-github-repository/referencing-and-citing-content)
