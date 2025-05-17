module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100, // Iets breder dan de default 80 voor moderne schermen
  tabWidth: 2,
  endOfLine: 'lf', // Consistent line endings
  arrowParens: 'avoid', // x => x in plaats van (x) => x
  bracketSpacing: true, // { foo: bar } in plaats van {foo:bar}
  jsxSingleQuote: false, // Gebruik dubbele quotes in JSX voor consistentie met HTML
  // overrides zijn nuttig voor specifieke bestandstypes, maar niet strikt nodig voor basis setup
  overrides: [
    {
      files: '*.{json,yaml,yml,md}', // Markdown ook meenemen
      options: {
        tabWidth: 2,
      },
    },
    {
      files: '*.css', // Voor CSS bestanden, als je die direct bewerkt
      options: {
        singleQuote: false, // Standaard voor CSS
      }
    }
  ],
};
