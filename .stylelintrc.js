module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-prettier',
  ],
  rules: {
    // Tailwind CSS specifieke regels
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
          'layer',
        ],
      },
    ],
    // CSS variabelen toestaan
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
    'declaration-block-trailing-semicolon': null,
    'no-descending-specificity': null,
    // Disable rules that are causing issues
    'selector-class-pattern': null,
    'declaration-block-single-line-max-declarations': null,
    'font-family-no-missing-generic-family-keyword': null,
    'block-no-empty': null,
    'no-duplicate-selectors': null,
    // Disable formatting rules that should be handled by Prettier
    'indentation': null,
    'color-hex-case': null,
    'string-quotes': null,
    'number-leading-zero': null,
    'number-no-trailing-zeros': null,
    'property-case': null,
    'unit-case': null,
    'value-list-comma-space-after': null,
    'value-list-comma-space-before': null,
    'value-list-comma-newline-after': null,
    'value-list-comma-newline-before': null,
    'function-comma-space-after': null,
    'function-comma-space-before': null,
    'function-comma-newline-after': null,
    'function-comma-newline-before': null,
    'function-parentheses-newline-inside': null,
    'function-parentheses-space-inside': null,
    'function-max-empty-lines': null,
    'max-empty-lines': null,
    'max-line-length': null,
    'no-empty-first-line': null,
    'no-eol-whitespace': null,
    'no-extra-semicolons': null,
    'no-missing-end-of-source-newline': null,
  },
  // Ignore coverage report CSS files
  ignoreFiles: ['coverage/**/*.css'],
};
