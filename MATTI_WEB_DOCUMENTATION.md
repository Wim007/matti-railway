# Matti Web App - Technische Documentatie

## Overzicht

Deze web-applicatie is een 1-op-1 port van de originele Matti mobile app (React Native + Expo) naar een browser-gebaseerde webapplicatie. De app behoudt alle core functionaliteit en UI/UX van de originele app, maar draait nu in de browser en is deploybaar als standalone webapp.

**Stack:** React 19 + TypeScript + Tailwind CSS 4 + tRPC 11 + Express + MySQL + OpenAI Assistant API

---

## Architectuur

### Frontend (Client)
- **Framework:** React 19 met TypeScript
- **Styling:** Tailwind CSS 4 met custom theme colors
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** React Context API (MattiThemeContext, ThemeContext)
- **API Client:** tRPC React Query hooks
- **UI Components:** Custom components + shadcn/ui basis

### Backend (Server)
- **Runtime:** Node.js met Express
- **API Layer:** tRPC 11 (type-safe procedures)
- **Database:** MySQL via Drizzle ORM
- **Authentication:** Manus OAuth (via platform)
- **AI Integration:** OpenAI Assistant API

### Database Schema
```sql
-- Users table (managed by platform)
users (
  id, openId, name, email, role, 
  createdAt, updatedAt, lastSignedIn
)

-- Conversations table
conversations (
  id, userId, themeId, threadId, 
  messages (JSON), summary, 
  createdAt, updatedAt
)
```

---

## Features Geïmplementeerd

### ✅ Onboarding Flow
- Welcome screen met introductie
- Account setup (naam, leeftijd, gender, postcode)
- Anonieme data (geen persoonlijke info opslag)
- Analytics consent

### ✅ Chat Systeem
- 9 thema's (School, Vrienden, Thuis, Gevoelens, Liefde, Vrije Tijd, Toekomst, Jezelf, Algemeen)
- Theme-specific gradients en emoji's
- Real-time chat met OpenAI Assistant API
- User context (naam/leeftijd/gender) voor empathymap
- Typing indicator tijdens AI response
- Message persistence per thema
- "Nieuw Gesprek" functionaliteit

### ✅ Conversation Management
- Thread management per thema (OpenAI threads)
- Automatische summarization na 10 berichten
- Context building (summary + laatste 8 berichten)
- Message history opslag in database

### ✅ Theme Switching
- Global theme state (MattiThemeContext)
- Click-to-switch op Themes pagina
- Automatisch conversation laden bij theme switch
- Theme persistence in localStorage

### ✅ History Screen
- Conversatie-lijst per thema
- Datum-groepering (Vandaag, Deze week, Deze maand, Ouder)
- Summary preview per conversatie
- Message count
- Click-to-resume functionaliteit
- Empty state met call-to-action

### ✅ Profile & Settings
- User profile display
- Logout functionaliteit
- Parent info pagina

---

## Nog NIET Geïmplementeerd

### ❌ Follow-up Scheduling
- Action detection in gesprekken
- Follow-up notifications (Day 2, 4, 7, 10, etc.)
- Reward systeem voor completed actions

### ❌ Theme Detection
- Automatische thema-suggesties tijdens chat
- Confidence-based switching

### ❌ Message Streaming
- **Besluit:** Originele app gebruikt GEEN streaming
- Response komt in één keer via `createAndPoll()`
- Typing indicator is voldoende

### ❌ Analytics
- Conversation metrics
- Dashboard reporting voor stakeholders
- Outcome tracking

---

## Mapstructuur

```
matti-webapp/
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── pages/            # Route components
│   │   │   ├── onboarding/   # Welcome, Account
│   │   │   ├── Chat.tsx      # Main chat screen
│   │   │   ├── History.tsx   # Conversation history
│   │   │   ├── Themes.tsx    # Theme selection
│   │   │   ├── Profile.tsx   # User profile
│   │   │   └── ParentInfo.tsx
│   │   ├── contexts/         # React contexts
│   │   │   ├── MattiThemeContext.tsx  # Matti theme state
│   │   │   └── ThemeContext.tsx       # Color theme (dark/light)
│   │   ├── lib/
│   │   │   └── trpc.ts       # tRPC client setup
│   │   ├── App.tsx           # Routing
│   │   ├── main.tsx          # App entry + providers
│   │   └── index.css         # Global styles + Matti theme colors
│   └── public/               # Static assets
├── server/                    # Backend Express + tRPC
│   ├── routers.ts            # Main tRPC router
│   ├── assistantRouter.ts    # OpenAI Assistant API integration
│   ├── chatRouter.ts         # Conversation management
│   ├── db.ts                 # Database helpers
│   └── _core/                # Framework plumbing (OAuth, context, etc.)
├── drizzle/                   # Database schema + migrations
│   └── schema.ts             # Drizzle schema definition
├── shared/                    # Shared types tussen client/server
│   └── matti-types.ts        # Theme types, user profile, etc.
└── todo.md                    # Feature tracking
```

---

## Lokaal Starten

### Vereisten
- Node.js 22+
- pnpm 10+
- MySQL database (via Manus platform)
- OpenAI API credentials

### Environment Variables
```bash
# Automatisch geïnjecteerd door Manus platform:
DATABASE_URL=mysql://...
JWT_SECRET=...
OAUTH_SERVER_URL=...
VITE_APP_ID=...
OWNER_OPEN_ID=...

# Handmatig toevoegen via Management UI → Settings → Secrets:
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...
```

