# Zara Nikah — Android app setup

This folder documents the free local build workflow for the Android Trusted Web Activity (TWA).
The production website is kept separate; the Android work is on branch `android-zara-nikah`.

## App identity
- Display name: Zara Nikah
- Package ID: com.zaranikah.app
- Web origin: https://zarashadiservice.vercel.app
- Web manifest: https://zarashadiservice.vercel.app/manifest.webmanifest

## Important
- Do not upload a release until the Play Console developer account is approved.
- Keep the Android signing keystore and its passwords backed up privately. Never commit them to GitHub.
- A Trusted Web Activity requires Digital Asset Links. After the final signing certificate is created, publish its SHA-256 fingerprint in:
  `https://zarashadiservice.vercel.app/.well-known/assetlinks.json`
- The TWA is only suitable if the website is reliable, mobile-friendly, secure (HTTPS), and meets Google Play policies. Test all login, payment, profile, chat, and notification flows before release.
- The existing website's service fees (₹99/₹299) must be reviewed against Google Play's payments policy before enabling those payment flows inside the Android app. AdMob ads are separate.

## Free local build tools (Windows)
1. Install Node.js LTS and Java JDK 17.
2. Install Android Studio (for the free Android SDK and build tools).
3. Open PowerShell and run:
   `npm install -g @bubblewrap/cli`
4. Create a separate build folder outside this website project, then run:
   `bubblewrap init --manifest https://zarashadiservice.vercel.app/manifest.webmanifest`
5. When prompted, use package ID `com.zaranikah.app` and app name `Zara Nikah`.
6. Build a test bundle with:
   `bubblewrap build`
7. Before Play upload, complete Digital Asset Links verification and test the signed app on real Android phones.

Bubblewrap, Node.js, Java, and Android Studio can be used without a paid monthly subscription. Google Play developer registration has its separate one-time fee.
