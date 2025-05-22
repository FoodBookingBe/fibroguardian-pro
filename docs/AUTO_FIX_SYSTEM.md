# FibroGuardian Auto-Fix System

Dit document beschrijft het Auto-Fix System voor FibroGuardian Pro, een geautomatiseerd systeem voor het detecteren en oplossen van code quality issues.

## Inhoudsopgave

1. [Overzicht](#overzicht)
2. [Componenten](#componenten)
3. [Installatie](#installatie)
4. [Gebruik](#gebruik)
5. [Configuratie](#configuratie)
6. [CI/CD Integratie](#cicd-integratie)
7. [Best Practices](#best-practices)

## Overzicht

Het Auto-Fix System is ontworpen om code quality issues automatisch te detecteren en op te lossen, waardoor de ontwikkelaars zich kunnen concentreren op het bouwen van features in plaats van het handmatig oplossen van linting en formatting issues.

Het systeem bestaat uit verschillende componenten:
- **Auto-Fix System**: Detecteert en lost code quality issues op
- **Real-time Fixer**: Monitort bestanden tijdens ontwikkeling en lost issues direct op
- **TypeScript Fixer**: Specifiek voor het oplossen van TypeScript-gerelateerde issues
- **CI/CD Integratie**: Automatische fixes in de GitHub Actions workflow
- **VS Code Integratie**: Editor configuratie voor auto-fixes

## Componenten

### Auto-Fix System (`scripts/auto-fix-system.js`)

Het hoofdsysteem dat code quality issues detecteert en oplost. Het analyseert de codebase op ESLint, TypeScript en andere issues en past automatisch fixes toe waar mogelijk.

Belangrijkste features:
- Detectie van ESLint issues
- Automatische fixes voor veelvoorkomende problemen
- Gedetailleerde rapportage van opgeloste issues
- Preventief systeem voor toekomstige issues

### Real-time Fixer (`scripts/realtime-fixer.js`)

Een file watcher die bestanden monitort tijdens ontwikkeling en issues direct oplost zodra ze ontstaan.

Belangrijkste features:
- Real-time monitoring van bestandswijzigingen
- Onmiddellijke fixes voor ESLint en formatting issues
- Integratie met VS Code en Git hooks
- Statistieken over opgeloste issues

### TypeScript Fixer (`scripts/fix-typescript.js`)

Een gespecialiseerde fixer voor TypeScript-gerelateerde issues.

Belangrijkste features:
- Toevoegen van ontbrekende React imports
- Toevoegen van return types voor React componenten
- Vervangen van `any` types met `unknown`
- Oplossen van event handler types

### CI/CD Integratie (`.github/workflows/auto-fix.yml`)

GitHub Actions workflow voor automatische fixes in de CI/CD pipeline.

Belangrijkste features:
- Automatische fixes bij elke push en pull request
- Dagelijkse proactieve cleanup
- Gedetailleerde rapportage in pull requests
- Quality gate voor kritieke issues

### VS Code Integratie (`.vscode/settings.json`)

Editor configuratie voor auto-fixes tijdens ontwikkeling.

Belangrijkste features:
- Auto-fix on save
- Import organization
- Tailwind CSS optimalisatie
- TypeScript auto-imports

## Installatie

Het Auto-Fix System is al geïnstalleerd in het FibroGuardian Pro project. De benodigde dependencies zijn toegevoegd aan `package.json` en de scripts zijn beschikbaar in de `scripts` directory.

Als je het systeem wilt installeren in een ander project, volg dan deze stappen:

1. Kopieer de scripts naar je project:
   ```bash
   cp scripts/auto-fix-system.js scripts/realtime-fixer.js scripts/fix-typescript.js <jouw-project>/scripts/
   ```

2. Kopieer de GitHub Actions workflow:
   ```bash
   mkdir -p <jouw-project>/.github/workflows
   cp .github/workflows/auto-fix.yml <jouw-project>/.github/workflows/
   ```

3. Installeer de benodigde dependencies:
   ```bash
   npm install --save-dev eslint-plugin-unused-imports organize-imports-cli chokidar husky lint-staged
   ```

4. Voeg de scripts toe aan `package.json`:
   ```json
   "scripts": {
     "fix": "npm run fix:lint && npm run fix:format && npm run fix:imports",
     "fix:lint": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
     "fix:format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md,yml,yaml}\"",
     "fix:imports": "organize-imports-cli \"**/*.{ts,tsx}\"",
     "fix:all": "npm run fix && npm run fix:tailwind && npm run fix:types",
     "fix:tailwind": "eslint . --ext .ts,.tsx,.js,.jsx --fix --rule \"tailwindcss/classnames-order: error\" --rule \"tailwindcss/enforces-shorthand: error\"",
     "fix:types": "node scripts/fix-typescript.js",
     "autofix": "node scripts/auto-fix-system.js",
     "autofix:watch": "node scripts/realtime-fixer.js",
     "autofix:setup": "node scripts/realtime-fixer.js --setup",
     "autofix:now": "node scripts/realtime-fixer.js --fix-now"
   }
   ```

5. Setup de Git hooks:
   ```bash
   npm run autofix:setup
   ```

## Gebruik

### One-time Fix

Om een one-time fix uit te voeren voor alle huidige issues:

```bash
npm run autofix:now
```

Dit zal alle ESLint, Prettier en TypeScript issues in de codebase oplossen.

### Continuous Watching

Om bestanden te monitoren tijdens ontwikkeling en issues direct op te lossen:

```bash
npm run autofix:watch
```

Dit zal een file watcher starten die bestanden monitort en issues direct oplost zodra ze ontstaan.

### Specifieke Fixes

Voor specifieke types van fixes:

```bash
# ESLint fixes
npm run fix:lint

# Prettier formatting
npm run fix:format

# Import organization
npm run fix:imports

# TypeScript fixes
npm run fix:types

# Tailwind CSS fixes
npm run fix:tailwind

# Alle fixes
npm run fix:all
```

### VS Code Integratie

De VS Code instellingen zijn al geconfigureerd voor auto-fixes tijdens ontwikkeling. Wanneer je een bestand opslaat, worden de volgende acties automatisch uitgevoerd:

- ESLint fixes
- Prettier formatting
- Import organization
- Tailwind CSS optimalisatie

## Configuratie

### ESLint Configuratie

De ESLint configuratie is geoptimaliseerd voor het Auto-Fix System. Je kunt de configuratie aanpassen in `.eslintrc.json`.

### Prettier Configuratie

De Prettier configuratie is geoptimaliseerd voor het Auto-Fix System. Je kunt de configuratie aanpassen in `.prettierrc.js`.

### VS Code Configuratie

De VS Code configuratie is geoptimaliseerd voor het Auto-Fix System. Je kunt de configuratie aanpassen in `.vscode/settings.json`.

### Git Hooks Configuratie

De Git hooks configuratie is geoptimaliseerd voor het Auto-Fix System. Je kunt de configuratie aanpassen in `package.json` onder de `lint-staged` en `husky` secties.

## CI/CD Integratie

Het Auto-Fix System is geïntegreerd in de GitHub Actions workflow. Bij elke push en pull request worden automatisch fixes toegepast en een rapport gegenereerd.

De workflow bestaat uit twee jobs:

1. **auto-fix**: Detecteert en lost code quality issues op
2. **quality-gate**: Controleert of er nog kritieke issues zijn

Als er issues zijn die niet automatisch opgelost kunnen worden, wordt er een issue aangemaakt in de repository.

## Best Practices

### 1. Run de Auto-Fix System regelmatig

Run `npm run autofix:now` regelmatig om code quality issues op te lossen voordat ze zich opstapelen.

### 2. Gebruik de Real-time Fixer tijdens ontwikkeling

Run `npm run autofix:watch` tijdens ontwikkeling om issues direct op te lossen zodra ze ontstaan.

### 3. Commit na Auto-Fix

Commit je wijzigingen na het runnen van het Auto-Fix System om de fixes te behouden.

### 4. Review de fixes

Review de fixes die het Auto-Fix System heeft toegepast om te begrijpen welke issues er waren en hoe ze zijn opgelost.

### 5. Gebruik de VS Code integratie

Gebruik de VS Code integratie voor auto-fixes tijdens ontwikkeling. Dit zorgt ervoor dat je code altijd voldoet aan de code quality standaarden.

### 6. Voeg nieuwe regels toe aan het Auto-Fix System

Als je nieuwe regels wilt toevoegen aan het Auto-Fix System, kun je deze toevoegen aan de `autoFixRules` in `scripts/auto-fix-system.js`.

### 7. Integreer met je eigen CI/CD pipeline

Integreer het Auto-Fix System in je eigen CI/CD pipeline om automatisch fixes toe te passen bij elke push en pull request.
