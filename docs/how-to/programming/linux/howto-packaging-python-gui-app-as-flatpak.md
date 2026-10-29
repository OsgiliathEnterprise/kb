---
title: Packaging a Python GUI Project as a Flatpak (GNOME Platform 51 + Node)
diataxis: How-to Guide
domain: programming
topic: linux
source: DEV.to Tech News
source_url: https://dev.to/virajsh/how-to-create-a-flatpak-of-a-python-gui-project-4fln
date: 2026-10-29
keywords:
- knowledge-base
- linux
- programming
- how-to
---
# Packaging a Python GUI Project as a Flatpak (GNOME Platform 51 + Node)

Worked example from the article: **Uniclare Client**, a PyWebView + Node/React GUI app (app id `io.github.viraj_sh.uniclare_client`), packaged on **GNOME Platform 51** with the **node26** SDK extension so the React frontend can be built inside the sandbox. All packaging files live under `packaging/flatpak/`.

## 1. Install required tools and base flatpak packages

```bash
apt install flatpak flatpak-builder pipx appstream unzip
```

From flatpak: the latest Node extension and GNOME (SDK & Platform):

```bash
flatpak install org.freedesktop.Sdk.Extension.node26
flatpak install org.gnome.Sdk//51
flatpak install org.gnome.Platform//51
```

The pip and node generators, from flatpak-builder-tools:

```bash
wget https://raw.githubusercontent.com/flatpak/flatpak-builder-tools/master/pip/flatpak-pip-generator.py

wget https://github.com/flatpak/flatpak-builder-tools/archive/refs/heads/master.zip
unzip master.zip "flatpak-builder-tools-master/node/*"
pipx install ./flatpak-builder-tools-master/node/
```

Verify python exists and check its version in the GNOME SDK:

```bash
flatpak run --command=python3 org.gnome.Sdk//51 --version
```

## 2. Packaging files

In the `packaging/flatpak` directory in the repo root, add the `.desktop`, `.xml`, `.svg` and `.yml` files.

### `io.github.viraj_sh.uniclare_client.desktop`

```ini
[Desktop Entry]
Name=Uniclare Client
Exec=unidesk
Icon=io.github.viraj_sh.uniclare_client
Terminal=false
Type=Application
Categories=Utility;
StartupWMClass=unidesk
```

### `io.github.viraj_sh.uniclare_client.metainfo.xml`

AppStream metadata: `id`, `launchable` (desktop-id), `developer`, `releases`, `content_rating`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>io.github.viraj_sh.uniclare_client</id>
  <name>Uniclare Client</name>
  <summary>View data that is hidden on the Uniclare App or Student Portal</summary>
  <metadata_license>MIT</metadata_license>
  <project_license>MIT</project_license>
  <description>
    <p>Uniclare Client lets you view data that is hidden on the Uniclare App or Student Portal.</p>
  </description>
  <launchable type="desktop-id">io.github.viraj_sh.uniclare_client.desktop</launchable>
  <developer id="io.github.viraj_sh">
    <name>viraj-sh</name>
  </developer>
  <url type="homepage">https://github.com/viraj-sh/uniclare-client</url>
  <content_rating type="oars-1.1"/>
  <releases>
    <release version="3.0.0" date="2026-10-25"/>
  </releases>
</component>
```

### `io.github.viraj_sh.uniclare_client.yml` (flatpak-builder manifest)

```yaml
id: io.github.viraj_sh.uniclare_client
runtime: org.gnome.Platform
runtime-version: '51'
sdk: org.gnome.Sdk
sdk-extensions:
  - org.freedesktop.Sdk.Extension.node26
command: unidesk

finish-args:
  - --share=network
  - --share=ipc
  - --socket=wayland
  - --socket=fallback-x11
  - --socket=system-bus
  - --device=dri
  - --env=PYWEBVIEW_GUI=gtk
  - --env=SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

modules:
  - python3-deps.json
  - python3-uv-build.json
  - name: uniclare-client
    buildsystem: simple
    build-options:
      append-path: /usr/lib/sdk/node26/bin
      strip: true
    build-commands:
      - cd web && npm ci --offline --cache=$FLATPAK_BUILDER_BUILDDIR/flatpak-node/npm-cache && npm run build
      - pip3 install --prefix=/app --no-deps --no-build-isolation .
      - install -Dm644 packaging/flatpak/io.github.viraj_sh.uniclare_client.desktop /app/share/applications/io.github.viraj_sh.uniclare_client.desktop
      - install -Dm644 packaging/flatpak/io.github.viraj_sh.uniclare_client.metainfo.xml /app/share/metainfo/io.github.viraj_sh.uniclare_client.metainfo.xml
      - install -Dm644 packaging/flatpak/io.github.viraj_sh.uniclare_client.svg /app/share/icons/hicolor/scalable/apps/io.github.viraj_sh.uniclare_client.svg
    sources:
      - type: dir
        path: ../..
      - generated-sources.json
