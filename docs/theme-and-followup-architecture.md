# Thema- en Follow-up Architectuur — Matti Backend

## 1. Definitie Primair Thema

Een **primair thema** (`conversations.themeId`) is het hoofdonderwerp van een conversation. Het wordt ingesteld bij aanmaak en is **stabiel voor de duur van de actieve conversation**. Het thema wijzigt **niet automatisch** op basis van berichten of AI-detectie.

Elke conversation heeft precies één primair thema. Dit thema is leidend voor:
- Dashboard-rapportage (thema → outcome koppeling)
- Beleidsrapportage aan gemeenten en scholen
- Follow-up context

## 2. Regels voor Themaverschuiving

Themaverschuiving is **alleen mogelijk via een expliciete frontend-actie** door de gebruiker. Er is geen automatische themaverschuiving.

De mutatie `chat.changePrimaryTheme` handelt dit af:

```typescript
chat.changePrimaryTheme({
  conversationId: number,
  newThemeId: ThemeId,
})
```

**Wat er wordt opgeslagen bij een themaverschuiving:**

| Veld | Inhoud |
|---|---|
| `themeId` | Nieuwe thema-waarde |
| `previousThemeId` | Originele thema vóór de wijziging |
| `themeChangedAt` | Tijdstip van de expliciete wijziging |

**Regels:**
- Gearchiveerde conversations (`isArchived = true`) kunnen niet van thema wisselen.
- Per gebruiker per thema bestaat slechts één actieve (niet-gearchiveerde) conversation. Een nieuwe conversation voor hetzelfde thema is alleen mogelijk na archiveren van de bestaande.

## 3. Outcome altijd gekoppeld aan primair thema

Bij `chat.updateOutcome` wordt het actuele `conversations.themeId` opgehaald en teruggegeven in de response:

```typescript
const result = await trpc.chat.updateOutcome.mutate({
  conversationId,
  outcome: "resolved",
  resolution: "...",
});
// result.themeId bevat het primaire thema van de conversation
```

De frontend stuurt dit `themeId` door naar analytics. Er wordt **geen losse of afwijkende themawaarde** gebruikt.

## 4. Follow-ups in dezelfde conversation

Follow-ups zijn geen losse pushberichten. Ze worden geïnjecteerd als systeemberichten in de **originele conversation**.

### Hoe het werkt

1. De follow-up scheduler detecteert een due follow-up (`followUps.status = "pending"` en `scheduledFor <= now`)
2. De scheduler roept `chat.injectFollowUpIntoChat` aan
3. Er wordt een systeemberichten toegevoegd aan `conversations.messages`:

```typescript
{
  role: "system",
  type: "follow_up",
  actionId: number,
  content: "Follow-up check voor actie: \"[actionText]\". Hoe gaat het ermee?",
  timestamp: ISO-string,
}
```

4. `followUps.status` wordt bijgewerkt naar `"sent"` en `notificationSent` wordt gevuld
5. De frontend toont het systeembericht als een in-chat prompt

### Mutatie

```typescript
chat.injectFollowUpIntoChat({
  conversationId: number,
  followUpId: number,
  actionId: number,
  actionText: string,
})
```

## 5. Relatie met Analytics

Het dashboard ontvangt events via `analyticsRouter.sendEvent`. De volgende koppeling geldt:

| Analytics veld | Bron |
|---|---|
| `themeId` | `conversations.themeId` (primair thema, nooit afwijkend) |
| `outcome` | `conversations.outcome` |
| `initialProblem` | `conversations.initialProblem` |
| `conversationCount` | `conversations.conversationCount` |
| `interventionStartDate` | `conversations.interventionStartDate` |
| `interventionEndDate` | `conversations.interventionEndDate` |

Themaverschuivingen zijn traceerbaar via `previousThemeId` en `themeChangedAt` voor auditdoeleinden.

## 6. Database kolommen (conversations tabel)

| Kolom | Type | Doel |
|---|---|---|
| `themeId` | enum | Primair thema (stabiel) |
| `previousThemeId` | text (nullable) | Vorig thema bij expliciete wijziging |
| `themeChangedAt` | timestamp (nullable) | Tijdstip van expliciete themaverschuiving |
| `isArchived` | boolean | Conversation afgesloten |
| `outcome` | enum | Huidige status van de interventie |
| `initialProblem` | text | Startprobleem voor rapportage |

## 7. Migraties

Kolommen worden automatisch aangemaakt bij server startup via `runMigrations()` in `server/_core/index.ts` met `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Dit is idempotent en veilig bij herstart.
