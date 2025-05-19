# FibroGuardian Scripts

This directory contains utility scripts for development, testing, and optimization of the FibroGuardian application.

## Bundle Analysis Scripts

### For Windows Users

Run the bundle analyzer using:

```
scripts\analyze-bundle.bat
```

### For Unix/Linux/Mac Users

Make the script executable first:

```
chmod +x scripts/analyze-bundle.sh
```

Then run it:

```
./scripts/analyze-bundle.sh
```

### Using Node.js (Cross-platform)

```
node scripts/analyze-bundle.js
```

## What the Bundle Analyzer Does

The bundle analyzer generates visual reports of your JavaScript bundle composition. This helps you:

1. Identify large dependencies that could be optimized
2. Find opportunities for code splitting and lazy loading
3. Detect unused code that could be removed
4. Track bundle size changes over time

## Optimization Strategies

Based on the bundle analysis, consider these optimization techniques:

- **Replace large libraries** with smaller alternatives
- **Use dynamic imports** for code splitting: `import('module').then(module => ...)`
- **Lazy load components** that aren't needed immediately
- **Remove unused dependencies** and code
- **Configure webpack** to better tree-shake dependencies

## Other Scripts

- `find-dead-code.js`: Identifies unused code in the codebase
- `generate-test-templates.js`: Creates test templates for components
- `optimize-images.js`: Compresses and optimizes images
- `load-testing.js`: Performs load testing on the application

## Adding New Scripts

When adding new scripts to this directory:

1. Use the appropriate file extension (.js, .bat, .sh) based on the target platform
2. Include clear documentation at the top of the script
3. Update this README with information about the new script
4. Make shell scripts executable with `chmod +x` on Unix systems
