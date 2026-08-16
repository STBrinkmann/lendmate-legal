/* Gemeinsame Deep-Link-Helfer fuer die App-Landeseiten von lendmate.dev.
 *
 * Wann laeuft dieser Code ueberhaupt?
 * Nur dann, wenn der Link NICHT von der App abgefangen wurde. Ist LendMate
 * installiert und die App-Link-Verifizierung erfolgreich, sieht niemand diese
 * Seiten - Android startet direkt die App. Wir sind also per Definition im
 * Ausnahmefall: App fehlt, Desktop, In-App-Browser eines Messengers, oder die
 * Verifizierung ist fehlgeschlagen (was aktuell bei Play-Builds passiert,
 * solange der Play-App-Signing-Fingerprint in assetlinks.json fehlt).
 *
 * Deshalb gibt es hier bewusst KEINE automatische Weiterleitung, sondern
 * sichtbare Buttons: automatisch in den Play Store zu springen wuerde heute
 * jeden wortlos auf eine Play-404 schicken, weil die App noch im
 * geschlossenen Test ist.
 */
(function (global) {
  'use strict';

  var PACKAGE = 'com.lendmate.lendmate';
  var HOST = 'lendmate.dev';

  var ua = navigator.userAgent || '';
  // iPadOS meldet sich seit 13 als "Macintosh" - der Touch-Punkte-Test ist
  // der uebliche Weg, es trotzdem zu erkennen.
  var isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && typeof document !== 'undefined' &&
      navigator.maxTouchPoints > 1);
  var isAndroid = /Android/.test(ua);

  /* Play-Store-Link. `referrer` wird von der Play Install Referrer API beim
   * ersten Start an die App durchgereicht - heute liest die App ihn noch
   * nicht, aber der Parameter kostet nichts und ist die Vorarbeit dafuer,
   * eine Einladung ueber die Installation hinweg zu retten. */
  function storeUrl(referrer) {
    var url = 'https://play.google.com/store/apps/details?id=' + PACKAGE;
    if (referrer) url += '&referrer=' + encodeURIComponent(referrer);
    return url;
  }

  /* Android-Escape-Hatch: startet die App per Intent, auch wenn autoVerify
   * fehlgeschlagen ist. `browser_fallback_url` faengt den Fall ab, dass die
   * App gar nicht installiert ist - dann bleibt der Browser einfach hier. */
  function intentUrl(path, fallbackUrl) {
    return 'intent://' + HOST + path +
      '#Intent;scheme=https;package=' + PACKAGE +
      ';S.browser_fallback_url=' + encodeURIComponent(fallbackUrl) +
      ';end';
  }

  /* Baut die Buttons, die auf jeder Landeseite gleich aussehen sollen.
   *
   * opts.appPath  - Pfad auf lendmate.dev, den die App oeffnen soll
   * opts.referrer - Nutzlast fuer den Play-Store-Link (optional)
   * opts.openLabel - Beschriftung des "In der App oeffnen"-Buttons
   */
  function renderActions(container, opts) {
    var options = opts || {};
    var row = document.createElement('div');
    row.className = 'btn-row';

    if (isAndroid && options.appPath) {
      var open = document.createElement('a');
      open.className = 'btn btn-primary';
      open.textContent = options.openLabel || 'In der LendMate-App öffnen';
      open.href = intentUrl(options.appPath, location.href);
      row.appendChild(open);
    }

    if (!isIOS) {
      var store = document.createElement('a');
      store.className = isAndroid ? 'btn btn-secondary' : 'btn btn-primary';
      store.textContent = 'LendMate bei Google Play holen';
      store.href = storeUrl(options.referrer);
      store.rel = 'noopener';
      row.appendChild(store);
    }

    container.appendChild(row);

    var note = document.createElement('p');
    note.className = 'note-text';
    if (isIOS) {
      note.textContent = 'LendMate gibt es aktuell nur für Android. ' +
        'Die iOS-Version ist in Arbeit.';
    } else if (isAndroid) {
      note.textContent = 'LendMate steckt gerade noch im geschlossenen Test — ' +
        'wenn der Play-Store-Link ins Leere läuft, melde dich bei der Person, ' +
        'die dich eingeladen hat.';
    } else {
      note.textContent = 'Du bist am Rechner. Öffne diesen Link auf deinem ' +
        'Android-Handy, um LendMate zu benutzen.';
    }
    container.appendChild(note);
  }

  /* Code-Anzeige mit Kopieren-Button. Der manuelle Weg ist echt: in der App
   * gibt es unter "Gruppen" ein Eingabefeld fuer genau diesen Code. */
  function renderCode(container, code) {
    var label = document.createElement('p');
    label.className = 'label';
    label.textContent = 'Dein Einladungscode';
    container.appendChild(label);

    var box = document.createElement('div');
    box.className = 'code-box';

    var value = document.createElement('span');
    value.className = 'code';
    value.textContent = code;
    box.appendChild(value);

    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Kopieren';
    button.addEventListener('click', function () {
      copy(code).then(function (ok) {
        button.textContent = ok ? 'Kopiert ✓' : 'Bitte abtippen';
        setTimeout(function () { button.textContent = 'Kopieren'; }, 2000);
      });
    });
    box.appendChild(button);

    container.appendChild(box);
  }

  /* navigator.clipboard gibt es nur in sicheren Kontexten und nicht in jedem
   * In-App-Browser. Der execCommand-Zweig ist der Fallback dafuer. */
  function copy(text) {
    if (navigator.clipboard && global.isSecureContext) {
      return navigator.clipboard.writeText(text)
        .then(function () { return true; })
        .catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    try {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function setYear() {
    var node = document.getElementById('year');
    if (node) node.textContent = new Date().getFullYear();
  }

  global.LmAppLink = {
    isAndroid: isAndroid,
    isIOS: isIOS,
    storeUrl: storeUrl,
    intentUrl: intentUrl,
    renderActions: renderActions,
    renderCode: renderCode,
    setYear: setYear
  };
})(window);