```

Validate the metainfo file:

```bash
appstreamcli validate --pedantic packaging/flatpak/io.github.viraj_sh.uniclare_client.metainfo.xml
```

## 3. Dependencies

Generate `requirements.txt` and remove the PyQt/GNOME-related libraries, since the flatpak GNOME base package already provides them:

```bash
uv pip compile pyproject.toml --extra desktop -o requirements.txt

grep -viE '^(pyqt6|qtpy|pygobject|pycairo)' requirements.txt > requirements.clean.txt && mv requirements.clean.txt requirements.txt
```

Generate `python3-deps.json` (app dependency wheels built against the GNOME 51 SDK):

```bash
export SSL_CERT_FILE=$(python3 -m certifi) # optional nixos

python3 flatpak-pip-generator.py \
  --runtime='org.gnome.Sdk//51' \
  --prefer-wheels=pydantic-core \
  --requirements-file=requirements.txt \
  --output ./packaging/flatpak/python3-deps
```

Generate `python3-uv-build.json` (the `uv_build` backend wheel, so `uv` can build the project inside the sandbox):

```bash
uv pip install pip
python -m pip download "uv_build>=0.11.21,<0.12.0" --only-binary=:all: --no-deps -d /tmp/uvb
ls /tmp/uvb   # confirm a .whl is present

echo "uv_build==0.11.33" > uvb.txt
python3 flatpak-pip-generator.py \
  --runtime='org.gnome.Sdk//51' \
  --prefer-wheels=uv_build \
  --requirements-file=uvb.txt \
  --output ./packaging/flatpak/python3-uv-build
```

Generate `generated-sources.json` (npm sources for the frontend, derived from the lockfile):

```bash
flatpak-node-generator npm web/package-lock.json -o generated-sources.json
```

## 4. Build & test locally

Build:

```bash
flatpak-builder --user --force-clean --install-deps-from=flathub --disable-rofiles-fuse build-dir ./packaging/flatpak/io.github.viraj_sh.uniclare_client.yml
```

Install (into a local repo):

```bash
flatpak-builder --user --force-clean --install-deps-from=flathub --install --repo=repo build-dir ./packaging/flatpak/io.github.viraj_sh.uniclare_client.yml
```

Run the app:

```bash
flatpak run io.github.viraj_sh.uniclare_client
```

### Sandbox caveats (from the manifest `finish-args`)

- `--socket=wayland` + `--socket=fallback-x11` + `--device=dri`: GUI rendering — Wayland primary with an X11 fallback and GPU access.
- `--share=network` + `--env=SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt`: PyWebView makes network requests, and the sandbox has no default CA bundle — point it at the CA file inside the runtime.
- `--env=PYWEBVIEW_GUI=gtk`: force the GTK backend of pywebview (there is no Qt in the GNOME sandbox).
- `--share=ipc` + `--socket=system-bus`: D-Bus access for desktop integration.
- The frontend is built offline inside the build: `npm ci --offline` against the node cache produced by `flatpak-node-generator`, with `/usr/lib/sdk/node26/bin` appended to PATH.

## 5. Create a bundle

```bash
flatpak build-bundle ./packaging/flatpak/repo uniclare-client.flatpak io.github.viraj_sh.uniclare_client
```

Check the bundle size:

```bash
ls -lh uniclare-client.flatpak
```

## Clean up

```bash
flatpak uninstall --user -y io.github.viraj_sh.uniclare_client || true
flatpak uninstall --user --unused -y || true
rm -rf ./packaging/flatpak/build-dir ./packaging/flatpak/repo
rm -rf ~/.var/app/io.github.viraj_sh.uniclare_client
rm -rf .flatpak-builder
```

## Version status (2026-10-29)

- `org.gnome.Platform//51` and `org.gnome.Sdk//51` are available from Flathub (confirmed by multiple 2026 app projects using them) — the manifest above is current.
- The `node26` SDK extension is the current Node extension line.
- Runtime note: the 32-bit compatibility extension was dropped with GNOME 49 — the runtime is 64-bit/ARM64-only, which is fine for this manifest (no `x86`-specific assumptions).

## References

- [How to create a flatpak of a python gui project (DEV.to)](https://dev.to/virajsh/how-to-create-a-flatpak-of-a-python-gui-project-4fln)
- [flatpak-builder documentation](https://docs.flatpak.org/en/latest/)
