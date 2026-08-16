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

## Die fünf Fingerprints in `assetlinks.json`

Android verifiziert einen App Link, indem es diese Datei über HTTPS lädt und den
SHA-256-Fingerprint des Zertifikats vergleicht, mit dem die **installierte** App signiert
ist. `sha256_cert_fingerprints` ist deshalb eine Liste akzeptierter Zertifikate — steht der
passende nicht drin, fällt der Link stumm auf den Browser zurück.

Fünf Einträge, in dieser Reihenfolge:

| # | Zertifikat | Signiert … |
|---|---|---|
| 1 | `57:E8:…` Debug-Keystore | lokale Builds auf dem Entwicklungsrechner |
| 2 | `7A:68:…` Upload-Key | was *wir* zu Play hochladen (nie das, was Nutzer installieren) |
| 3 | `A8:20:…` `deployment_cert` | **Android 16 und älter — also praktisch alle Geräte im Umlauf** |
| 4 | `E6:35:…` `hybrid_classical_cert` | neuere Geräte, klassische Hälfte des v3.2-Hybrid-Blocks (RSA 4096) |
| 5 | `E0:01:…` `hybrid_pqc_cert` | neuere Geräte, Post-Quanten-Hälfte (ML-DSA-65, OID `2.16.840.1.101.3.4.3.18`) |

Nr. 3–5 kommen aus Play App Signing. Google meldet neue Apps automatisch bei
**quantenbereitem Hybrid-Signing** an (kein Opt-in), und dabei entstehen drei Zertifikate
statt einem: ein klassisches RSA-4096 und ein ML-DSA-65 für den Hybrid-Signaturblock auf
neueren Geräten, plus ein separates klassisches für Android 16 und älter. Google verlangt
ausdrücklich, **alle drei** zu registrieren.

Nr. 3 ist der wichtigste. „Android 16 und älter“ ist heute nahezu der gesamte Gerätebestand
— fehlt dieser Eintrag, sind die Deep Links für fast alle Nutzer kaputt, während die beiden
Hybrid-Einträge den Eindruck erwecken, alles sei erledigt.

Alle drei stammen aus dem ZIP unter **Play Console → App integrity → App signing →
Quantenbereit (Beta)**. Die Dateinamen im ZIP (`deployment_cert.der`,
`hybrid_classical_cert.der`, `hybrid_pqc_cert.der`) sind eindeutiger als die Labels in der
Konsole. Fingerprint eines heruntergeladenen Zertifikats gegenprüfen:

```bash
sha256sum deployment_cert.der | cut -d' ' -f1 | tr 'a-z' 'A-Z' | sed 's/\(..\)/\1:/g;s/:$//'
# oder: keytool -printcert -file deployment_cert.der | grep -i sha256
```

Der SHA-256-Fingerprint **ist** der SHA-256 über die DER-Kodierung des Zertifikats.

Fingerprints sind Hashes **öffentlicher** Zertifikate und gehören in ein öffentliches Repo —
die Datei *muss* weltweit lesbar sein, sonst funktioniert der Mechanismus nicht. Geheim
bleiben die Keystores (`.jks`), `android/key.properties` und deren Passwörter; die privaten
Hälften der Play-Schlüssel verlassen Googles KMS ohnehin nie.

Nach einer Änderung prüfen:

```bash
curl -s "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://lendmate.dev&relation=delegate_permission/common.handle_all_urls"
adb shell pm get-app-links com.lendmate.lendmate            # muss "verified" zeigen
adb shell pm verify-app-links --re-verify com.lendmate.lendmate   # Android cacht das Ergebnis
```

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
- `[x]` **`assetlinks.json`: Play-App-Signing-Fingerprints eingetragen** — siehe „Die fünf Fingerprints“ unten.
- `[ ]` Vor dem Public Launch überlegen, den **Debug-Keystore-Fingerprint** (1. Eintrag) zu entfernen. Er ist für lokale App-Link-Tests praktisch, hat auf der Produktionsdomain aber nichts verloren.
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
