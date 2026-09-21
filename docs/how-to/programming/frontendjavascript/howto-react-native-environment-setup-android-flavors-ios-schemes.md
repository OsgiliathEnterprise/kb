---
title: How to Manage Dev/Prod/Staging Environments in React Native with Android Flavors
  and iOS Schemes
diataxis: How-to Guide
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/prabhasg56/react-native-environment-setup-managing-dev-prod-and-staging-builds-with-android-flavors-and-ios-1j2e
date: 2026-09-21
keywords:
- knowledge-base
- frontend-javascript
- programming
- how-to
---
# How to Manage Dev/Prod/Staging Environments in React Native with Android Flavors and iOS Schemes

Goal: one command decides the environment — `npm run android:dev`, `npm run ios:prod` — without editing source files before every build. The setup combines three pieces: **`react-native-config`** (env vars readable from JS *and* native code), **Android Product Flavors** (separate dev/prod Android apps), and **iOS Schemes + Build Configurations** (the iOS equivalent).

## 1. Start with `.env` files

```bash
# .env.dev
APP_ENV=dev
API_ENDPOINT=https://api.dev.example.com
JUSPAY_ENVIRONMENT=sandbox
BRANCH_TEST_MODE=true
MOENGAGE_APP_ID=dev-app-id

# .env.prod
APP_ENV=prod
API_ENDPOINT=https://api.example.com
JUSPAY_ENVIRONMENT=production
BRANCH_TEST_MODE=false
MOENGAGE_APP_ID=prod-app-id
```

The application code never knows which file is used — the build process selects it. **Values are baked in at BUILD time**: there is no runtime file reading, so changing a value requires a rebuild.

## 2. Why `react-native-config`

Some configuration must be available not only in JavaScript but also in native Android/iOS code:

```javascript
// JS
import Config from 'react-native-config';
console.log(Config.API_ENDPOINT);
```

```java
// Android
BuildConfig.API_ENDPOINT
```

```objc
// iOS
[RNCConfig envFor:@"API_ENDPOINT"];
```

## 3. Android Product Flavors

```groovy
android {
    flavorDimensions "environment"

    productFlavors {
        dev {
            dimension "environment"
            applicationId "com.example.app.dev"
            resValue "string", "app_name", "MyApp Dev"
        }
        prod {
            dimension "environment"
            applicationId "com.example.app"
            resValue "string", "app_name", "MyApp"
        }
    }
}
```

Different `applicationId`s mean both apps install side by side on one device — no uninstalling the production build to test dev. If `app_name` already exists in `strings.xml`, remove it there or you get a duplicate-resource build error.

### Variants: flavor + build type

Each flavor combines with each build type: `devDebug`, `devRelease`, `prodDebug`, `prodRelease`. So `./gradlew assembleProdRelease` builds the production release APK.

## 4. Connect flavors to `.env` files

In `android/app/build.gradle`:

```groovy
project.ext.envConfigFiles = [
    devdebug: ".env.dev",
    devrelease: ".env.dev",
    proddebug: ".env.prod",
    prodrelease: ".env.prod",
]

apply from: project(':react-native-config')
    .projectDir.getPath() + "/dotenv.gradle"
```

Mapping: `devDebug`/`devRelease` → `.env.dev`; `prodDebug`/`prodRelease` → `.env.prod`. Keys must be **lowercase** (flavor+buildType concatenated). The `apply from` line must come *after* the map.

## 5. Gotchas that cost real debugging time

- **`namespace` vs `applicationId` mismatch**: if they don't match, `react-native-config` can fail to find the generated `BuildConfig`. Fix with:
  ```groovy
  resValue "string", "build_config_package", "com.example.app"
  ```
  (`applicationId` identifies the app; `namespace` defines where classes are generated.) Symptom: `console.log(Config)` returns missing/empty values, then seemingly unrelated API failures.
- **ProGuard strips `BuildConfig` fields** in release builds (the library reads them via reflection). Add to `android/app/proguard-rules.pro`:
  ```pro
  -keep class com.example.app.BuildConfig { *; }
  ```
  Use the **namespace**, not the dev applicationId. Without it: debug works, release mysteriously returns empty values.
- **Tell React Native which variant is debuggable** (new architecture `react` block):
  ```groovy
  react {
      debuggableVariants = ["devDebug"]

      autolinkLibrariesWithApp()
  }
  ```
  Skip this and `devDebug` bundles the JS instead of connecting to Metro — you lose fast refresh with no error message.