### Commando's
```bash
# Development server starten
pnpm dev

# Build voor productie
pnpm build

# Start productie server
pnpm start

# TypeScript type checking
pnpm check

# Tests draaien
pnpm test

# Database migratie
pnpm db:push
```

### Lokale URL
```
http://localhost:3000
```

---

## OpenAI Assistant API Integratie

### Flow
1. User stuurt bericht in chat
2. Frontend roept `trpc.assistant.send.mutate()` aan
3. Server:
   - Haalt of creëert OpenAI thread (per thema)
   - Bouwt context: user profile + summary + recent messages
   - Voegt user message toe aan thread
   - Runt assistant via `createAndPoll()`
   - Wacht tot run compleet is
   - Haalt assistant response op
4. Frontend toont response + slaat op in database
5. Na 10 berichten: automatische summarization

### Context Management
```typescript
// User context voor empathymap
[GEBRUIKER CONTEXT - BELANGRIJK VOOR EMPATHYMAP]
Naam: {name}
Leeftijd: {age} jaar ({ageGroup})
Gender: {gender}
Huidig thema: {themeId}

// Conversation context
{summary}

---

Recente berichten:
{laatste 8 berichten}

---

Gebruiker: {nieuw bericht}
```

### Summarization
- Trigger: na elke 10e bericht
- Model: gpt-4o-mini (cost-efficient)
- Prompt: "Vat dit gesprek samen in max 150 woorden"
- Opslag: `conversations.summary` kolom
- Gebruik: in context voor volgende berichten

---

## UI/UX Details

### Theme Colors
Elke thema heeft een unieke gradient:
```typescript
general:  #8B5CF6 → #A78BFA (paars)
school:   #3B82F6 → #60A5FA (blauw)
friends:  #10B981 → #34D399 (groen)
home:     #F97316 → #FB923C (oranje)
feelings: #EC4899 → #F472B6 (roze)
love:     #EF4444 → #F87171 (rood)
freetime: #FBBF24 → #FCD34D (geel)
future:   #06B6D4 → #22D3EE (cyaan)
self:     #6366F1 → #818CF8 (indigo)
```

### Chat Bubbles
- **User:** Rechts, gradient background (theme-specific), wit text
- **AI:** Links, lichtgrijze background, donkere text
- **Styling:** Rounded corners, padding, max-width 80%

### Typing Indicator
- 3 bouncing dots
- Gradient background (theme-specific)
- Animatie: stagger delay per dot

### Tab Navigation
- Bottom fixed bar
- 5 tabs: Chat, Geschiedenis, Thema's, Profiel, Ouders
- Active state: opacity 100%, inactive 50%
- Emoji icons + labels

---

## Deployment

### Via Manus Platform
1. Voeg OpenAI credentials toe via Management UI → Settings → Secrets
2. Test de app via Preview panel
3. Maak checkpoint via `webdev_save_checkpoint`
4. Klik "Publish" in Management UI header
5. Optioneel: custom domain via Settings → Domains

### Externe Hosting (niet aanbevolen)
- Manus biedt built-in hosting met custom domain support
- Externe hosting kan compatibility issues geven
- Als toch extern: export code via Settings → GitHub

---

## Testing

### Handmatig Testen
1. **Onboarding:** Doorloop welcome → account setup
2. **Chat:** Stuur berichten, wissel thema's, test "Nieuw Gesprek"
3. **History:** Bekijk conversatie-lijst, klik om te hervatten
4. **Themes:** Klik op thema-kaart, check of chat header updatet
5. **Profile:** Bekijk profiel, test logout

### Unit Tests
Nog niet geïmplementeerd. Aanbevolen:
- `server/chatRouter.test.ts` - Conversation management
- `server/assistantRouter.test.ts` - OpenAI integration
- Frontend component tests met Vitest

---

## Troubleshooting

### "Database unavailable"
- Check `DATABASE_URL` in environment
- Verify database connection via Management UI → Database panel

### "OpenAI API error"
- Check `OPENAI_API_KEY` en `OPENAI_ASSISTANT_ID` in Secrets
- Verify API key is valid en heeft credits
- Check console logs voor specifieke error

### "No assistant response"
- Check OpenAI Assistant status (mogelijk rate limit)
- Verify thread ID is correct
- Check run status in OpenAI dashboard

### Chat niet laden
- Clear localStorage (theme/profile data)
- Check browser console voor errors
- Verify user is authenticated (Manus OAuth)

### Theme switch werkt niet
- Check MattiThemeContext provider in main.tsx
- Verify localStorage.setItem('currentTheme') werkt
- Check console logs voor context updates

---

## Volgende Stappen

### Prioriteit 1: Testen met Echte Data
- Voeg OpenAI credentials toe
- Test volledige chat flow
- Verify summarization werkt
- Check history persistence

### Prioriteit 2: Action Detection
- Implementeer regex/LLM-based action detection
- Sla acties op in database
- Schedule follow-up notifications (Day 2, 4, 7, 10)

### Prioriteit 3: Analytics & Dashboard
- Track conversation metrics
- Outcome reporting voor stakeholders
- Integration met Dashboard project

### Prioriteit 4: UX Improvements
- Loading skeletons
- Error boundaries
- Offline support
- PWA manifest

---

## Contact & Support

Voor vragen over de Matti web-app:
- Check deze documentatie eerst
- Review `todo.md` voor feature status
- Check Management UI voor deployment status
- Voor Manus platform support: https://help.manus.im

---

**Laatste update:** 30 januari 2026
**Versie:** 439ae8b4 (History Screen Geïmplementeerd)
