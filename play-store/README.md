# Zara Nikah — Play Store AAB

This directory is intentionally separate from the main Next.js web application.

## App
- Name: Zara Nikah
- Package ID: online.zaranikahservice.app
- TWA host: zarashadiservice.vercel.app

## Build
This project uses GoogleChromeLabs Bubblewrap to generate a signed Android App Bundle (AAB).

The release signing keystore must be preserved securely. Do not commit the keystore or passwords to GitHub.

## Important
The final TWA requires Digital Asset Links at:
https://zarashadiservice.vercel.app/.well-known/assetlinks.json

The SHA-256 fingerprint in that file must match the release signing certificate used for the Play Store upload key.