## 6. Separate Firebase per flavor (no more swapping `google-services.json`)

```text
android/app/src/
├── main/
├── dev/
│   └── google-services.json
└── prod/
    └── google-services.json
```

Gradle selects the file by flavor: `devDebug` → `src/dev/google-services.json`, `prodRelease` → `src/prod/google-services.json`. Same pattern works for other per-flavor config, e.g. a Branch test-mode flag in flavor-specific manifests:

```xml
<!-- src/dev/AndroidManifest.xml -->
<meta-data android:name="io.branch.sdk.TestMode" android:value="true" />
<!-- src/prod/AndroidManifest.xml -->
<meta-data android:name="io.branch.sdk.TestMode" android:value="false" />
```

## 7. iOS: schemes + build configurations (different mechanism, same idea)

iOS has no product flavors. Instead:

1. **Duplicate the build configurations** in Xcode (Project → Info tab → Configurations): `Debug` → `Dev.Debug`, `Release` → `Dev.Release`.
2. **Create two schemes**: `MyApp` (prod; uses Debug/Release) and `MyApp-Dev` (uses Dev.Debug/Dev.Release). Mark both **Shared** so teammates and CI see them.
3. **Different bundle IDs per configuration** in Build Settings: `Debug`/`Release` → `com.example.app`, `Dev.Debug`/`Dev.Release` → `com.example.app.dev`. Both apps coexist on one iPhone. For the display name, add a user-defined setting `APP_DISPLAY_NAME` per configuration and reference it in `Info.plist`:
   ```xml
   <key>CFBundleDisplayName</key>
   <string>$(APP_DISPLAY_NAME)</string>
   ```
4. **Select the `.env` file with a Scheme Pre-action** (iOS has no flavor→file map):
   ```bash
   # MyApp-Dev scheme pre-action
   cp "${PROJECT_DIR}/../.env.dev" "${PROJECT_DIR}/../.env"

   # MyApp scheme pre-action
   cp "${PROJECT_DIR}/../.env.prod" "${PROJECT_DIR}/../.env"
   ```
   Then `react-native-config` reads `.env`. **Easy-to-miss detail**: in the pre-action, set **"Provide build settings from"** to your app target — otherwise `${PROJECT_DIR}` is empty, the copy silently fails, and you build against a stale `.env`.

## 8. Hide the complexity behind npm scripts

```json
{
  "scripts": {
    "android:dev": "react-native run-android --variant=devDebug",
    "android:prod": "react-native run-android --variant=prodRelease",
    "ios:dev": "react-native run-ios --scheme MyApp-Dev",
    "ios:prod": "react-native run-ios --scheme MyApp",
    "build:apk:dev": "cd android && ./gradlew assembleDevDebug",
    "build:apk:prod": "cd android && ./gradlew assembleProdRelease",
    "build:aab:prod": "cd android && ./gradlew bundleProdRelease"
  }
}
```

## 9. Verify the environment actually took effect

After a build, confirm which values were baked in (e.g. log `Config.API_ENDPOINT` on app start or inspect the generated `BuildConfig`). When Metro caches an old JS bundle, clear it (`npx react-native start --reset-cache`) before concluding the env file wasn't applied.

## Lessons from the article

- **Don't treat `.env` as the entire environment configuration** — native config (Firebase, Branch, manifests) lives in flavor/scheme-specific directories and files.
- **Give dev and prod different app IDs/bundle IDs** — side-by-side installation is one of the most useful parts of flavors/schemes.
- **Keep Firebase projects separate per environment** so dev builds never send Crashlytics/Analytics data to production.
- **Make the commands boring**: developers should run `npm run android:dev` and never think about Gradle variants or Xcode scheme names.

## References

- [React Native Environment Setup: Managing Dev, Prod, and Staging Builds with Android Flavors and iOS Schemes (dev.to, 2026-09-21)](https://dev.to/prabhasg56/react-native-environment-setup-managing-dev-prod-and-staging-builds-with-android-flavors-and-ios-1j2e)
- [react-native-config — envConfigFiles / dotenv.gradle documentation](https://github.com/react-native-config/react-native-config/)
- [Android Build Variants (developer.android.com)](https://developer.android.com/build/build-variants)
- [Xcode Build Configurations (developer.apple.com)](https://developer.apple.com/documentation/xcode/adding-a-build-configuration-file-to-your-project)
