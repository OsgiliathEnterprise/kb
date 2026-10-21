---
title: Setting Up SSH Keys on macOS with Touch ID (Secure Enclave CryptoTokenKit Identities)
diataxis: How-to Guide
domain: security-privacy
topic: ssh
source: HackerNews
source_url: https://nmattia.com/posts/2026-10-19-setting-up-ssh-keys-touch-id/
date: 2026-10-21
keywords:
- knowledge-base
- ssh
- security-privacy
- how-to
---
# Setting Up SSH Keys on macOS with Touch ID (Secure Enclave CryptoTokenKit Identities)

macOS has a built-in **Secure Enclave** where you can create "identities" (CryptoTokenKit / CTK identities) whose private key material **cannot be extracted** — unless you've made enemies with a nation state. Those identities are protected with Touch ID and work for SSH authentication, including git-over-ssh (e.g. GitHub).

Benefits over traditional `~/.ssh/id_ed25519` key files:

- private material cannot be extracted, is never shown, cannot be stolen
- you get a Touch ID prompt whenever the identity is used
- no key files littering the filesystem (and no risk of deleting them)

Caveat to accept: if your Mac dies, so does the identity — you create a new one and re-register it wherever it was added (GitHub, etc.).

## Quick setup (3 commands)

**Step 1 — create the identity** (run once; prompts for Touch ID):

```bash
sc_auth create-ctk-identity -l ssh-key -k p-256-ne -t bio
```

**Step 2 — tell SSH to use the identity** (run after each reboot; when prompted for a PIN, just hit enter):

```bash
ssh-add -K -S /usr/lib/ssh-keychain.dylib
```

From here on, SSH uses the Secure Enclave identity for authentication.

**Step 3 — register the key with a server** (e.g. GitHub):

```bash
ssh-add -L
```

Use the line that starts with `sk-ecdsa-sha2-nistp256...` — that's the shareable handle for the identity, and it's the key you add to GitHub. Then:

```bash
git push   # triggers a Touch ID prompt
```

## Under the hood

**Identities** are managed with `sc_auth` (the `sc_` stands for Smart Card). In Apple-speak they are "CryptoTokenKit" (CTK) identities — in practice, private keys stored on the Secure Enclave:

```bash
$ sc_auth list-ctk-identities
Key Type Public Key Hash                          Prot Label
p-256-ne 458F712F281B53C683F23FC02E69D44DAFDAA3DE bio  ssh-key
```

Creation: `sc_auth create-ctk-identity -l <label> -k <key type> -t <protection>`. Accepted key types: `p-256 | p-384 | p-521 | p-256-ne | p-384-ne`. The `-ne` suffix means **Non-Extractable** — the key is generated inside the enclave and cannot leave it. For SSH you only need *signing*, done by (and on) the enclave, so the private key is never exported. `p-384` is not supported by (Open)SSH, which narrows the choice to `p-256-ne`.

**ssh-keychain.dylib** is Apple's bridge that lets `ssh` treat the Secure Enclave as a FIDO-style authenticator:

```bash
ssh-add -K -S /usr/lib/ssh-keychain.dylib
```

The PIN prompt is a quirk: `ssh-add` assumes a USB/YubiKey-style authenticator and asks for a PIN; with the keychain dylib the security comes from Touch ID, so just hit enter.

**Sign-in flow:** during SSH authentication the server sends a challenge; the Secure Enclave signs it (behind a Touch ID prompt); the signature proves possession of the identity without ever exposing the key.

Much of this is undocumented — the author's mental model comes from man pages, a community investigation gist (arianvp), and experimentation. The vocabulary ("Smart Card", "CryptoTokenKit") is confusing, but the practical setup above is stable.

## References

- [Setting up SSH keys on macOS with Touch ID (nmattia.com)](https://nmattia.com/posts/2026-10-19-setting-up-ssh-keys-touch-id/)
- [arianvp's investigation gist on Secure Enclave SSH keys](https://gist.github.com/arianvp/5f59f1783e3eaf1a2d4cd8e952bb4acf)
- [Protect your SSH keys with Touch ID on macOS (korben.info) — independent write-up of the same `sc_auth` / `ssh-keychain.dylib` flow](https://korben.info/en/protect-ssh-keys-touch-id-macos.html)
- [Authenticating SSH sessions with the Secure Enclave (Evan Pratten) — confirms `sc_auth create-ctk-identity -k p-256-ne -t bio` usage](https://ewpratten.com/blog/ssh-secure-enclave/)
