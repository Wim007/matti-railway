# Root-cause check: waarom Matti soms alsnog Opvoedmaatje-UI toont

## Wat ik in code heb bevestigd

1. De repo heeft nu **wel degelijk twee aparte frontends**:
   - `client-matti/`
   - `client-opvoedmaatje/`
2. De welcome pagina's zijn inhoudelijk verschillend:
   - Matti: `Hoi, ik ben Matti.`
   - Opvoedmaatje: `Hoi, ik ben Opvoedmaatje.`
3. Build-selectie wordt bepaald door `FRONTEND_DIR`:
   - default `build` = `FRONTEND_DIR=client-matti`
   - aparte scripts `build:matti` en `build:opvoedmaatje`
4. Vite/server lezen dezelfde variabele (`FRONTEND_DIR`) om frontend-root te kiezen.

## Conclusie

Als je in productie nog Opvoedmaatje-UI op Matti ziet, dan is de meest waarschijnlijke oorzaak **deploy-config i.p.v. code-inhoud**:

- de Matti service bouwt/start met `FRONTEND_DIR=client-opvoedmaatje`, of
- de Matti service draait op een verkeerde branch/commit, of
- de verkeerde service/domein-koppeling in Railway wijst naar de Opvoedmaatje-build.

## Waar ging het oorspronkelijk mis?

Historisch was er 1 frontend (`client/`). Daardoor overschreven Opvoedmaatje UI-wijzigingen direct de Matti UI. De split naar `client-matti` + `client-opvoedmaatje` lost dat in code op, maar alleen als deploy per service correct staat.

## Railway checklist (verplicht)

Voor **Matti-service** controleren:

- Branch = juiste branch met split-commit
- Build command = `pnpm run build:matti` (of expliciet `FRONTEND_DIR=client-matti ...`)
- Start command = `pnpm run start`
- `FRONTEND_DIR` env (indien gezet) = `client-matti`
- Laatste deploy commit SHA klopt met jouw bedoelde commit

Voor **Opvoedmaatje-service**:

- Build command = `pnpm run build:opvoedmaatje`
- `FRONTEND_DIR` env (indien gezet) = `client-opvoedmaatje`

## Preventie toegevoegd

Nieuw verificatiescript: `pnpm run verify:frontend-split`

Dit script controleert:
- productspecifieke welcome-teksten in broncode,
- dat default build op Matti staat,
- dat beide productbuilds de juiste markertekst in output bevatten.
