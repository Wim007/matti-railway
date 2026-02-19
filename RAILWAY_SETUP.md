# Railway Deployment Guide - Matti Web App

## Voorbereiding

Je hebt nodig:
- ✅ GitHub account (Wim007/matti-v2 repository is klaar)
- ✅ Railway account (gratis tier: $5 credit/maand)
- ✅ OpenAI API key
- ✅ OpenAI Assistant ID

---

## Fase 1: Railway Project Setup

### 1.1 Railway Account
1. Ga naar https://railway.app
2. Klik "Start a New Project"
3. Kies "Deploy from GitHub repo"
4. Selecteer `Wim007/matti-v2`

### 1.2 PostgreSQL Database Toevoegen
1. Klik in je Railway project op **"+ New"**
2. Selecteer **"Database"** → **"PostgreSQL"**
3. Railway maakt automatisch `DATABASE_URL` environment variable aan
4. Wacht tot database status "Active" is

---

## Fase 2: Environment Variables Instellen

Ga naar je **web service** → **Variables** tab en voeg toe:

```bash
# Database (automatisch aangemaakt door Railway PostgreSQL)
DATABASE_URL=postgresql://...  # Staat er al!

# OpenAI API
OPENAI_API_KEY=sk-proj-...
OPENAI_ASSISTANT_ID=asst_...

# JWT Secret (genereer met: openssl rand -base64 32)
JWT_SECRET=<random-string-hier>

# Node Environment
NODE_ENV=production

# Analytics (optioneel - voor Dashboard integratie)
ANALYTICS_ENDPOINT=https://jouw-dashboard.com/api/analytics/event
MATTI_DASHBOARD_API_KEY=<dashboard-api-key>

# Frontend analytics script (optioneel)
VITE_ANALYTICS_ENDPOINT=https://jouw-umami-domein.com
VITE_ANALYTICS_WEBSITE_ID=<website-id>
```

### Environment Variables Verkrijgen:

**OPENAI_API_KEY:**
1. Ga naar https://platform.openai.com/api-keys
2. Klik "Create new secret key"
3. Kopieer de key (begint met `sk-proj-...`)

**OPENAI_ASSISTANT_ID:**
1. Ga naar https://platform.openai.com/assistants
2. Zoek "Matti" assistant
3. Kopieer de ID (begint met `asst_...`)

**JWT_SECRET:**
Genereer random string:
```bash
openssl rand -base64 32
```
Of gebruik: https://generate-secret.vercel.app/32

---

## Fase 3: Deployment Triggeren

1. **Klik "Deploy"** in Railway dashboard
2. Railway doet automatisch:
   - ✅ Code downloaden van GitHub
   - ✅ Dependencies installeren (`pnpm install`)
   - ✅ PostgreSQL migraties genereren
   - ✅ Database schema aanmaken
   - ✅ Application builden
   - ✅ Server starten

3. **Wacht 3-5 minuten** voor eerste deployment

---

## Fase 4: Deployment Verificatie

### 4.1 Check Logs
1. Klik op **"Deployments"** tab
2. Klik op laatste deployment
3. Bekijk **"Build Logs"** en **"Deploy Logs"**

**Succesvolle deployment logs:**
```
✅ Dependencies installed
✅ PostgreSQL migrations generated
✅ Database schema created
✅ Application built
✅ Server running on port 3000
```

### 4.2 Test de Live URL
1. Ga naar **"Settings"** → **"Domains"**
2. Kopieer de Railway URL (bijv. `matti-production.up.railway.app`)
3. Open in browser
4. Test:
   - ✅ Welcome pagina laadt
   - ✅ Account aanmaken werkt
   - ✅ Chat interface laadt
   - ✅ AI antwoordt op berichten

---

## Fase 5: Custom Domain (Optioneel)

### 5.1 Domain Toevoegen
1. Ga naar **"Settings"** → **"Domains"**
2. Klik **"Custom Domain"**
3. Voer je domain in (bijv. `matti.jouwdomein.nl`)
4. Kopieer de CNAME record

### 5.2 DNS Configuratie
Bij je domain provider (Hostnet, TransIP, etc.):
1. Voeg CNAME record toe:
   - **Name:** `matti` (of `@` voor root domain)
   - **Value:** `<railway-domain>.railway.app`
   - **TTL:** 3600
2. Wacht 5-60 minuten voor DNS propagatie

---

## Troubleshooting

### ❌ "Application failed to respond"
**Oorzaak:** Environment variables ontbreken
**Oplossing:**
1. Check of `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID` zijn ingesteld
2. Redeploy: **Deployments** → **"Redeploy"**

### ❌ "Database connection failed"
**Oorzaak:** PostgreSQL service niet actief
**Oplossing:**
1. Check **PostgreSQL service** status (moet "Active" zijn)
2. Check of `DATABASE_URL` variable bestaat
3. Restart PostgreSQL service

### ❌ "Build failed"
**Oorzaak:** Dependencies installatie mislukt
**Oplossing:**
1. Check **Build Logs** voor specifieke error
2. Verify `package.json` is correct gepusht naar GitHub
3. Redeploy

### ❌ "OpenAI API error"
**Oorzaak:** Verkeerde API key of Assistant ID
**Oplossing:**
1. Verify `OPENAI_API_KEY` begint met `sk-proj-`
2. Verify `OPENAI_ASSISTANT_ID` begint met `asst_`
3. Test API key op https://platform.openai.com/playground

---

## Kosten Overzicht

**Railway Free Tier:**
- ✅ $5 credit per maand (gratis)
- ✅ Voldoende voor 1-2 scholen pilot testing
- ✅ ~500MB RAM usage
- ✅ PostgreSQL database included

**Geschatte usage voor pilot:**
- Web service: ~$2-3/maand
- PostgreSQL: ~$1-2/maand
- **Totaal: ~$3-5/maand** (binnen gratis tier!)

**Na pilot (bij schaling):**
- Hobby plan: $5/maand (500 uur execution)
- Pro plan: $20/maand (unlimited execution)

---

## Auto-Deploy Setup (Optioneel)

**Automatische deployment bij GitHub push:**

1. Ga naar Railway project → **Settings**
2. Scroll naar **"Deployments"**
3. Enable **"Auto-deploy on push"**
4. Kies branch: **main**

Nu deployt Railway automatisch bij elke GitHub push!

**Workflow:**
1. Fix bug in deployment flow
2. Push naar GitHub (`gh` CLI of GitHub Desktop)
3. Railway deployt automatisch (~5 min)
4. Test op live URL

---

## Support

**Railway Documentatie:**
- https://docs.railway.app

**Matti Specifieke Vragen:**
- Check logs in Railway dashboard
- Verify environment variables
- Test OpenAI API key apart

**Database Issues:**
- Railway PostgreSQL logs: **PostgreSQL service** → **"Logs"**
- Check migrations: `drizzle/migrations-postgres/`

---

## Checklist voor Go-Live

- [ ] PostgreSQL database actief
- [ ] Alle environment variables ingesteld
- [ ] Deployment succesvol (groene status)
- [ ] Welcome pagina laadt
- [ ] Account aanmaken werkt
- [ ] Chat interface werkt
- [ ] AI antwoordt correct
- [ ] Analytics Dashboard connectie werkt (optioneel)
- [ ] Custom domain geconfigureerd (optioneel)
- [ ] Auto-deploy enabled (optioneel)

**Klaar voor school pilot testing! 🚀**
