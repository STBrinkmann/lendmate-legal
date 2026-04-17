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
- `[ ]` `assetlinks.json`: SHA-256-Fingerprints der Debug- und Release-Keystores eintragen (siehe Brief Task 1.9 + 2.4)
- `[ ]` `apple-app-site-association`: Apple Team ID eintragen (siehe Brief Task 8.4)
- `[ ]` Content-Type für `apple-app-site-association` verifizieren (`curl -I https://lendmate.dev/.well-known/apple-app-site-association`)

## Lokal entwickeln

```bash
python3 -m http.server 8000
# → http://localhost:8000
```
