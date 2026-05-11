# WM 2026 Tippspiel auf GitHub Pages

Diese App braucht keine Datenbank. Die öffentliche Seite liest die Daten aus `tippspiel-state.json`.

## Öffentliche Seite

Auf GitHub Pages öffnest du einfach:

```text
https://<dein-user>.github.io/<repo>/
```

Besucher sehen Rangliste und Punkte im Lesemodus.

## Admin-Modus

Zum Bearbeiten öffnest du:

```text
https://<dein-user>.github.io/<repo>/?admin=1
```

Dann kannst du Teilnehmer, Tipps, Ergebnisse und Regeln bearbeiten. Danach klickst du auf **JSON exportieren**. Die heruntergeladene Datei heißt `tippspiel-state.json`.

Diese Datei ersetzt du im GitHub-Repository. Nach dem Commit zeigt GitHub Pages den neuen Stand an.

## Wichtig

GitHub Pages kann keine Nutzereingaben zentral speichern. Ohne Datenbank oder Backend können Teilnehmer ihre Tipps nicht direkt auf der öffentlichen Seite dauerhaft für alle speichern. Die robuste statische Lösung ist: Tipps einsammeln, im Admin-Modus eintragen, JSON exportieren, committen.
