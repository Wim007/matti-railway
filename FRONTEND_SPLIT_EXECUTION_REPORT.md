# Frontend split uitvoering (Matti herstellen + Opvoedmaatje behouden)

## A) Backup branch
- Branch: `backup-frontend-split`
- Backup commit: `c9faec5` (`Backup before frontend split`)
- Push-status: ONBEKEND/NIET GELUKT in deze omgeving (geen `origin` remote beschikbaar).

## B) MATTI_STABLE_SHA
- Gekozen SHA: `c179be4`
- Reden: laatste commit vóór `7cf90bc` en `3b0f936`.
- Verificatie op SHA `c179be4`:
  - Welcome bevatte Matti (`Hoi, ik ben Matti`).
  - Manifest bevatte Matti naam/short_name.
  - Goals-overview gebruikte Matti copy.

## C) Herstelde bestanden
Hersteld vanuit `c179be4 -- client`, daarna hernoemd naar `client-matti`.
Belangrijkste herstelde paden:
- `client-matti/src/pages/onboarding/Welcome.tsx`
- `client-matti/public/manifest.json`
- `client-matti/src/pages/GoalsOverview.tsx`
- `client-matti/src/assets/matti-avatar.png`
- `client-matti/src/main.tsx`
- `client-matti/src/App.tsx`
- plus overige frontendbestanden onder `client-matti/` (99 files in commit `d7ca362`).

## D) Bevestiging
- Matti UI hersteld in `client-matti/`.
- Opvoedmaatje UI intact in `client-opvoedmaatje/`.
- Backend-assistentbestanden onaangetast (`server/assistants/matti.ts`, `server/assistants/opvoedmaatje.ts`).

## Build-structuur (alleen noodzakelijke aanpassing)
Omdat `client/` niet meer bestaat, is build-config product-selecteerbaar gemaakt via `FRONTEND_DIR`:
- default naar `client-matti`
- scripts toegevoegd:
  - `build:matti`
  - `build:opvoedmaatje`
  - `dev:matti`
  - `dev:opvoedmaatje`
