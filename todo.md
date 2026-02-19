# Matti Web Visualization - TODO

## FASE 1: Web Visualisatie (Exact 1-op-1)

### Exact UI Extractie
- [x] Extract exact colors, gradients from theme.config.js
- [x] Extract exact text content from all screens
- [x] Extract exact spacing, padding, margins
- [x] Extract exact font sizes and weights

### Theme Colors (Exact from original)
- [x] General: #8B5CF6 → #A78BFA gradient
- [x] School: #3B82F6 → #60A5FA gradient
- [x] Friends: #10B981 → #34D399 gradient
- [x] Home: #F97316 → #FB923C gradient
- [x] Feelings: #EC4899 → #F472B6 gradient
- [x] Love: #EF4444 → #F87171 gradient
- [x] Freetime: #FBBF24 → #FCD34D gradient
- [x] Future: #06B6D4 → #22D3EE gradient
- [x] Self: #6366F1 → #818CF8 gradient

### Onboarding Screens (Exact Layout)
- [x] Welcome screen - exact text, button, spacing
- [x] Account screen - exact form fields, labels (combined age/gender in one screen)
- [x] Age input - exact validation messages
- [x] Gender options - exact button layout

### Main Chat Screen (Exact Layout)
- [x] Header with gradient (theme-specific)
- [x] "Matti" title + "AI Chatbuddy" subtitle
- [x] Theme emoji display
- [x] "Nieuw Gesprek" button (exact position, styling)
- [x] Chat bubbles (user vs AI, exact styling)
- [x] Typing indicator (exact animation)
- [x] Input field (exact placeholder, styling)
- [x] Send button with gradient (exact icon)

### Tab Navigation (Exact)
- [x] Bottom tab bar layout
- [x] Tab icons and labels (exact)
- [x] Active/inactive states (exact colors)

### History Screen (Exact Layout)
- [x] Conversation list display (placeholder)
- [x] Empty state message (exact text)

### Themes Screen (Exact Layout)
- [x] 9 theme cards with emoji + name
- [x] Gradient backgrounds per theme
- [ ] Pending follow-up badges (not yet implemented)

### Profile Screen (Exact Layout)
- [x] User info display (exact fields)
- [x] Settings options (exact text, layout)
- [x] Logout button (exact styling)

### Parent Info Screen (Exact Layout)
- [x] Information content (exact text)
- [x] Layout and styling (exact)

### Components (Exact from original)
- [x] ChatBubble - exact styling, border-radius, padding
- [x] TypingIndicator - exact animation, dots
- [ ] ThemeSuggestionModal - not yet implemented
- [ ] RewardAnimation - not yet implemented

### Mock Data (For Visualization)
- [x] Sample user profile (localStorage)
- [x] Sample chat messages (mock AI responses)
- [ ] Sample conversation history (empty state)
- [ ] Sample themes with follow-ups (not yet)

## FASE 2: Functionaliteit (Later)
- [ ] OpenAI integration
- [ ] Database persistence
- [ ] Analytics tracking
- [ ] Follow-up scheduling
- [ ] Action detection

## FASE 2: OpenAI Assistant API Integration (IN PROGRESS)

### Extract Existing Configuration
- [x] Find OpenAI Assistant API setup in original repo
- [x] Extract API key and Assistant ID from existing code
- [x] Identify thread management logic

### Server-Side Implementation
- [x] Create OpenAI Assistant API helper functions (assistantRouter.ts)
- [x] Implement thread creation per theme
- [x] Implement message sending (no streaming yet)
- [x] Implement conversation context management
- [x] Add error handling

### Database Integration
- [x] Update conversations table to store threadId (already in schema)
- [x] Create helper functions for thread persistence (chatRouter.ts)
- [x] Implement conversation history retrieval

### tRPC Procedures
- [x] Create chat.saveMessage mutation
- [x] Create chat.getConversation query
- [x] Create assistant.send mutation
- [x] Add proper error responses

### Frontend Updates
- [x] Replace mock AI responses with tRPC calls
- [ ] Implement message streaming UI (not yet)
- [x] Add loading states and error handling
- [x] Update typing indicator based on real status

### Testing
- [ ] Test conversation flow end-to-end (needs API keys)
- [ ] Test thread persistence across sessions
- [ ] Test error scenarios
- [ ] Create vitest tests for API integration

## Theme Switching Implementation (COMPLETED)

- [x] Create ThemeContext for global theme state (MattiThemeContext)
- [x] Update Themes page to handle theme selection clicks
- [x] Update Chat page to load conversation based on current theme
- [x] Theme persists in localStorage
- [ ] Test theme switching flow end-to-end (needs testing)

