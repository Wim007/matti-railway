# Goals Architecture — Matti

## Overzicht

De Goals-laag zit boven de bestaande Actions-laag. Een Goal is een overkoepelend doel (bijv. "Beter slapen") dat bestaat uit een geordende reeks concrete acties. Acties worden sequentieel geactiveerd: pas als stap N is voltooid, wordt stap N+1 actief.

## Datamodel

### `goals` tabel

| Kolom | Type | Beschrijving |
|---|---|---|
| `id` | integer | Primary key |
| `userId` | varchar | Eigenaar (Matti user ID) |
| `title` | text | Leesbare naam van het doel |
| `description` | text | Optionele toelichting |
| `status` | enum | `draft` → `active` → `completed` |
| `goalType` | enum | `sleep`, `procrastination`, `planning`, `confidence`, `bullying`, `mental_rest`, `custom` |
| `targetDate` | timestamp | Optionele streefdatum |
| `createdAt` | timestamp | Aanmaakdatum |
| `updatedAt` | timestamp | Laatste wijziging |

### Uitbreidingen op `actions` tabel

| Kolom | Type | Beschrijving |
|---|---|---|
| `goalId` | integer | FK naar `goals.id` (nullable — bestaande acties zijn niet gekoppeld) |
| `sequence` | integer | Volgorde binnen het doel (1, 2, 3, ...) |
| `isActiveStep` | boolean | Alleen de huidige actieve stap is `true` |

## Lifecycle

```
startDraftGoal()
    → goal.status = "draft"

finalizeGoalWithPlan(goalId, clarificationContext)
    → AI genereert 5-8 stappen
    → actions aangemaakt (alle pending)
    → stap 1: isActiveStep = true, follow-ups gepland (dag 2, 4)
    → goal.status = "active"

updateActionStatus(actionId, "completed")
    → stap N: isActiveStep = false
    → stap N+1: isActiveStep = true, follow-ups gepland
    → als geen volgende stap: goal.status = "completed"
```

## goalsRouter endpoints

| Endpoint | Type | Beschrijving |
|---|---|---|
| `goals.startDraftGoal` | mutation | Maak een draft goal aan op basis van goalType |
| `goals.finalizeGoalWithPlan` | mutation | Genereer AI-plan en activeer goal |
| `goals.getActiveGoals` | query | Haal alle actieve goals op met voortgang |

## Follow-up strategie voor goal-acties

Goal-acties gebruiken kortere follow-up intervallen dan losse acties:
- **Losse acties:** dag 2, 4, 7, 10, 14, 21
- **Goal-acties:** dag 2, 4 (max 2 reminders per stap)

Reden: bij een doel is de volgende stap al gepland — te lange follow-ups vertragen de voortgang.

## AI Plan-generatie

`finalizeGoalWithPlan` roept `gpt-4o` aan met:
- Het doel-type en de titel
- De verhelderingscontext uit het gesprek (samenvatting van Q&A)
- Instructie: genereer 5-8 concrete stappen als JSON

Model: `gpt-4o` — `temperature: 0.7` — `max_tokens: 600`

## Relatie met bestaande systemen

- **Actions:** Goals-acties zijn gewone `actions` met extra `goalId/sequence/isActiveStep` velden. Alle bestaande action-logica (follow-ups, stats) werkt ongewijzigd.
- **Follow-ups:** Goal-acties krijgen follow-ups via dezelfde `followUps` tabel, maar met kortere intervallen.
- **Analytics:** Goal-completion kan worden gerapporteerd via het bestaande analytics-systeem.
- **Dashboard:** `getActiveGoals` geeft voortgang per goal terug (`completed/total`).
