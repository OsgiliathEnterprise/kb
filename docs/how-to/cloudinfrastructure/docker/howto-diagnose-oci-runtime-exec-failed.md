---
title: How to Diagnose and Fix 'OCI runtime exec failed' in Docker
diataxis: How-to Guide
domain: cloud-infrastructure
topic: docker
source: DEV.to Tech News
source_url: https://dev.to/kalemi/docker-oci-runtime-exec-failed-32c1
date: 2026-11-15
keywords:
- knowledge-base
- docker
- cloud-infrastructure
- how-to
---
# How to Diagnose and Fix "OCI runtime exec failed" in Docker

`OCI runtime exec failed` comes from `docker exec`, **not** from starting a container — the runtime found the container and could not run the thing you named inside it. Look at the command and the container's state, never at the build. Exit code in the recorded run: **127**.

```text
--- docker exec exec-demo sh -c 'echo alpine has sh'
alpine has sh
--- docker exec exec-demo bash -lc 'echo unreachable'
OCI runtime exec failed: exec failed: unable to start container process:
exec: "bash": executable file not found in $PATH
```

The same container accepted an `sh` exec seconds before refusing `bash`. The container never changed — the command did.

## Exec failed vs create failed — the word after "OCI runtime" is the whole diagnosis

| What the line says | What to check first |
| --- | --- |
| `OCI runtime exec failed` | The binary you named, and whether the container is still up |
| `OCI runtime create failed` | The image CMD/ENTRYPOINT — the container never started |
| `executable file not found in $PATH` | Whether the tool is in the **image** (not the host) |
| `no such file or directory` on a path | Absolute path inside the container, and binary architecture |

## Four common causes

1. **The binary is not in the image.** Classic: `bash` on Alpine (ships BusyBox `sh`/`ash`, no bash). Same for `curl`, `ps`, `git`, even `sh` on smaller bases. Distroless may ship no shell at all; scratch has nothing but your binary.
2. **The container is not running any more.** Exec needs a live PID 1 to join — a service that exited on bad config, a compose service in a restart loop, or a container from an earlier step that finished. Half of these failures are really startup failures; people read the exec logs instead.
3. **The binary exists but is not on PATH.** Installed into an unusual prefix or a builder stage the final image doesn't carry. The PATH inside the container is the *image* PATH, not the PATH of the step that ran the exec.
4. **The command was a shell line, not an executable.** Pipes, redirects, globs, `&&` need a shell — Docker documents that the command must be an executable. Wrap in `sh -c`.

## Fixes

```bash
# Exec a shell the image actually ships; check before the pipeline does
docker exec app sh -c 'command -v bash || echo "no bash in this image"'
# If you need bash, install it in the image, not by hope
# RUN apk add --no-cache bash

# Prove the container is running first — turns an exec error into the startup error it is
docker ps --filter name=app --format '{{.Names}} {{.Status}}'
docker inspect -f '{{.State.Status}} {{.State.ExitCode}}' app

# Absolute path removes the resolution question
docker exec app sh -c 'command -v mytool || ls -l /usr/local/bin'
docker exec app /usr/local/bin/mytool --version

# Wrap shell syntax in a shell
docker exec app sh -c 'pg_isready -h localhost && echo ok'
```

Guard pattern for CI steps:

```yaml
- name: The container has to be up before we exec
  run: |
    state=$(docker inspect -f '{{.State.Status}}' app)
    echo "app is $state"
    [ "$state" = running ] || { docker logs --tail 50 app; exit 1; }
    docker exec app sh -c 'echo ready'
```

## Prevention checklist

- Standardize on `sh` for anything you exec in CI, whatever the base image.
- Check container state **before** every exec; print logs when it is down.
- Bake the tools your scripts need into the image rather than into the assumption.
- Pin the base image, so a shell present today is still present next month.

You cannot exec into a stopped container — there is no process namespace to join. Start a new container from the same image, or read the exited one's logs.

## References

- Original article: [Docker OCI runtime exec failed](https://dev.to/kalemi/docker-oci-runtime-exec-failed-32c1)
- [Docker docs: docker exec requirements](https://docs.docker.com/reference/cli/docker/container/exec/)
- [Docker docs: Dockerfile exec form vs shell form](https://docs.docker.com/reference/dockerfile/)
- [aquasecurity/trivy-action#415 — same error from an Action expecting bash](https://github.com/aquasecurity/trivy-action/issues/415)
