# Cross-Platform Testing Matrix voor FibroGuardian Pro

Dit document dient als een matrix voor het systematisch testen van FibroGuardian Pro over verschillende browsers, besturingssystemen, schermresoluties, en netwerkcondities.

**Datum:** {{ LAATSTE_UPDATE_DATUM }}
**Test Versie:** {{ APP_VERSIE }}

## 1. Web Browsers

| Browser          | Versie (Doel) | Desktop (Win) | Desktop (Mac) | Mobiel (And) | Mobiel (iOS) | Tablet (And) | Tablet (iOS) | Tester | Status | Opmerkingen |
|------------------|---------------|---------------|---------------|--------------|--------------|--------------|--------------|--------|--------|-------------|
| **Chrome**       | Laatste stabiel | ☐             | ☐             | ☐            | ☐            | ☐            | ☐            |        |        |             |
| **Firefox**      | Laatste stabiel | ☐             | ☐             | ☐            | ☐            | ☐            | ☐            |        |        |             |
| **Safari**       | Laatste stabiel | ❌ (N.v.t.)    | ☐             | ❌ (N.v.t.)   | ☐            | ❌ (N.v.t.)   | ☐            |        |        |             |
| **Edge**         | Laatste stabiel | ☐             | ☐ (Indien beschikbaar) | ☐            | ☐            | ☐            | ☐            |        |        |             |
| **Samsung Internet** | Laatste stabiel | ❌ (N.v.t.)    | ❌ (N.v.t.)    | ☐            | ❌ (N.v.t.)   | ☐            | ❌ (N.v.t.)   |        |        |             |
| **Opera**        | Laatste stabiel | ☐             | ☐             | ☐            | ☐            | ☐            | ☐            |        |        | (Lagere prioriteit) |

**Legenda Status:**

- ☐: Nog te testen
- ✅: Geslaagd
- ⚠️: Geslaagd met opmerkingen/kleine issues
- ❌: Gefaald
- N.v.t.: Niet van toepassing

## 2. Besturingssystemen

| OS               | Versie (Doel)    | Desktop | Mobiel | Tablet | Tester | Status | Opmerkingen |
|------------------|------------------|---------|--------|--------|--------|--------|-------------|
| **Windows**      | 10, 11           | ☐       | ❌     | ☐      |        |        |             |
| **macOS**        | Laatste 2 versies| ☐       | ❌     | ❌     |        |        |             |
| **iOS**          | Laatste 2 versies| ❌      | ☐      | ☐      |        |        |             |
| **Android**      | Laatste 3 versies| ❌      | ☐      | ☐      |        |        | (Focus op populaire fabrikanten zoals Samsung, Google Pixel) |
| **iPadOS**       | Laatste 2 versies| ❌      | ❌     | ☐      |        |        |             |

## 3. Schermresoluties & Oriëntaties

| Resolutie (ongeveer) | Apparaattype     | Oriëntatie (P/L) | Tester | Status | Opmerkingen |
|----------------------|------------------|-----------------|--------|--------|-------------|
| 360x640 - 430x932    | Mobiel (Portrait)| P               |        | ☐      | (Typische smartphones) |
| 640x360 - 932x430    | Mobiel (Landscape)| L             |        | ☐      |             |
| 768x1024 - 834x1194  | Tablet (Portrait)| P               |        | ☐      | (Typische tablets) |
| 1024x768 - 1194x834  | Tablet (Landscape)| L             |        | ☐      |             |
| 1280x720 - 1366x768  | Laptop / Klein Desktop | L           |        | ☐      |             |
| 1920x1080 (Full HD)  | Desktop/Laptop   | L               |        | ☐      | (Meest voorkomend) |
| 2560x1440 (QHD)      | Desktop          | L               |        | ☐      |             |
| 3840x2160 (4K)       | Desktop (Optioneel) | L            |        | ☐      | (Lagere prioriteit indien geen specifieke 4K features) |

## 4. Toegankelijkheidstechnologieën (Basis Checks)

| Technologie          | Platform         | Tester | Status | Opmerkingen |
|----------------------|------------------|--------|--------|-------------|
| **Keyboard Navigatie**| Alle Desktop     |        | ☐      | Alle interactieve elementen bereikbaar en bedienbaar? Focus volgorde logisch? |
| **Screen Reader (Basis)** | Win (NVDA), Mac (VO) |    | ☐      | Pagina structuur, landmarks, afbeelding alt-teksten, formulier labels. |
| **Zoom (200%)**      | Alle             |        | ☐      | Geen content verlies of overlap? Layout blijft bruikbaar? |
| **Hoog Contrast Modus**| OS-niveau        |        | ☐      | Tekst leesbaar? UI elementen onderscheidbaar? |

## 5. Netwerkcondities (Simulatie via Browser DevTools)

| Conditie         | Simulatiemethode | Tester | Status | Opmerkingen |
|------------------|------------------|--------|--------|-------------|
| **Online - Snel**| Standaard        |        | ☐      | (bv. WiFi, Kabel) |
| **Online - 4G**  | Chrome DevTools  |        | ☐      |             |
| **Online - 3G Traag**| Chrome DevTools  |        | ☐      |             |
| **Offline**      | Chrome DevTools / Vliegtuigmodus |  | ☐      | Test PWA offline fallback, Dexie caching, background sync. |

## 6. Kernfunctionaliteit Testen (Rooktest op diverse platformen)

Lijst van 5-10 kritieke user flows die op een subset van de bovenstaande matrix worden getest om brede compatibiliteit te verzekeren.
Voorbeeld flows:

1. Registratie + Onboarding (eerste taak)
2. Login + Dashboard view + Taak loggen
3. Abonnement selecteren + Start Checkout
4. Specialist uitnodigen (patiënt) / Patiënt accepteren (specialist)
5. Data bekijken in grafiek/rapport

| Kernflow ID | Beschrijving Flow | Chrome/Win | Safari/iOS | Chrome/And | Firefox/Win | Status |
|-------------|-------------------|------------|------------|------------|-------------|--------|
| KF-01       | Registratie & Onboarding | ☐          | ☐          | ☐          | ☐           |        |
| KF-02       | Login & Taak Loggen    | ☐          | ☐          | ☐          | ☐           |        |
| KF-03       | Abonnement Starten     | ☐          | ☐          | ☐          | ☐           |        |
| KF-04       | Specialist Koppeling   | ☐          | ☐          | ☐          | ☐           |        |
| KF-05       | Rapport Bekijken       | ☐          | ☐          | ☐          | ☐           |        |

## Testrapport Samenvatting (Invullen na testronde)

| Categorie          | Totaal Getest | Geslaagd | Gefaald (Kritiek) | Gefaald (Overig) | Opmerkingen |
|--------------------|---------------|----------|-------------------|------------------|-------------|
| Web Browsers       |               |          |                   |                  |             |
| Besturingssystemen |               |          |                   |                  |             |
| Schermresoluties   |               |          |                   |                  |             |
| Toegankelijkheid   |               |          |                   |                  |             |
| Netwerkcondities   |               |          |                   |                  |             |
| Kernfunctionaliteit|               |          |                   |                  |             |
| **TOTAAL**         |               |          |                   |                  |             |

**Algemene Conclusie / Aanbeveling:**
