---
title: 'QSB-118: Dom0 Arbitrary Code Execution via qvm-copy-to-vm Error Reporting'
diataxis: Explanation
domain: security-privacy
topic: virtualization
source: HackerNews
source_url: https://www.qubes-os.org/news/2026/08/29/qsb-118/
date: 2026-08-31
keywords:
- knowledge-base
- virtualization
- security-privacy
- explanations
---
# QSB-118: Dom0 Arbitrary Code Execution via qvm-copy-to-vm Error Reporting

Qubes Security Bulletin 118 (2026-08-28) discloses a vulnerability where a **compromised qube can inject an arbitrary command into dom0** when the user copies a file *to* that qube with `qvm-copy-to-vm`. Because dom0 is the trusted control domain, this is effectively full Qubes OS takeover.

## Attack flow

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "b1", "type": "rectangle", "x": 40, "y": 200, "width": 200, "height": 95, "strokeColor": "#1e1e1e", "backgroundColor": "#f9d3d3", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Malicious qube\n(attacker-controlled)", "fontSize": 14, "fontFamily": 1}}, {"id": "b2", "type": "rectangle", "x": 270, "y": 200, "width": 210, "height": 95, "strokeColor": "#1e1e1e", "backgroundColor": "#ffe8cc", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "qfile protocol\ntransfer confirmation:\nchecksum + error code\n+ last filename", "fontSize": 14, "fontFamily": 1}}, {"id": "b3", "type": "rectangle", "x": 510, "y": 200, "width": 210, "height": 95, "strokeColor": "#1e1e1e", "backgroundColor": "#fff3bf", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "dom0 wait_for_result()\nsanitize_remote_filename()\nstrips only non-ASCII\nand double quotes", "fontSize": 14, "fontFamily": 1}}, {"id": "b4", "type": "rectangle", "x": 750, "y": 200, "width": 210, "height": 95, "strokeColor": "#1e1e1e", "backgroundColor": "#ffc9c9", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "display_error() -> system()\nkdialog/zenity shell cmd\nbuilt with attacker\nfilename", "fontSize": 14, "fontFamily": 1}}, {"id": "b5", "type": "rectangle", "x": 990, "y": 200, "width": 200, "height": 95, "strokeColor": "#1e1e1e", "backgroundColor": "#f9d3d3", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "DOM0 RCE\ntakeover of Qubes OS", "fontSize": 14, "fontFamily": 1}}, [{"id": "a1", "type": "arrow", "x": 240, "y": 247, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "a1_lbl", "type": "text", "x": 240, "y": 223, "width": 120, "height": 20, "text": {"content": ""}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}], [{"id": "a2", "type": "arrow", "x": 480, "y": 247, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "a2_lbl", "type": "text", "x": 480, "y": 223, "width": 120, "height": 20, "text": {"content": "error path"}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}], [{"id": "a3", "type": "arrow", "x": 720, "y": 247, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "a3_lbl", "type": "text", "x": 720, "y": 223, "width": 120, "height": 20, "text": {"content": "shell metachars survive"}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}], [{"id": "a4", "type": "arrow", "x": 960, "y": 247, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "a4_lbl", "type": "text", "x": 960, "y": 223, "width": 120, "height": 20, "text": {"content": ""}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}], {"id": "note1", "type": "text", "x": 270, "y": 330, "width": 880, "height": 40, "text": {"content": "Fix: qubes-core-dom0-linux 4.3.22 (Qubes 4.3 dom0). VM-side variant is NOT affected (uses execlp, not system())."}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}]}
```
## Root cause (two compounding bugs)

The `qfile` protocol sends a transfer confirmation back to dom0 containing a checksum, an error code, and **the name of the last received file**. On an error, dom0 displays that filename in a GUI dialog. Two defects combine:

1. **Insufficient sanitization.** `wait_for_result()` calls `sanitize_remote_filename()` on the attacker-controlled name before passing it to the error handler (`linux-utils/qrexec-lib/pack.c`):

```c
static void sanitize_remote_filename(char *untrusted_filename) {
    for (; *untrusted_filename; ++untrusted_filename) {
        if (*untrusted_filename < ' ' ||
            *untrusted_filename > '~' ||
            *untrusted_filename == '"')
            *untrusted_filename = '_';
    }
}
```

This replaces only non-printable characters and double quotes. **Shell metacharacters (`;`, `|`, `$()`, backticks, etc.) are left intact.**

2. **`system()` on attacker data.** The dom0 error handler builds a shell command with the unsanitized name and runs it through `system()` (`core-admin-linux/file-copy-vm/qfile-dom0-agent.c`):

```c
void display_error(const char *fmt, va_list args) {
    char buf[1024];
    (void) vsnprintf(buf, sizeof(buf), fmt, args);
    int ret = stat("/usr/bin/kdialog", &st_buf);
    #define KDIALOG_CMD "kdialog --title 'File copy/move error' --sorry "
    #define ZENITY_CMD  "zenity --title 'File copy/move error' --warning --text "
    asprintf(&dialog_cmd, "%s '%s: %s (error type: %s)'",
             ret == 0 ? KDIALOG_CMD : ZENITY_CMD,
             program_invocation_short_name, buf, strerror(errno));
    system(dialog_cmd);   // <-- attacker-controlled filename reaches the shell
}
```

So a crafted "filename" like `x'; <payload>; '` breaks out of the quoted argument and executes in dom0.

## Why only dom0 is affected

The **VM-side** variant of `qvm-copy-to-vm` uses `execlp("/usr/bin/zenity", ...)` with an argv array (no shell), so metacharacters are inert there. Only the dom0 agent funnels data through `system()`.

## Impact & remediation

- **Affected:** all Qubes OS releases.
- **Precondition:** attacker already controls a qube *and* the user initiates a `qvm-copy-to-vm` from dom0 to it (user-in-the-loop trigger).
- **Fix:** update dom0 package `qubes-core-dom0-linux` to **4.3.22** on Qubes 4.3 (migrating from security-testing to stable). No other user action required.

## Lessons for compartmentalized systems

- Treat *every* field that crosses a trust boundary as untrusted — including "metadata" like filenames in error reports, not just file contents.
- Prefer `execve`/argv over `system()` whenever a string from an untrusted source is interpolated into a command.
- Sanitization must be **allowlist-based** (keep only `[A-Za-z0-9._-]`) rather than blocklist-based; the blocklist here missed all shell metacharacters.

## References

- [QSB-118 announcement (qubes-os.org)](https://www.qubes-os.org/news/2026/08/29/qsb-118/)
- [qsb-118-2026.txt source + PGP signatures](https://github.com/QubesOS/qubes-secpack/blob/f65082c8211a421ed15a59219d6e54e93289fafb/QSBs/qsb-118-2026.txt)
