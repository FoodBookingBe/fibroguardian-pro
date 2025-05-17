# FibroGuardian Pro - Launch Day Draaiboek

**Datum Lancering:** `[DATUM_HIER_INVULLEN]` (bv. 2025-06-15)
**Doel Lanceringstijd:** 10:00 CET (Amsterdam/Brussel)

## 1. Pre-Launch Fase (D-7 tot D-1)

### D-7 (Een week voor lancering)
- **Communicatie:**
    - [ ] Interne aankondiging: Definitieve lanceringsdatum en -tijd bevestigd aan het team.
    - [ ] Externe teaser: "Coming Soon" update op social media en website.
- **Technisch:**
    - [ ] Code freeze voor alle *nieuwe* features. Alleen bugfixes toegestaan.
    - [ ] Volledige regressietestronde gestart op staging omgeving.
    - [ ] Performance benchmarks vastgesteld op staging.
    - [ ] Database schema definitief en RLS policies gecontroleerd.
- **Marketing & Sales:**
    - [ ] Persbericht concept #1 klaar.
    - [ ] E-mail naar wachtlijst/early-access concept #1 klaar.
    - [ ] Social media content kalender voor launch week definitief.
- **Support:**
    - [ ] FAQ en kennisbank artikelen voor nieuwe features/abonnementen geschreven.

### D-3 (Drie dagen voor lancering)
- **Technisch:**
    - [ ] Alle kritieke en hoge prioriteit bugs van regressietestronde opgelost en getest.
    - [ ] Staging omgeving is 1:1 met wat naar productie gaat.
    - [ ] Finale load test op staging uitgevoerd. Resultaten geanalyseerd.
    - [ ] Database backup van productie (indien bestaand) gemaakt en herstelprocedure getest.
    - [ ] Alle secrets en environment variabelen voor productie gecontroleerd en klaargezet.
