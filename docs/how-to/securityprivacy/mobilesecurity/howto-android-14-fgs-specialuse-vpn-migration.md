---
title: Migrating an Android VPN Foreground Service to specialUse on Android 14
diataxis: How-to Guide
domain: security-privacy
topic: mobile-security
source: DEV.to Tech News
source_url: https://dev.to/cjdarklord/android-14-foreground-services-the-specialuse-migration-that-saved-our-vpn-2df7
date: 2026-11-16
keywords:
- knowledge-base
- mobile-security
- security-privacy
- how-to
---
# Migrating an Android VPN Foreground Service to specialUse on Android 14

**Problem:** On Android 14 (API 34) a non-system app cannot start a foreground service typed `systemExempted`: `startForeground()` throws `SecurityException`, the service silently loses foreground priority and dies in the background — and because the exception is caught, the app never crashes, so the bug hides behind "the app still opens fine". For a `VpnService`-based client that is not a system app, the working combination is **`specialUse` + `FOREGROUND_SERVICE_SPECIAL_USE` permission + a `vpn` subtype property**.

## Why `systemExempted` is a dead end

`FOREGROUND_SERVICE_SYSTEM_EXEMPTED` has **`signature|privileged`** protection level — a regular Play-distributed app can never hold it, no matter how "daemon-like" its job (VPN, antivirus look-alikes). On Android ≤ 13 the type was barely enforced so the mistake shipped unnoticed; API 34 enforces that every foreground service declares a type *and* that the app is allowed to use it, throwing `MissingForegroundServiceTypeException` or `SecurityException` depending on the violation.

## Step 1 — Manifest

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

<service
    android:name=".AppVpnService"
    android:exported="false"
    android:permission="android.permission.BIND_VPN_SERVICE"
    android:foregroundServiceType="specialUse">
    <property
        android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
        android:value="vpn" />
</service>
```

- `FOREGROUND_SERVICE_SPECIAL_USE` is a **normal** permission (install-time, no runtime prompt).
- The `PROPERTY_SPECIAL_USE_FGS_SUBTYPE` property states *why* specialUse is needed — Play reviewers read this declaration.

## Step 2 — Code: typed `startForeground` in try/catch

```kotlin
return try {
    val fgsType = if (Build.VERSION.SDK_INT >= 34) {
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
    } else 0

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && fgsType != 0) {
        startForeground(NOTIF_VPN_ID, notif, fgsType)
    } else {
        startForeground(NOTIF_VPN_ID, notif)
    }
    foregroundStarted = true
    log("SVC_FOREGROUND ok")
    true
} catch (e: Throwable) {
    Log.e(TAG, "startForeground failed: ${e.javaClass.simpleName}: ${e.message}")
    log("SVC_FOREGROUND fail error=${e.javaClass.simpleName}")
    false
}
```

Two rules:

1. **Always wrap `startForeground` in try/catch** — depending on API level it can throw `SecurityException`, `MissingForegroundServiceTypeException`, or `ForegroundServiceStartNotAllowedException`. Denied foreground must degrade visibly, not crash the app.
2. **Keep your own event log** ("black box"): `SVC_FOREGROUND ok` / `SVC_FATAL reason=...` lines. Swallowed exceptions otherwise look like "VPN sometimes doesn't work."

## Step 3 — Verify foreground actually started

1. Log/logcat shows `SVC_FOREGROUND ok`.
2. `dumpsys`:
   ```
   adb shell dumpsys activity services com.example.vpnclient | grep -i foreground
   ```
3. Behavior on Android 14: service survives screen-off for minutes, persistent notification stays visible. "App didn't crash" is **not** a pass condition.

## Pitfalls

- **Don't test only on old emulators.** The bug reproduced only on an API 34 image. Also beware arch mismatch: an arm64-only tunnel binary on an x86 emulator goes through ARM translation — foreground success on emulator is not a valid end-to-end VPN test; use a real arm64 Android 14+ device.
- **`systemExempted` is never for regular apps** — being a VPN is not an exemption reason.
- **Google Play requires an FGS declaration for `specialUse`** in Play Console or the release is rejected; other stores (RuStore, direct APK) don't gate it, but the subtype property still helps manual review. Reviewers check that the use case can't be classified as an existing type — VPN is usually accepted.
- **Don't borrow `connectedDevice` or `dataSync`** types for a VPN; if unsure, `specialUse` + honest subtype.
- **~5-second budget:** call `startForeground()` within ~5 s of `startForegroundService()`; do heavy init *after* it.
- **Silent regression:** if `startForeground` throws and you swallow it, Android kills the service in the background — check the *result*, not the absence of a crash.

## Checklist

- [ ] Manifest: `foregroundServiceType="specialUse"` + `FOREGROUND_SERVICE_SPECIAL_USE` + subtype property `vpn`
- [ ] SDK ≥ 34 path calls `startForeground(id, notif, FOREGROUND_SERVICE_TYPE_SPECIAL_USE)`
- [ ] `startForeground` wrapped in try/catch with logging
- [ ] Play Console FGS declaration filled (if on Play)
- [ ] Tested on a real Android 14+ arm64 device
- [ ] Log shows `SVC_FOREGROUND ok`

## References

- [Android 14 foreground services: the specialUse migration that saved our VPN — dev.to](https://dev.to/cjdarklord/android-14-foreground-services-the-specialuse-migration-that-saved-our-vpn-2df7)
- [Foreground service types — Android Developers](https://developer.android.com/develop/background-work/services/fgs/service-types)