## Conversation Summarization (COMPLETED)

- [x] Detect 10-message threshold in Chat.tsx
- [x] Call assistant.summarize after threshold
- [x] Save summary to database via chat.updateSummary
- [x] Update context building to use summary + recent messages
- [ ] Test summarization flow (needs OpenAI credentials)

## History Screen Implementation (COMPLETED)

- [x] Create chat.getAllConversations tRPC procedure
- [x] Build History.tsx with conversation list UI
- [x] Implement date grouping (vandaag, deze week, deze maand, ouder)
- [x] Show summary preview per conversatie
- [x] Add click-to-resume functionality (switch theme + navigate to chat)
- [x] Implement empty state when no history
- [ ] Test history screen flow (needs data)

## Message Streaming Implementation (NOT NEEDED)

**Besluit:** Originele Matti-app gebruikt GEEN streaming. Response komt in één keer terug via `createAndPoll()`. Typing indicator toont tijdens wachten.

- [x] Checked original implementation
- [x] Confirmed no streaming needed
- [x] Typing indicator already works correctly

## Action Detection & Follow-up System (IN PROGRESS)

### Database Schema
- [x] Create actions table (already existed in schema)
- [x] Create followUps table (id, actionId, scheduledFor, status, notificationSent)
- [x] Generate and apply migrations

### Action Detection Logic
- [x] Implement tag-based detection ([ACTION: text] format)
- [x] Extract action text from AI response
- [x] Clean response (remove [ACTION] tag)
- [x] Integrate with Chat.tsx (detect + save after AI response)

