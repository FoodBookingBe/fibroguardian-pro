# FibroGuardian Scripts

Deze map bevat scripts voor het ontwikkelen, testen en optimaliseren van de FibroGuardian applicatie.

## Beschikbare Scripts

### Bundle Analyse

De volgende scripts helpen bij het analyseren van de bundlegrootte en het identificeren van optimalisatiemogelijkheden:

- **analyze-bundle.js**: Hoofdscript voor bundleanalyse
- **analyze-bundle.bat**: Windows batchbestand om het analyse script uit te voeren
- **analyze-bundle.sh**: Unix/Linux shell script om het analyse script uit te voeren

#### Gebruik

Windows:
```
.\scripts\analyze-bundle.bat
```

Unix/Linux/macOS:
```
chmod +x ./scripts/analyze-bundle.sh
./scripts/analyze-bundle.sh
```

Of direct met Node.js:
```
node scripts/analyze-bundle.js
```

#### Wat doet het?

Het bundle analyse script voert de volgende analyses uit:

1. **Bundlegrootte analyse**: Genereert een visueel rapport van de bundlegrootte met behulp van Next.js Bundle Analyzer
2. **Ongebruikte dependencies**: Identificeert dependencies die niet worden gebruikt in het project
3. **Grote dependencies**: Identificeert grote dependencies die de bundlegrootte significant beïnvloeden
4. **Dubbele packages**: Identificeert dubbele packages in node_modules

Na de analyse genereert het script aanbevelingen voor optimalisatie.

### Andere Scripts

- **find-dead-code.js**: Identificeert ongebruikte code in het project
- **generate-jsdoc.js**: Genereert documentatie op basis van JSDoc commentaar
- **generate-refactoring-inventory.js**: Genereert een inventaris van refactoring mogelijkheden
- **generate-test-templates.js**: Genereert testsjablonen voor componenten
- **load-testing.js**: Voert load tests uit op de applicatie
- **optimize-images.js**: Optimaliseert afbeeldingen voor betere performance

## Toevoegen van Nieuwe Scripts

Bij het toevoegen van nieuwe scripts, volg deze richtlijnen:

1. Voeg duidelijke documentatie toe aan het begin van het script
2. Voeg een beschrijving toe aan dit README.md bestand
3. Maak indien nodig bijbehorende .bat en .sh bestanden voor cross-platform ondersteuning
4. Voeg een npm script toe aan package.json indien het script regelmatig gebruikt zal worden

## Best Practices

- Zorg ervoor dat scripts cross-platform compatibel zijn waar mogelijk
- Gebruik duidelijke foutmeldingen en logging
- Voeg een help optie toe aan complexe scripts
- Documenteer de vereiste dependencies en installatie-instructies
