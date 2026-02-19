# Actie-detectie Cleanup - Documentatie

## Datum
10 februari 2026

## Doel van deze cleanup
Verwijderen van dubbele/conflicterende actie-detectie logica en zorgen voor één enkele, deterministische detectie-path direct na AI response.

---

## Wat is aangepast

### 1. useEffect action detection VERWIJDERD (regel 140-174 in Chat.tsx)
**Waarom:** 
- Dubbele detectie-logica (zowel in handleSendMessage als useEffect)
- useEffect triggerde niet betrouwbaar op nieuwe berichten
- Geen console logs, geen toast notificaties, geen opgeslagen acties
- Race conditions mogelijk tussen beide detectie-paden

**Wat is verwijderd:**
```typescript
useEffect(() => {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) return;
  if (lastMessage.isAI === false) return;
  if ((lastMessage as any)._actionChecked) return;
  if (!conversation) return;

  const result = detectActionIntelligent(lastMessage.content);
  if (result) {
    saveAction.mutate({...});
    toast.success('💪 Actie opgeslagen!', {...});
  }
  (lastMessage as any)._actionChecked = true;
}, [messages, conversation, currentThemeId, saveAction]);
```

### 2. Ongebruikte import verwijderd
**Wat:** `detectAction` import verwijderd uit `@shared/action-detection`
**Waarom:** Alleen `detectActionIntelligent` wordt gebruikt, `detectAction` is obsolete

---

## Huidige actie-detectie flow (ENIGE path)

**Locatie:** `handleSendMessage` functie in Chat.tsx (regel 276-349)

**Flow:**
1. User stuurt bericht → opgeslagen in database
2. AI response wordt gegenereerd via OpenAI Assistant API
3. **DIRECT na ontvangst AI response:** `detectActionIntelligent(response.reply)` wordt aangeroepen
4. Als actie gedetecteerd:
   - Actie wordt opgeslagen via `saveAction.mutateAsync()`
   - Toast notificatie wordt getoond: "💪 Actie opgeslagen!"
   - Console log: `[ActionTracking] Action saved: {actionText}`
5. AI response wordt toegevoegd aan UI (met of zonder actie-tag)

**Code (regel 276-349):**
```typescript
// Detect action in AI response (intelligent post-processing)
const actionDetection = detectActionIntelligent(response.reply);

// Add assistant response to UI
const aiMsg: ChatMessage = {
  id: (Date.now() + 1).toString(),
  content: actionDetection ? actionDetection.cleanResponse : response.reply,
  isAI: true,
  timestamp: new Date().toISOString(),
};
setMessages((prev) => [...prev, aiMsg]);

// Save action if detected
if (actionDetection) {
  try {
    const actionResult = await saveAction.mutateAsync({
      themeId: currentThemeId,
      actionText: actionDetection.actionText,
      conversationId: conversation?.id,
    });
    console.log('[ActionTracking] Action saved:', actionDetection.actionText);
    
    toast.success("💪 Actie opgeslagen!", {
      description: actionDetection.actionText,
      action: {
        label: "Bekijk",
        onClick: () => window.location.href = "/actions",
      },
    });
  } catch (error) {
    console.error('[ActionTracking] Failed to save action:', error);
  }
}
```

---

## Waarom dit nu klopt

1. **Eén detectie-punt:** Actie-detectie gebeurt exact één keer, direct na AI response
2. **Deterministisch:** Geen race conditions, geen dubbele detecties
3. **Transparant:** Console logs tonen wanneer actie wordt gedetecteerd en opgeslagen
4. **User feedback:** Toast notificatie bij succesvolle opslag
5. **Error handling:** Try-catch blok vangt database errors op

---

## Wat bewust NIET is gebouwd

### 1. Outcome-detectie (VERBODEN)
**Niet geïmplementeerd:**
- Geen sentiment-based outcome detectie
- Geen automatische "opgelost" conclusies
- Geen heuristische detectie van "het gaat beter"

