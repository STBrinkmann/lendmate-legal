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
| `/moderation/` | Entscheidungsseite für gemeldete Rückmeldungen (nur mit `?token=` aus der Moderationsmail sinnvoll, `noindex`) |
| `/invite/?c=<code>` | Einladungs-Landeseite — siehe unten |
| `/auth/callback/`, `/auth/confirm/` | Auffangseiten für Anmelde- und Bestätigungslinks |
| `/reset-password/` | Auffangseite für Passwort-Reset-Links |
| `/404.html` | Auffangnetz: übersetzt alte `/invite/<code>`-Links, sonst gebrandete 404 |
| `/assets/applink.js` | Gemeinsame Deep-Link-Helfer der vier Seiten oben |
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

## Die App-Landeseiten (`/invite/`, `/auth/*`, `/reset-password/`)

Die App zeigt auf vier Pfadfamilien dieser Domain: `/invite/*`, `/auth/callback`,
`/auth/confirm` und `/reset-password`. Sind App-Link-Verifizierung und App-Installation
in Ordnung, fängt Android den Link ab und **niemand sieht diese Seiten**. Sie existieren
genau für den Rest: App nicht installiert, Desktop, In-App-Browser eines Messengers,
oder fehlgeschlagene Verifizierung. Vorher stand dort GitHubs rohe „File not found“-Seite.

### Warum `?c=` statt `/invite/<code>`

GitHub Pages ist rein statisch. Für `/invite/a1b2c3` gibt es keine Datei, also antwortet
der Server mit **404** — und ein `404.html` ändert daran nur den Inhalt, nicht den Status.
WhatsApp und Telegram rendern für 404-Antworten keine Vorschaukarte.

Deshalb erzeugt die App seit `lendmate` v1.2.4 `https://lendmate.dev/invite/?c=<code>`:
eine echte Datei, Status 200, Vorschaukarte. Der alte Pfad lebt weiter — `404.html` liest
den Code aus `location.pathname` und leitet auf die `?c=`-Form um, damit bereits
verschickte Links und ausgedruckte QR-Codes gültig bleiben. Beide Formen matchen den
`pathPrefix="/invite"` im `AndroidManifest.xml`, Query-Strings zählen beim Path-Matching
nicht mit.

### Was die Seiten bewusst *nicht* tun

- **Kein Auto-Redirect in den Store.** Solange die App im geschlossenen Test liegt, würde
  das jeden wortlos auf eine Play-404 schicken. Stattdessen zwei sichtbare Buttons.
- **Kein Durchreichen des Auth-Tokens.** Supabase liefert es im URL-**Fragment**
  (`#access_token=…`), und `intent://` belegt den Fragment-Slot bereits für seine eigene
  Syntax. Fragment → Query umzuschreiben würde der App etwas anderes übergeben, als sie
  erwartet. Die Auth-Seiten schicken deshalb ehrlich auf den richtigen Weg zurück.

Der `intent://`-Button ist die Notausfahrt für den Fall, dass `autoVerify` fehlschlägt —
was aktuell bei Play-Builds passiert, solange der Play-App-Signing-Fingerprint unten fehlt.
Der `&referrer=`-Parameter am Play-Link kostet nichts und ist die Vorarbeit dafür, eine
Einladung später über die Installation hinweg zu retten (Play Install Referrer API; die
App liest ihn heute noch nicht).

## Warum `/moderation/` hier liegt

Die Seite gehört inhaltlich zur App, nicht zu den Rechtstexten — sie steht trotzdem hier,
weil sie nirgendwo sonst hin kann. Supabase schreibt auf `*.supabase.co` jede GET-Antwort
mit `text/html` zu `text/plain` um und setzt zusätzlich
`Content-Security-Policy: default-src 'none'; sandbox`. Die Edge Function
`review-report-decision` konnte ihre Seite deshalb nicht selbst ausliefern; der Moderator
bekam den Quelltext als Text zu sehen. HTML von der Function-Domain zu liefern bräuchte das
kostenpflichtige Custom-Domain-Add-on.

Also: Darstellung hier, Logik dort. Die Seite holt sich die gemeldete Rückmeldung per
`fetch` von `review-report-decision` (JSON, CORS auf `lendmate.dev` beschränkt) und schickt
die Entscheidung als POST zurück. Alte Mails, die noch direkt auf die Function zeigen,
werden von ihr hierher weitergeleitet.

Ändert sich die Supabase-Projekt-Ref, muss die Konstante `API` in
`moderation/index.html` mitgezogen werden.

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
- `[x]` Content-Type für `apple-app-site-association` verifiziert: GitHub Pages liefert die
  extensionslose Datei als `application/octet-stream` aus, Apple dokumentiert
  `application/json`. Auf GitHub Pages **nicht konfigurierbar** — es gibt keine
  Header-Steuerung. Aktuelle iOS-Versionen holen die Datei über Apples CDN und sind dabei
  tolerant; sollte sich das beim iOS-Launch als Blocker erweisen, muss die Domain hinter
  einen Host mit Header-Kontrolle (Netlify/Cloudflare Pages) umziehen.

## Lokal entwickeln

```bash
python3 -m http.server 8000
# → http://localhost:8000
```
