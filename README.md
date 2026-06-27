# lendmate-legal

Statische Website für [lendmate.dev](https://lendmate.dev) - Rechtliche Dokumente und Deep-Link-Infrastruktur der LendMate-App.

## Inhalt

| Pfad | Zweck |
|---|---|
| `/` | Übersicht aller rechtlichen Seiten |
| `/imprint/` | Impressum (§ 5 DDG) |
| `/privacy/` | Datenschutzerklärung (DSGVO) |
| `/terms/` | Nutzungsbedingungen |
| `/account-deletion/` | Anleitung zur Kontolöschung (für Play Store / App Store verlinkt) |
| `/.well-known/assetlinks.json` | Android App Links (Task 2.4) |
| `/.well-known/apple-app-site-association` | iOS Universal Links (Task 2.4) |

## Hosting

Wird über **GitHub Pages** ausgeliefert.

- Branch: `main`
- Custom Domain: `lendmate.dev` (konfiguriert via `CNAME`-Datei)
- HTTPS: Let's-Encrypt-Zertifikat automatisch durch GitHub

`.nojekyll` ist gesetzt, damit GitHub den Jekyll-Build überspringt und Dateien ohne
Extension (wie `apple-app-site-association`) sowie Pfade mit `.well-known` unverändert
ausliefert.

## Offene TODOs vor Public Launch

- `[ ]` Datenschutzerklärung über [datenschutz-generator.de](https://datenschutz-generator.de/) neu generieren und durch die aktuelle Version ersetzen
- `[ ]` Impressum-E-Mail auf Domain-E-Mail umstellen (z. B. `hello@lendmate.dev`)
- `[x]` `assetlinks.json`: SHA-256-Fingerprints von Debug- und Upload-Keystore eingetragen (siehe Brief Task 1.9 + 2.4)
- `[ ]` **`assetlinks.json`: Play-App-Signing-Fingerprint nachtragen.** Google signiert die ausgelieferte App mit einem eigenen Zertifikat (Play App Signing). Dessen SHA-256 existiert erst **nach dem ersten AAB-Upload** und ist dann im Play Console unter **App integrity → App signing → "App signing key certificate"** sichtbar. Ihn als **drittes** Element in `sha256_cert_fingerprints` einfügen, sonst fallen die Deep Links bei Play-Builds auf den Browser zurück:

  ```json
  "sha256_cert_fingerprints": [
    "57:E8:5D:57:B9:26:EC:FC:4F:06:2A:17:0E:9B:D0:50:5B:06:A2:52:49:5B:47:67:D1:23:47:9A:C3:A7:B0:EF",
    "7A:68:A6:AC:DA:CC:94:D5:14:06:FA:FB:AF:DD:EA:6E:A5:A3:1F:AA:D9:1E:97:E2:A8:11:22:63:DE:82:A5:AA",
    "<PLAY_APP_SIGNING_SHA256_HIER_EINFUEGEN>"
  ]
  ```
  (1. Eintrag = Debug-Keystore für lokale Tests, 2. = Upload-Key, 3. = Play App Signing.)
- `[ ]` `apple-app-site-association`: Apple Team ID eintragen (`REPLACE_WITH_APPLE_TEAM_ID`) (siehe Brief Task 8.4) — nicht nötig für den Play-Launch
- `[ ]` Content-Type für `apple-app-site-association` verifizieren (`curl -I https://lendmate.dev/.well-known/apple-app-site-association`)

## Lokal entwickeln

```bash
python3 -m http.server 8000
# → http://localhost:8000
```