**Waarom niet:**
- Werkt met kwetsbare kinderen → geen impliciete conclusies
- Alleen expliciete, door gebruiker bevestigde stappen tellen
- Outcome-tracking is bewust uitgesteld voor latere fase

### 2. Dashboard outcome-logica (NOG NIET)
**Niet geïmplementeerd:**
- Geen automatische outcome-status ("opgelost", "gaat beter")
- Geen aggregatie van acties naar interventie-resultaten
- Geen dashboard-rapportage endpoints

**Waarom niet:**
- Architectuur is voorbereid (conversaties, acties, thema's zijn gescheiden)
- Maar semantiek wordt bewust NIET toegevoegd
- Dashboard-integratie komt in latere fase met expliciete outcome-tracking

### 3. Nieuwe features (VERBODEN)
**Niet toegevoegd:**
- Geen reward systeem (punten/badges)
- Geen sentiment analyse
- Geen push notifications voor follow-ups
- Geen refactors "omdat het mooier is"

**Waarom niet:**
- Focus op afronden bestaande implementatie
- Geen scope creep
- Eerst zorgen dat basis werkt

---

## Bekende issues

### Issue: Acties worden NIET opgeslagen
**Symptomen:**
- Geen console logs van `[ActionTracking]`
- Geen toast notificaties
- Acties pagina toont "Nog geen acties"

**Mogelijke oorzaken:**
1. `detectActionIntelligent()` returnt `null` (patronen matchen niet)
2. `saveAction.mutateAsync()` faalt zonder error logging
3. Database connectie issue
4. TypeScript compilatie issue (oude code wordt uitgevoerd)

**Diagnose nodig:**
- Console logs toevoegen in `detectActionIntelligent()` functie
- Testen met expliciet [ACTION: ...] format in AI response
- Server logs checken voor database errors

---

## Architectuur voor toekomstige dashboard-rapportage

**Huidige structuur (KLAAR voor dashboard):**
- `conversations` tabel: bevat `initialProblem`, `themeId`, `bullyingFollowUpScheduled`
- `actions` tabel: bevat `actionText`, `status`, `conversationId`, `themeId`
- `messages` tabel: bevat volledige gesprekgeschiedenis

**Wat later toegevoegd kan worden (ZONDER huidige code te breken):**
1. **Outcome tracking:**
   - Nieuwe `outcomes` tabel met `conversationId`, `outcomeStatus`, `confirmedByUser`
   - Expliciete outcome-bevestiging door gebruiker (bijv. "Hoe gaat het nu?" → "Beter!")
   
2. **Dashboard aggregatie:**
   - Query's die acties groeperen per thema
   - Berekening van interventie-duur (eerste bericht → laatste bericht)
   - Aggregatie van outcomes per thema/school/gemeente

3. **Reward systeem:**
   - Nieuwe `rewards` tabel met `userId`, `points`, `badges`
   - Punten toekennen bij voltooide acties
   - Badges unlocken bij milestones

**Belangrijk:** Huidige code introduceert GEEN semantiek die suggereert dat iets "af" is. Acties blijven losse events, gesprekken blijven gesprekken.

---

## Samenvatting

**Wat is opgeleverd:**
1. Schone, eenduidige actie-detectie flow (één detectie-punt in handleSendMessage)
2. Verwijderde overbodige useEffect detectie-logica
3. Documentatie van wat is aangepast en waarom

**Wat klopt nu:**
- Actie-detectie gebeurt deterministisch direct na AI response
- Geen dubbele detectie-paden meer
- Code is voorbereid op dashboard-rapportage zonder outcome-logica te bouwen

**Wat bewust niet is gebouwd:**
- Geen sentiment-based outcome detectie
- Geen automatische "opgelost" conclusies
- Geen nieuwe features of refactors

**Wat nog moet:**
- Diagnose waarom acties niet worden opgeslagen (ondanks correcte code-structuur)
- Testen met expliciet [ACTION: ...] format
- Server logs checken voor database errors