- **Marketing & Sales:**
    - [ ] Perscontactenlijst definitief.
    - [ ] Alle marketing assets (afbeeldingen, video's) definitief.
- **Support:**
    - [ ] Support team getraind op nieuwe features en mogelijke issues.

### D-1 (Dag voor lancering)
| Tijd (CET) | Taak                                                                 | Verantwoordelijke(n)        | Status |
|------------|----------------------------------------------------------------------|---------------------------|--------|
| 09:00      | **Go/No-Go Meeting:** Finale beslissing o.b.v. QA, performance, en business readiness. | Kernteam (PM, Tech Lead, Marketing Lead) | ☐      |
| 10:00      | (Indien GO) Start finale deployment naar staging (identiek aan productie build). | DevOps / Tech Lead        | ☐      |
| 11:00      | Finale smoke test op staging door QA en Product Owner.                 | QA, PO                    | ☐      |
| 13:00      | Stripe account: Live modus geactiveerd, alle producten/prijzen/webhooks gecontroleerd. | Finance / Tech Lead       | ☐      |
| 14:00      | Alle externe services (e-mail, analytics) geconfigureerd voor productie. | DevOps / Marketing        | ☐      |
| 15:00      | Communicatiekanalen (Slack #launch-war-room, statuspagina) opgezet.    | Communicatie / DevOps     | ☐      |
| 16:00      | Launch day draaiboek (dit document) doorgenomen met het kernteam.      | Project Manager           | ☐      |
| 17:00      | Alle marketing e-mails en social media posts ingepland.                | Marketing                 | ☐      |
| Doorlopend | Monitoring van staging omgeving.                                       | DevOps                    | ☐      |

## 2. Launch Day (D-Day)

**Kernteam Aanwezig (Fysiek of Virtueel):** PM, Tech Lead, Lead Frontend, Lead Backend, DevOps, QA Lead, Marketing Lead, Support Lead.

| Tijd (CET) | Taak                                                                 | Verantwoordelijke(n)        | Status | Notities/Resultaten |
|------------|----------------------------------------------------------------------|---------------------------|--------|---------------------|
| **Fase 1: Technische Deployment (08:00 - 09:00)**                                                                  |                           |        |                     |
| 08:00      | Start productie deployment via GitHub Actions (`production-deploy.yml`). | DevOps / Tech Lead        | ☐      | Workflow URL:       |
| 08:05      | Monitoring van `validate_inputs_and_branch` job.                       | DevOps                    | ☐      |                     |
| 08:15      | Monitoring van `test_and_lint` job.                                  | DevOps, QA Lead           | ☐      |                     |
| 08:30      | Monitoring van `build_application` job.                                | DevOps                    | ☐      |                     |
| 08:40      | Monitoring van `notify_pre_deployment` job (Slack check).              | Communicatie              | ☐      |                     |
| 08:45      | Monitoring van `deploy_to_production` job:                            | DevOps                    | ☐      |                     |
|            | - Database migraties (indien `run_migrations: true`)                   |                           | ☐      |                     |
|            | - Applicatie deployment (bv. ECS update, Vercel deploy)                |                           | ☐      |                     |
|            | - CDN invalidatie (indien van toepassing)                              |                           | ☐      |                     |
| 09:00      | **Deployment Voltooid (Technisch)**                                    | DevOps                    | ☐      |                     |
| **Fase 2: Verificatie & Interne Tests (09:00 - 09:45)**                                                            |                           |        |                     |
| 09:00      | DevOps: Verifieer server status, logs, geen initiële errors.           | DevOps                    | ☐      |                     |
| 09:05      | QA Team: Start smoke tests op productie (kritieke paden, registratie, login, kernfeature). | QA Team                   | ☐      |                     |
| 09:20      | Product Owner: Verifieer kernfunctionaliteit en user experience.       | PO                        | ☐      |                     |
| 09:30      | Marketing: Controleer landingspagina, prijzenpagina, links.            | Marketing                 | ☐      |                     |
| 09:40      | Support: Test support widget en contactformulieren.                    | Support Lead              | ☐      |                     |
| 09:45      | **Interne Verificatie Voltooid. Go/No-Go voor Publieke Aankondiging.** | Kernteam                  | ☐      |                     |
| **Fase 3: Publieke Lancering & Aankondiging (10:00)**                                                              |                           |        |                     |
| 10:00      | **OFFICIËLE LANCERINGSTIJD**                                           |                           |        |                     |
| 10:00      | Marketing: Verstuur launch e-mail naar wachtlijst & alle contacten.    | Marketing Lead            | ☐      |                     |
| 10:05      | Marketing: Publiceer social media aankondigingen.                      | Social Media Manager      | ☐      |                     |
| 10:10      | Marketing: Publiceer blogpost over de lancering.                       | Content Manager           | ☐      |                     |
| 10:15      | PR: Verstuur persbericht (indien van toepassing).                      | PR / Marketing            | ☐      |                     |
| 10:20      | Website: Verwijder "Coming Soon" banners, update naar live status.     | Webmaster / Frontend      | ☐      |                     |
| 10:30      | Monitoring: Start intensieve monitoring van analytics, server load, error rates. | DevOps, Data Analyst      | ☐      |                     |
| **Fase 4: Post-Launch Monitoring & Eerste Respons (10:30 - Einde Dag)**                                             |                           |        |                     |
| Doorlopend | Monitoring van systemen, supportkanalen, social media.                 | Alle Teamleden            | ☐      |                     |
| 11:00      | Eerste check-in: Status van registraties, errors, feedback.            | Kernteam                  | ☐      |                     |
| 13:00      | Tweede check-in: Diepere analyse van data, eventuele P1 issues.        | Kernteam                  | ☐      |                     |
| 15:00      | Support team: Eerste overzicht van type vragen/issues.                 | Support Lead              | ☐      |                     |
| 17:00      | Derde check-in: Einde werkdag (EU) status, planning voor avond/nacht.  | Kernteam                  | ☐      |                     |
| 21:00      | Laatste check-in voor de dag (indien nodig, afhankelijk van teamlocatie). | Tech Lead / DevOps        | ☐      |                     |

## 3. Post-Launch (D+1 en verder)
- **D+1 Ochtend:**
    - [ ] Analyse van launch day data (registraties, activiteit, errors, server performance).
    - [ ] Review van alle support tickets en social media feedback.
    - [ ] Prioriteren van eventuele hotfixes.
- **D+1 Middag:**
    - [ ] Launch post-mortem meeting: Wat ging goed, wat kan beter, lessen geleerd.
    - [ ] Planning voor de eerste post-launch sprint/iteratie.
- **Eerste Week Post-Launch:**
    - [ ] Continue monitoring en snelle bugfixing.
    - [ ] Actief reageren op gebruikersfeedback.
    - [ ] Starten van geplande content marketing (blog, social).
    - [ ] Evalueren van initiële marketingcampagne resultaten.
- **Eerste Maand Post-Launch:**
    - [ ] Uitgebreide analyse van gebruikersgedrag en cohorten.
    - [ ] Optimalisatie van onboarding flow o.b.v. data.
    - [ ] Verzamelen van testimonials.
    - [ ] Voorbereiden van eerste feature update of verbeteringsronde.

## 4. Communicatieplan

### Interne Communicatie:
- **Primair Kanaal:** Slack `#launch-war-room` (real-time updates, snelle beslissingen).
- **Secundair Kanaal:** Korte stand-up meetings via video call op vaste check-in tijden.
- **Status Updates:** Project Manager stuurt elke 2-3 uur een samenvattende statusupdate in Slack.

### Externe Communicatie (bij problemen):
- **Statuspagina:** `https://status.fibroguardian.be` (of vergelijkbaar) wordt gebruikt om gebruikers te informeren over eventuele storingen of gepland onderhoud.
- **Social Media:** Korte updates via Twitter/Facebook indien nodig.
- **In-app Notificatie:** Indien mogelijk en relevant.

## 5. Rollback Plan (Noodprocedure)

**Criteria voor Rollback:**
1.  Kritieke bug die dataverlies of -corruptie veroorzaakt.
2.  Beveiligingsincident (actief of potentieel).
3.  Meer dan 25% van de gebruikers kan niet inloggen of kernfunctionaliteit gebruiken voor > 30 minuten.
4.  Betalingssysteem (Stripe) faalt en kan niet snel worden hersteld.
5.  Continue hoge error rate (>5%) op server of client-side die niet direct oplosbaar is.

**Procedure:**
1.  **Beslissing:** Tech Lead en Project Manager nemen de beslissing in overleg met DevOps.
2.  **Communicatie (Intern):** Onmiddellijke aankondiging in `#launch-war-room`.
3.  **Communicatie (Extern):** Update statuspagina: "We ervaren technische problemen en werken aan een oplossing. De applicatie kan tijdelijk onbereikbaar zijn."
4.  **Technische Rollback:**
    - DevOps: Start rollback script/procedure naar de vorige stabiele versie.
    - Database: Herstel database naar pre-migratie backup indien migraties de oorzaak zijn en niet teruggedraaid kunnen worden.
    - CDN: Invalideer cache indien nodig.
5.  **Verificatie:** QA team test de gerollde-back versie op staging (indien mogelijk) en daarna productie.
6.  **Communicatie (Extern):** Update statuspagina: "De problemen zijn geïdentificeerd. We hebben de vorige stabiele versie hersteld. Onze excuses voor het ongemak."
7.  **Post-Mortem:** Direct na stabilisatie, root cause analyse en plan voor nieuwe poging.

**Verantwoordelijken Rollback:**
- Beslissing: Tech Lead, Project Manager
- Uitvoering: DevOps Lead
- Verificatie: QA Lead

---
Dit draaiboek is een levend document en kan worden aangepast naarmate de lanceerdatum nadert.