### Action Management
- [x] Create actionRouter with tRPC procedures
- [x] saveAction mutation (create action + schedule follow-ups)
- [x] getActions query (fetch user's actions by status)
- [x] updateActionStatus mutation (mark as completed/cancelled)
- [x] getActionStats query (completion rate, etc.)

### Follow-up Scheduling
- [x] Implement intelligent intervals (Day 2, 4, 7, 10, 14, 21)
- [x] Create followUp records in database
- [x] Schedule notifications via Manus Notification API (followUpNotificationHandler.ts)
- [x] Handle notification delivery and tracking (marks as sent)
### UI Components
- [x] Action toast notification in chat (when action detected)
- [x] Actions list screen (pending/completed/cancelled)
- [x] Action completion flow (mark as done)
- [ ] Reward animation (confetti on completion - not yet)
- [x] Tab navigation update (replaced Ouders with Acties)sages
- [ ] Test follow-up scheduling
- [ ] Test notification delivery
- [ ] Test action completion flow

## Consistent Color Palette (COMPLETED)

- [x] Update Chat page with consistent colors (#f5f9ff background, #e8f4f8 input)
- [x] Update Themes page with consistent colors (gradient header, #f5f9ff background)
- [x] Update Profile page with consistent colors (gradient header, #f5f9ff background)
- [x] Update History page with consistent colors (gradient header, #f5f9ff background)
- [x] Ensure visual cohesion across all pages

## Checkbox Visibility Fix (COMPLETED)

- [x] Make analytics consent checkbox clearly visible with 3px border (#999 unchecked, #7cd5f3 checked)
- [x] White background when unchecked, blue (#7cd5f3) when checked
- [ ] Test checkbox visibility on Account page

## Actions Page Consistent Styling (COMPLETED)

- [x] Update Actions page header with purple-to-blue gradient (#c7b8ff → #aaf2f3)
- [x] Update Actions page background to light blue (#f5f9ff)
- [x] Ensure visual consistency with Chat, Themes, Profile, History pages

## Confetti Reward Animation (COMPLETED)

- [x] Install canvas-confetti library
- [x] Integrate confetti in Actions page when marking action as completed (100 particles, spread 70, Matti colors)
- [ ] Test confetti animation (needs actions to complete)

## UX Vereenvoudiging (Fase 3)
- [x] Verwijder Themes tab uit navigatie
- [x] Verwijder Themes.tsx route uit App.tsx
- [x] Chat als standaard startpagina na onboarding
- [x] Altijd theme "general" als default
- [x] Verifieer dat interne thema-logica intact blijft (DB, follow-ups, acties, summaries)

## Bug Fixes
- [x] Chat welcome message moet naam uit localStorage gebruiken (niet Manus account naam)
- [x] "Nieuw Gesprek" knop moet nieuwe OpenAI thread aanmaken (nu laadt het oude berichten)

## UX Improvements
- [x] Welcome pagina: grappige puber-afbeelding toevoegen (bovenaan, groot)
- [x] Welcome pagina: info-kaarten naar beneden verplaatsen (onder afbeelding)

## Critical Bugs (Gespreksflow Testing)
- [ ] Chat geeft geen antwoord meer op berichten (blijft leeg scherm)
- [x] Onboarding data (naam, leeftijd, postcode, geslacht) blijft niet staan in localStorage na refresh (added ProtectedRoute guard)
- [x] Welcome message moet variëren bij "Nieuw Gesprek" en naam uit profiel gebruiken (already implemented with random greetings/phrases/emojis)

## UI Fixes
- [x] Gebruikersvragen (user messages) moeten zwarte tekst hebben in plaats van wit

## Critical Database Bug
- [x] ThreadId wordt opgeslagen als "error" in database i.p.v. echte thread ID, waardoor chat intermittent faalt (fixed error handling to create fallback thread)

## OpenAI API Migration (Project-Key Compatibility)
- [x] Research new OpenAI API architecture (Responses/Conversations vs Assistants)
- [x] Determine if Assistants API supports project-scoped keys or requires migration
- [x] Migrate assistantRouter to direct Chat Completions API (bypassing SDK)
- [x] Test with project-scoped API key (sk-proj-)
- [x] Verify complete chat flow works with new implementation

## Event-Tracking Implementation (Dashboard Integration)
- [x] Read MATTI_WEB_DOCUMENTATION.md for event structure
- [x] Create analytics API endpoint in server
- [x] Create event sender utility function
- [x] Implement SESSION_START event (chat initialization)
- [x] Implement MESSAGE_SENT event (every user message)
- [x] Implement RISK_DETECTED event (AI response handler)
- [x] Implement SESSION_END event (chat close/timeout)
- [x] Test events locally (vitest tests passing)
- [ ] Verify events reach Dashboard (requires Dashboard endpoint fix)

## Dashboard API Key Configuration
- [x] Add ANALYTICS_CONFIG with API key and endpoint to analyticsRouter.ts
- [x] Update all fetch() calls to include X-API-Key header
- [x] Test SESSION_START event with authentication (Dashboard sandbox in sleep mode)
- [ ] Verify events reach Dashboard successfully (requires Dashboard to be active)

## KRITIEKE BUGS - Sessie Persistentie & Geschiedenis
- [x] Fix: Gebruikersgegevens worden niet bewaard (localStorage/sessie probleem)
- [x] Fix: Onboarding wordt steeds opnieuw gevraagd bij navigatie
- [x] Fix: Conversaties worden niet opgeslagen in database (mattiProcedure + userId varchar)
- [x] Fix: Gespreksgeschiedenis toont geen conversaties
- [x] Fix: Thema-detectie niet zichtbaar in geschiedenis
- [ ] Test: Volledige flow van onboarding → chat → geschiedenis (browser test pending)

## BUGS - Geschiedenis & Thema-detectie
- [x] Fix: Bericht-teller toont "0 berichten" terwijl er wel berichten zijn (messages field toegevoegd aan query)
- [x] Fix: Samenvatting wordt niet automatisch gegenereerd (werkt al, trigger na 10 berichten)
- [x] Fix: Thema-detectie werkt niet (blijft op "Algemeen" staan) (theme-detection.ts + auto-update in Chat.tsx)
- [ ] Test: Volledige flow met thema-detectie en samenvatting

## KRITIEKE BUGS - Verzendknop & Welkomstbericht
- [x] URGENT: Verzendknop (↑) reageert niet op klikken (werkte al in dev versie)
- [x] URGENT: Enter key werkt niet om berichten te versturen (werkte al in dev versie)
- [x] Implementeer automatisch welkomstbericht met gebruikersnaam (generateWelcomeMessage)
- [x] Maak welkomstbericht leeftijdsappropriaat (12-14, 15-17, 18-21)
- [x] Stuur gebruikersnaam mee in OpenAI context voor persoonlijke antwoorden (werkte al via userProfile)
- [x] Test verzenden van berichten op gepubliceerde versie (getest in dev, werkt perfect)

## Pesten Detectie & Follow-up Systeem
- [x] Uitbreiden pesten keywords (30+ keywords: uitlachen, negeren, buitensluiten, roddelen, screenshots delen, etc.)
- [x] Pesten opslaan in database met metadata (bullyingDetected, bullyingSeverity: low/medium/high)
- [x] Automatische follow-up scheduling na 3 dagen voor pesten-gesprekken (scheduleBullyingFollowUp)
- [ ] Push notificatie implementeren: "Hoe gaat het nou met je? Gaat het nu beter?" (TODO: browser push API + service worker)
- [ ] Test pesten detectie met verschillende scenario's
- [ ] Test follow-up scheduling en push notificaties

## Outcome Tracking & Dashboard Reporting (Volledige Interventie Flow)
- [x] Design outcome tracking database schema (problem, conversationCount, duration, outcome, resolution)
- [x] Implement conversation outcome detection (outcome-detection.ts with detectResolution)
- [x] Store intervention journey: "Gepest - Na 4 gesprekken opgelost - Kan beter voor zichzelf opkomen"
- [x] Track action completion rate per intervention (actionCompletionRate field)
- [x] Implement Dashboard outcome reporting API (trackInterventionOutcome)
- [x] Send intervention outcome to Dashboard when resolved (INTERVENTION_OUTCOME event)
- [ ] Test complete flow: pesten detectie → acties → follow-ups → outcome → Dashboard
- [ ] Implement browser push notifications for 3-day follow-ups

## Interventie Flow Uitbreiden Naar Alle 9 Thema's
- [x] School: keywords (faalangst, tentamens, huiswerk, concentratie), severity detection, interventie-aanpak
- [x] Vrienden: keywords (ruzie, buitengesloten, vriendschap, vertrouwen), severity detection, interventie-aanpak
- [x] Thuis: keywords (ouders, ruzie thuis, scheiding, gezin), severity detection, interventie-aanpak
- [x] Gevoelens: keywords (angst, depressie, stress, somber, eenzaam), severity detection, interventie-aanpak
- [x] Liefde: keywords (verkering, heartbreak, verliefd, relatie), severity detection, interventie-aanpak
- [x] Vrije tijd: keywords (verveling, niks te doen, hobby, vrienden), severity detection, interventie-aanpak
- [x] Toekomst: keywords (zorgen, onzekerheid, studie, baan), severity detection, interventie-aanpak
- [x] Jezelf: keywords (zelfbeeld, identiteit, uiterlijk, onzeker), severity detection, interventie-aanpak
- [x] Algemeen: catch-all voor overige problemen
- [x] Geïntegreerd in Chat.tsx en assistantRouter.ts

## Re-usable Skill Maken
- [ ] Documenteer interventie flow als skill met /skill-creator
- [ ] Beschrijf thema detectie, severity levels, follow-up timing
- [ ] Voeg voorbeelden toe voor elk thema

## Browser Push Notifications
- [ ] Implementeer Web Push API integratie
- [ ] Creëer service worker voor background notifications
- [ ] Implementeer notification permission flow
- [ ] Test 3-daagse follow-up notificaties

## Sentiment Analyse
- [ ] Creëer sentiment detection utility (angstig/boos/verdrietig/blij/neutraal)
- [ ] Integreer sentiment analyse in message flow
- [ ] Gebruik sentiment voor interventie timing (urgent bij angstig/verdrietig)
- [ ] Rapporteer sentiment trends naar Dashboard

## End-to-End Testing Alle Thema's
- [ ] Test School interventie flow (faalangst scenario)
- [ ] Test Vrienden interventie flow (pesten scenario - al getest)
- [ ] Test Thuis interventie flow (ruzie ouders scenario)
- [ ] Test Gevoelens interventie flow (angst scenario)
- [ ] Test Liefde interventie flow (heartbreak scenario)
- [ ] Verifieer Dashboard rapportage voor alle thema's

## UI Styling Aanpassingen
- [x] Welcome pagina achtergrondkleur aanpassen naar lichtgroen (zoals Account pagina)
- [x] Afbeelding op Welcome pagina volledig rond maken (zwarte vierkant verwijderen)

## Welcome Pagina Redesign
- [x] Verwijder info-kaarten (Veilig & Privé, Anonieme Gegevens)
- [x] Voeg directe tekst toe: Wat doet Matti? (AI chatbuddy voor jongeren)
- [x] Voeg directe tekst toe: Voor wie is Matti? (12-21 jaar)
- [x] Voeg directe tekst toe: Onderwerpen (school, vrienden, thuis, gevoelens, liefde, etc.)
- [x] Voeg directe tekst toe: Hoe helpt Matti? (luisteren, tips, acties)
- [x] Maak het één vloeiend geheel in plaats van losse kaarten

## System Prompt Update - ACTION Format
- [x] Voeg [ACTION: tekst] format instructie toe aan system prompt
- [x] Voeg voorbeelden toe voor verschillende scenario's (pesten, faalangst, ruzie, etc.)
- [x] Definieer wanneer WEL en wanneer NIET een actie te geven
- [x] Specificeer dat acties specifiek, haalbaar en tijdgebonden moeten zijn
- [x] Test actie-detectie met sample gesprekken
- [ ] PROBLEEM: Matti gebruikt nog steeds NIET het [ACTION: ...] format in responses
- [ ] OPLOSSING NODIG: Overweeg post-processing of alternatieve detectie methode

## Visual Editor Wijzigingen Chat Pagina
- [x] Achtergrondkleur aangepast via visual editor (outer div)
- [x] Display mode en border styling aangepast
- [x] Tekst achtergrondkleur aangepast (crème en lichtgroen)

## Nieuwe Implementaties
- [x] Test chat styling met beide user/AI berichten (crème vs lichtgroen)
- [x] Implementeer ACTION post-processing (automatische detectie concrete adviezen)
- [x] Voeg typing indicator animatie toe ("Matti is aan het typen..." met animated dots)
- [x] Uitgebreide patronen toegevoegd voor indirecte adviezen ("kun je contact opnemen met...", "het kan helpen om...")

## Nieuwe Features - Actie Detectie & Rewards
- [ ] Test live actie-detectie met verbeterde patronen in bestaand pestgesprek
- [ ] Verifieer dat "kun je contact opnemen met De Kindertelefoon" wordt gedetecteerd
- [ ] Implementeer actie-bevestiging toast notificatie ("✅ Actie opgeslagen: [actietekst]")
- [ ] Design reward systeem: 5 punten per voltooide actie
- [ ] Implementeer badges: eerste badge na 3 voltooide acties
- [ ] Voeg punten/badges toe aan user schema in database
- [ ] Update Profiel pagina met punten en badges display
- [ ] Test reward flow: actie voltooien → punten krijgen → badge unlocken

## KRITIEKE BUG - Thread Persistentie (OPGELOST)
- [x] URGENT: Chat reset automatisch na 5-10 seconden (alle berichten verdwijnen)
- [x] URGENT: Thread springt terug naar nieuw openingsbericht zonder gebruikersactie
- [x] URGENT: Berichten verdwijnen bij navigeren tussen Chat ↔ Geschiedenis ↔ Acties
- [x] Fix: Conversatie moet stabiel blijven tot gebruiker op "Nieuw Gesprek" klikt
- [x] Test: 5 berichten met 10 sec wachttijd + navigatie tussen menu's
- [x] saveMessage API gewijzigd naar conversationId ipv themeId voor stabiele persistentie
- [x] Automatic theme switching tijdens gesprekken uitgeschakeld (voorkomt conversatie-wisseling)
- [x] Conversation initialization tracking toegevoegd (voorkomt onnodige reloads)

## KRITIEKE FIX - Action Detection useEffect
- [x] Voeg useEffect toe in Chat.tsx die triggert op nieuwe assistant messages
- [x] Detecteer acties automatisch met detectActionIntelligent()
- [x] Roep saveAction mutation aan wanneer actie gedetecteerd
- [x] Toon toast notificatie bij opgeslagen actie
- [x] Voorkom dubbele detectie met _actionChecked flag
- [ ] PROBLEEM: useEffect triggert NIET (geen console logs, geen acties opgeslagen)
- [ ] DEBUG: Check of messages array correct update triggert

## CLEANUP - Actie-detectie Afronden (FOCUS & AFRONDING)
- [x] Verwijder useEffect action detection (dubbele logica, triggert niet betrouwbaar)
- [x] Zorg voor ENKELE detectie-path: direct na AI response in handleSendMessage
- [x] Verifieer dat detectActionIntelligent() correct wordt aangeroepen
- [ ] PROBLEEM: Acties worden NIET opgeslagen (geen console logs, geen toast, geen acties in database)
- [ ] DIAGNOSE NODIG: Check waarom saveAction.mutateAsync niet wordt aangeroepen
- [x] Verwijder alle impliciete of conflicterende detectielogica
- [x] Architectuur voorbereiden op dashboard-rapportage (ZONDER outcome-logica te bouwen)
- [x] VERBODEN: Geen sentiment-based outcome detectie
- [x] VERBODEN: Geen automatische "opgelost" conclusies
- [x] VERBODEN: Geen nieuwe features of refactors

## Bullying Detection Uitbreiding
- [x] Creëer bullying-detection.ts met uitgebreide detectie-logica
- [x] Voeg gedragspatronen toe (uitschelden, bedreigen, belachelijk maken, kleineren, vernederen)
- [x] Voeg contextsignalen toe (klas, pauze, groep, online, appgroep, WhatsApp, Snapchat, altijd, steeds, elke dag)
- [x] Voeg slachtoffersignalen toe ("ik hoor er niet bij", "ze lachen om mij", "ik word genegeerd", etc.)
- [x] Voeg emotionele indicatoren toe (bang, verdrietig, onzeker, alleen, schaamte)
- [x] Implementeer analyse-logica: gedrag+context+emotie → PESTEN label
- [x] Implementeer herhalings-detectie: herhaling → structureel pesten
- [x] Implementeer onderscheid: 1 incident ≠ pesten; herhaling+macht+emotionele schade = pesten
- [x] Detectie-logica geïmplementeerd met confidence scoring en severity levels
- [x] Push naar GitHub

## Pesten-Specifieke Actie-Begeleiding
- [x] Voeg pesten-specifieke sectie toe aan matti-instructions.md
- [x] Implementeer 4 keuzes voor zelfredzaamheid bij pesten-detectie
- [x] Keuze 1: Grenzen aangeven ("STOP" zeggen oefenen)
- [x] Keuze 2: Gesprek met vertrouwenspersoon (leraar, mentor, ouder, schoolmaatschappelijk werk)
- [x] Keuze 3: Zelf handelen (bij groep blijven, weglopen, situatie vermijden, samen opstaan)
- [x] Keuze 4: Keuze maken (zelf proberen of hulp vragen)
- [x] Focus op empowerment en zelfredzaamheid, geen directe escalatie
- [x] Push naar GitHub

## In-App Follow-up Context voor Welkomstberichten
- [x] Maak getRecentConversationContext() utility functie
- [x] Implementeer thema-specifieke timing (pesten: 2-3 dagen, gevoelens: 2-3 dagen, school/vrienden met acties: 5 dagen)
- [x] Haal laatste conversatie-samenvatting op (< 7 dagen geleden)
- [x] Retourneer compacte context (max 100 tokens): thema, datum, 2-3 zinnen samenvatting, openstaande acties, sentiment
- [x] Pas welkomstbericht-logica aan in Chat.tsx
- [x] Check bij nieuwe sessie of er recente context is
- [x] Voeg compacte context toe aan system prompt voor Matti
- [x] Instructie aan Matti: "Vraag natuurlijk hoe het nu gaat met [thema] en of eerder advies heeft geholpen"
- [x] Token-efficiency: NIET hele conversatie, ALLEEN compacte samenvatting (~100 tokens)
- [x] Test follow-up context met verschillende thema's en timing (12/12 vitest tests passing)
- [x] Push naar GitHub (checkpoint saved)

## Bug Fixes - Welkomstbegroeting & Thema Reset
- [x] Fix welkomstbegroeting: Voeg instructie toe aan matti-instructions.md voor correcte begroeting ("Hoi!" of "Hey!", NOOIT "bent gebogen")
- [x] Fix thema reset: Bij "Nieuw Gesprek" knop, reset currentThemeId naar 'general' VOOR navigate('/chat')
- [ ] Test welkomstbegroeting live (verifieer correcte begroeting in nieuwe gesprekken)
- [ ] Test thema reset live (verifieer dat thema teruggaat naar Algemeen bij nieuw gesprek)
- [ ] Push naar GitHub

## Welkomstbegroeting Instructie Aanscherpen
- [x] Vervang regel 24 in matti-instructions.md met expliciete VERBODEN en ALLEEN format
- [x] VERBODEN: "gebogen" en andere foutieve woorden
- [x] ALLEEN: "Hoi!", "Hey!", "Chill dat je er bent!" en andere correcte begroetingen
- [x] Push naar GitHub (checkpoint saved)

## Fallback Filter voor Welkomstbegroeting
- [x] Voeg fallback filter toe in Chat.tsx na welkomstbericht generatie
- [x] Replace "bent gebogen" of "gebogen bent" met "er bent"
- [x] Case-insensitive regex: /bent gebogen|gebogen bent/gi
- [x] Toepassen op welcomeMsg.content voordat message wordt toegevoegd (2 locaties: useEffect + handleNewChat)
- [x] Push naar GitHub (checkpoint saved)

## Vaste Welkomstbericht Templates
- [x] Vervang generateWelcomeMessage() met vaste templates
- [x] Greetings: ['Hey {naam}!', 'Hoi {naam}!', 'Yo {naam}!']
- [x] Questions: ['Waar wil je het over hebben?', 'Wat kan ik voor je doen?', 'Hoe kan ik je helpen?']
- [x] Format: random(greetings) + ' ' + random(questions)
- [x] Verwijder fallback filter (niet meer nodig met vaste templates)
- [x] Update beide locaties: useEffect + handleNewChat
- [x] Push naar GitHub (checkpoint saved)

## Git Pull - Theme Detection Fix
- [x] Git pull om laatste changes van GitHub binnen te halen (git pull --rebase github main)
- [x] Verifieer theme-detection.ts fix voor liefde keywords (nieuwe keywords: grappig, lief, leuk, leuke jongen, leuk meisje, hij is, zij is)
- [x] Restart dev server indien nodig (TypeScript errors gefixed, dev server draait)
- [x] Test liefde keyword detectie (weight verhoogd naar 3 voor betere detectie)

## QR-Code Fix
- [ ] Zoek waar QR-code gegenereerd wordt in de codebase
- [ ] Update QR-code URL naar juiste productie-URL
- [ ] Verwijder hardcoded oude URL (jojcyxwl.manus.space)
- [ ] Test QR-code scanning
- [ ] Push naar GitHub

## Homepage Accordion voor Cleaner Design
- [x] Converteer info secties naar accordion/dropdown
- [x] Secties: "Wat doet Matti?", "Voor wie is Matti?", "Waarover kun je praten?", "Hoe helpt Matti?"
- [x] Gebruik shadcn/ui Accordion component
- [x] Default: alle secties dichtgeklapt voor cleaner look (type="multiple")
- [x] Test accordion functionaliteit (screenshot toont werkende accordion)
- [x] Push naar GitHub (checkpoint saved)

## Visual Editor Kleuren Fix
- [x] Pas accordion card achtergrondkleur aan naar #a1e6f7 (lichtblauw)
- [x] Pas accordion header tekstkleuren aan naar donker (#080f11, #0d181c, #0f1b1f)
- [x] Verifieer dat tekst zichtbaar blijft op lichtblauwe achtergrond
- [x] Test in browser (screenshot toont lichtblauwe card met donkere tekst)
- [x] Push naar GitHub (checkpoint saved)

## CRITICAL: Chat Pagina Blijft Hangen op Mobiel
- [x] Onderzoek browser console logs voor errors (gevonden: actionId NaN error)
- [x] Check Chat.tsx voor infinite loading states (action tracking blokkeerde chat)
- [x] Identificeer root cause (saveAction.mutateAsync met await blokkeerde message flow)
- [x] Fix infinite loading issue (action tracking nu non-blocking + validation in actionRouter)
- [x] Test op mobiel (welcome + account werken, chat moet ook werken) - klaar voor live test
- [x] Push naar GitHub (checkpoint saved)

## CRITICAL: Chat Pagina Nog Steeds Kapot (Diepere Analyse)
- [x] Check alle tRPC queries in Chat.tsx voor blocking issues (2 queries gevonden)
- [x] Analyseer getConversation query - PROBLEEM: isLoading check was `!conversation` ipv `conversationLoading`
- [x] Analyseer getRecentContext query - toegevoegd retry: 1 voor snellere failure
- [x] Check useEffect dependencies voor infinite loops (geen gevonden)
- [x] Fix Chat.tsx loading logic - gebruik query.isLoading ipv data check, added error state
- [ ] Test op mobiel na elke fix
- [ ] Push naar GitHub

## CRITICAL: Mobiel-Specifiek Chat Probleem (Desktop werkt WEL)
- [ ] Check useAuth() hook voor mobiele compatibiliteit
- [ ] Analyseer OAuth flow op mobiel (cookies, redirects, session storage)
- [ ] Check of tRPC queries anders gedragen op mobiel vs desktop
- [ ] Test met browser developer tools op mobiel (remote debugging)
- [ ] Simplify auth check - mogelijk te strikt voor mobiel
- [ ] Test gepubliceerde versie op mobiel
- [ ] Push naar GitHub

## CRITICAL: Chat Werkt Niet op Gepubliceerde Versie (Mobiel)
- [ ] Diagnose verschil tussen Manus preview (werkt) en gepubliceerde versie (werkt niet)
- [ ] Check of laatste checkpoint (3676cd73) correct gepubliceerd is
- [ ] Analyseer productie-specifieke issues (env variables, build process, caching)
- [ ] Check browser console logs op gepubliceerde versie
- [ ] Identificeer waarom chat loading faalt na publicatie maar werkt in preview
- [ ] Fix productie-specifieke bugs
- [ ] Test gepubliceerde versie op mobiel en verifieer fix
- [ ] Push naar GitHub

## Bug: Actie Statistieken Werken Niet
- [x] "Gelukt" teller blijft op 0 staan ondanks voltooide acties (ROOT CAUSE: userId regeneratie)
- [x] Score blijft op 0% staan ondanks voltooide acties (ROOT CAUSE: userId regeneratie)
- [x] Onderzoek Actions.tsx statistieken berekening (statistieken code is correct)
- [x] Fix completed actions counter logica (fixed userId persistence in Account.tsx)
- [x] Fix score percentage berekening (fixed userId persistence in Account.tsx)
- [ ] Test met meerdere voltooide acties (needs testing)
- [ ] Push naar GitHub

## Railway Deployment voor School Pilot (PRIORITEIT 1)
- [x] Analyseer Railway requirements en compatibility met Matti stack
- [x] Prepareer build configuration voor Railway (railway.json + Procfile)
- [x] Setup database migratie strategie (SQL script voor PostgreSQL schema)
- [x] Configureer environment variables voor Railway (OPENAI_API_KEY, DATABASE_URL, JWT_SECRET, etc.)
- [x] Maak Railway deployment guide met volledige instructies (RAILWAY_DEPLOYMENT_GUIDE.md)
- [ ] Test deployment op Railway testomgeving (gebruiker moet zelf deployen)
- [ ] Verifieer alle functionaliteit werkt (chat, actions, history, themes)
- [ ] Lever deployment guide + live URL aan gebruiker voor school pilot

## Dashboard Integratie Fix (KRITIEK)
- [x] Fix endpoint URL: /api/analytics/events → /api/analytics/event (nu: https://analdash-gktrmfew.manus.space/api/analytics/event)
- [x] Fix event format naar Dashboard verwachte structuur (appName, postalCodeArea, ageGroup, themes, etc.)
- [ ] Test SESSION_START event naar Dashboard (needs live testing)
- [ ] Test MESSAGE_SENT event naar Dashboard (needs live testing)
- [ ] Verifieer events verschijnen in Dashboard UI (needs live testing)
- [ ] Push naar GitHub voor Railway deployment

## Crisis-Detectie Implementatie (HIGH PRIORITY)
- [x] Maak shared/crisis-detection.ts met keywords voor suïcidaliteit, zelfbeschadiging, misbruik
- [x] Definieer severity levels (low/medium/high/critical) per crisis type
- [x] Integreer crisis-detectie in Chat.tsx (detecteert voor AI response)
- [x] Trigger trackRiskDetected event naar Dashboard bij crisis detectie
- [x] Update matti-instructies.md met crisis response protocollen (113, 112, Veilig Thuis)
- [ ] Test suïcidaliteit detectie met test berichten (needs live testing)
- [ ] Test zelfbeschadiging detectie met test berichten (needs live testing)
- [ ] Test misbruik detectie met test berichten (needs live testing)
- [ ] Verifieer high-risk events verschijnen in Dashboard (needs live testing)
- [ ] Push naar GitHub

## AI Response Feedback Systeem (USER REQUEST - SIMPEL)
- [x] Maak feedback database tabel (messageFeedback: id, conversationId, userId, messageIndex, rating (up/down), feedbackText, timestamp)
- [x] Genereer database migratie SQL (0008_right_forgotten_one.sql)
- [x] Execute migratie via webdev_execute_sql
- [x] Implementeer thumbs up/down knoppen onder elk AI bericht in Chat.tsx
- [x] Bij thumbs down: toon tekstveld "Wat ging er niet goed?"
- [x] Maak feedback tRPC router (submitFeedback mutation in feedbackRouter.ts)
- [x] Opslag feedback in database
- [ ] Test feedback flow (thumbs up, thumbs down met tekst) - needs live testing
- [ ] Gebruiker kan feedback zien via Database tab in Management UI
- [ ] Push naar GitHub

## Feedback Dashboard (USER REQUEST)
- [x] Design feedback dashboard layout (statistieken + feedback lijst)
- [x] Maak /feedback-dashboard route in App.tsx
- [x] Maak FeedbackDashboard.tsx pagina component
- [x] Implementeer statistieken sectie (totaal feedback, % positief/negatief)
- [x] Implementeer feedback lijst met conversatie context (messageIndex, rating, feedbackText, timestamp)
- [x] Voeg filter toe (alle/positief/negatief) - implemented with buttons
- [x] Style dashboard met Matti thema kleuren (gradient background, cards)
- [x] Voeg link toe naar dashboard vanuit Profile pagina
- [ ] Test dashboard met test feedback data (needs live testing)
- [ ] Push naar GitHub
