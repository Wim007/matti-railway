# Noodplan: wijzigingen terugvinden en naar GitHub pushen

## 0) Waar plak ik deze commando's?

Plak alle commando's in je **lokale terminal** op je eigen laptop (niet in GitHub, niet in een codebestand):

- Windows: **Git Bash** (het zwarte venster waar je prompt ziet zoals `MINGW64 ~/matti-railway`)
- Mac: **Terminal**
- VS Code: **Terminal > New Terminal**

Voorbeeld: als je onderaan ziet:

```bash
Gebruiker@... MINGW64 ~/matti-railway (main)
$
```

Dan zit je goed en kun je de commando's daar direct plakken met rechtermuisknop of `Shift+Insert`.

Dit plan is bedoeld voor de situatie waarin je lokaal wijzigingen/commits hebt (zoals de frontend-split), maar ze nog niet op GitHub ziet.

## Snel: dit zijn de commando's

Plak deze regels in **Git Bash / Terminal** in je projectmap (`~/matti-railway`):

```bash
cd ~/matti-railway
git checkout -B work a8edc2c
git remote set-url origin https://github.com/Wim007/matti-railway.git
git push -u origin work
```

## Veelvoorkomende fout: `failed to push some refs`

Als je dit ziet op `main`, dan is je lokale branch meestal achter op GitHub of je pusht de verkeerde branch.

Gebruik dit blok in je terminal:

```bash
cd ~/matti-railway
git fetch origin
git status -sb
git checkout -B work a8edc2c
git push -u origin work
```

Wil je per se `main` pushen, werk dan eerst bij:

```bash
git checkout main
git pull --rebase origin main
git push origin main
```

## 1) Vind de commit terug

```bash
git log --oneline --decorate -n 20
```

Zoek naar de split-commit:

- `a8edc2c Split frontend into client-matti / client-opvoedmaatje, restore Matti UI and add Opvoedmaatje app + forensic reports`

## 2) Als de commit bestaat: zet hem op branch `work`

```bash
git checkout -B work a8edc2c
```

## 3) Koppel GitHub-remote

```bash
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Wim007/matti-railway.git
git remote -v
```

## 4) Push branch `work`

```bash
git push -u origin work
```

## 5) Als push faalt op authenticatie

Gebruik in je **lokale terminal** een ingelogde GitHub sessie (`gh auth login`) of een Personal Access Token bij HTTPS.

Controle:

```bash
git ls-remote origin
```

## 6) PR openen

Na succesvolle push:

1. Open `https://github.com/Wim007/matti-railway`
2. Klik **Compare & pull request** voor `work`
3. Klik **Create pull request**

---

## Extra hersteloptie (als `work` niet meer bestaat)

Als je de commit-hash nog weet:

```bash
git checkout -b work <COMMIT_SHA>
git push -u origin work
```

Als je de hash niet weet, zoek via reflog:

```bash
git reflog --all --date=local | sed -n '1,80p'
```
