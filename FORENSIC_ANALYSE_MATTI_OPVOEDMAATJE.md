# Forensische analyse: Matti vs Opvoedmaatje

## Gebruikte verificatie-commando's
- `git log --oneline -n 20`
- `git show --name-only --pretty=format:'%h %s' -n 1 3b0f936`
- `git show --name-only --pretty=format:'%h %s' -n 1 7cf90bc`
- `git show --name-only --pretty=format:'%h %s' -n 1 5458fae`
- `git show --name-only --pretty=format:'%h %s' -n 1 90a583d`
- `git show --stat --oneline 7cf90bc`
- `git show --stat --oneline 90a583d`
- `git show --stat --oneline 23dd114`

## Deel A — Mapping (wat draait waar)

### Frontend API-call en selectie
- Frontend gebruikt tRPC batch-link met endpoint `"/api/trpc"` in `client/src/main.tsx`.
- Er is **geen** productselectie op basis van hostname/route/env voor Matti vs Opvoedmaatje in deze API-link; endpoint is hardcoded.
- De frontend stuurt expliciet `X-Matti-*` headers uit `localStorage` (`matti_user_profile`).

### Backend routering en assistent-keuze
- Server mount tRPC exact op `"/api/trpc"` via Express middleware.
- In `appRouter` is `assistant` gekoppeld aan `assistantRouter`.
- `assistantRouter` laadt de actieve assistent met `loadAssistant()` en gebruikt `ASSISTANT_TYPE` met default `"matti"`.
- In `loadAssistant()` geldt: `ASSISTANT_TYPE=opvoedmaatje` => `opvoedmaatjeConfig`; anders fallback naar `mattiConfig`.

### Deploy-config
- Build en deploy zijn repo-breed en single-service geconfigureerd:
  - `pnpm run build` bouwt zowel frontend (Vite) als backend (esbuild).
  - Startcommand draait één Node-server (`dist/index.js`).
- Vite build-root staat op `client/` en output gaat naar `dist/public`.
- Server serveert in productie statische bestanden uit `dist/public`.
- Er is geen aparte `client-matti` / `client-opvoedmaatje` map of aparte build-pipeline in repo.

## Deel B — Forensisch: wat ging er mis

### Recente commits (top 20, samengevat op relevante items)
- `3b0f936` — *apply Opvoedmaatje branding (new logo transparent, 1.5x larger)*
- `23dd114` — Revert van `WelcomeOpvoedmaatje` default-entry wijziging
- `90a583d` — Introduceerde tijdelijk `WelcomeOpvoedmaatje` als default entry
- `5458fae` — UI-only updates voor Opvoedmaatje onboarding/goals
- `8c3653a` — Opvoedmaatje landing copy/CTA update
- `7cf90bc` — *apply Opvoedmaatje branding (logo + name only, no UI logic changes)*

### Verdachte frontend-branding commits
1. `7cf90bc` wijzigde 12 frontendbestanden, inclusief:
   - `client/public/manifest.json`
   - `client/src/pages/onboarding/Welcome.tsx`
   - meerdere UI-pagina's met tekstwijzigingen naar Opvoedmaatje
2. `3b0f936` wijzigde opnieuw onboarding welcome + logo asset.

### Bewijs in huidige codebase
- Welkomstscherm toont letterlijk “Hoi, ik ben Opvoedmaatje” en gebruikt Opvoedmaatje-logo.
- PWA manifestnaam/omschrijving zijn Opvoedmaatje.
- Tegelijk blijft backend-assistent standaard Matti als `ASSISTANT_TYPE` niet op `opvoedmaatje` staat.

## Conclusie (feitelijk)
1. Er is één gedeelde frontend (`client`) voor beide mogelijke backends.
2. Die gedeelde frontend is de laatste commits visueel naar Opvoedmaatje omgezet.
3. Backend-assistentkeuze is apart en env-gedreven; default blijft Matti.
4. Daardoor kan exact het waargenomen symptoom ontstaan: **Opvoedmaatje UI + Matti gedrag**.

## ONBEKEND (Railway UI nodig)
Niet verifieerbaar vanuit repo alleen:
- Welke Railway service(s) bestaan precies (1 of meerdere)?
- Welke branch/commit SHA draait per service?
- Welke `ASSISTANT_TYPE` staat per service?
- Welke Root Directory/Build Command/Start Command staan per service?
- Of meerdere services per ongeluk dezelfde domain/static deployment delen.

### Railway checklist (exact na te lopen)
1. Per service: **Settings → Source**: branch + commit SHA controleren.
2. Per service: **Settings → Build**: Root Directory, Build Command, Start Command.
3. Per service: **Variables**: `ASSISTANT_TYPE`, `NODE_ENV`, eventuele frontend env vars.
4. Per service: **Deployments**: of de live deployment SHA overeenkomt met bedoelde commit.
5. Per domain: aan welke service het domain hangt (Matti-domain vs Opvoedmaatje-domain).
