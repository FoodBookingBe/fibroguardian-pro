module.exports = {
  root: true, // Belangrijk voor monorepo's of projecten met geneste .eslintrc bestanden
  parser: '@typescript-eslint/parser',
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended',
    'plugin:tailwindcss/recommended', // Tailwind CSS specifieke regels
    'prettier', // Integreert Prettier, moet als laatste in extends array
  ],
  plugins: [
    '@typescript-eslint',
    'import',
    'jsx-a11y',
    'react-hooks',
    'unused-imports',
    'tailwindcss', // Plugin voor tailwindcss/recommended
  ],
  rules: {
    // Architectuur-specifieke regels
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn', // Waarschuwt als dependencies in useEffect/useCallback etc. missen
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }], // Sta meer console types toe in dev
    '@typescript-eslint/explicit-module-boundary-types': 'warn', // Moedigt expliciete return types aan
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Waarschuw voor ongebruikte vars, negeer _
    'import/order': [
      'error',
      {
        groups: [
          'builtin', // Node.js built-in modules
          'external', // Packages van npm
          'internal', // Modules opgelost via tsconfig.json paths (@/...)
          ['parent', 'sibling', 'index'], // Relatieve imports
          'type', // Type imports (import type { ... } from '...')
          'object', // Object imports (import * as ... from '...') - minder gebruikelijk
        ],
        pathGroups: [ // Custom groepering voor @/ paden
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
          },
        ],
        pathGroupsExcludedImportTypes: ['react', 'type'],
        'newlines-between': 'always', // Zorgt voor witregels tussen groepen
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'unused-imports/no-unused-imports': 'error', // Verwijdert ongebruikte imports automatisch (met --fix)
    
    // JSX-A11y regels (deels al gedekt door plugin:jsx-a11y/recommended)
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error', // Extra check
    'jsx-a11y/label-has-associated-control': [ // Zorgt dat labels correct gekoppeld zijn
      'error',
      {
        assert: 'either', // ofwel genest, ofwel met htmlFor
      },
    ],

    // Patronen-specifieke regels
    'react/prop-types': 'off', // TypeScript handelt dit af
    'react/jsx-props-no-spreading': 'off', // Toegestaan, maar wees bewust
    'react/react-in-jsx-scope': 'off', // Niet nodig met Next.js 17+
    
    // Tailwind-specifieke regels
    'tailwindcss/no-custom-classname': 'warn', // Waarschuwt voor custom classnames die niet door Tailwind worden herkend
    'tailwindcss/classnames-order': 'warn', // Stelt een consistente volgorde voor Tailwind classes voor (vereist Prettier plugin)

    // Overige
    '@typescript-eslint/no-explicit-any': 'warn', // Moedig aan om 'any' te vermijden, maar 'warn' voor flexibiliteit
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true, // Belangrijk voor correcte resolutie van type-only imports
        project: './tsconfig.json', // Geef pad naar tsconfig
      },
    },
    react: {
      version: 'detect', // Detecteert automatisch de React versie
    },
    'jsx-a11y': { // Custom component mapping voor a11y checks
      components: {
        Button: 'button',
        IconButton: 'button',
        Link: 'a', // Als je een custom Link component hebt die een <a> rendert
      },
    },
  },
  overrides: [
    {
      files: ['**/components/**/*.tsx', '!**/components/**/*Container.tsx', '!**/components/**/presentational/*.tsx'], // Pas paden aan indien nodig
      rules: {
        // Regels specifiek voor Presentational Components
        '@typescript-eslint/no-explicit-any': 'error', // Strenger voor presentational
        'no-restricted-imports': [
          'error',
          {
            name: '@/hooks/useSupabaseQuery',
            message: 'Data fetching hooks (useSupabaseQuery/*) mogen niet in presentational components.',
          },
          {
            name: '@/hooks/useMutations',
            message: 'Mutation hooks (useMutations/*) mogen niet in presentational components.',
          },
          {
            name: '@/lib/supabase',
            message: 'Directe Supabase client calls mogen niet in presentational components.',
          },
           {
            name: 'next/router', // Gebruik next/navigation voor App Router
            message: "Gebruik 'next/navigation' (useRouter, usePathname, useSearchParams) in plaats van 'next/router'.",
          },
        ],
      },
    },
    {
      files: ['**/containers/**/*.tsx', '**/components/**/*Container.tsx', '**/app/**/*.tsx'], // Geldt voor containers en page/layout componenten
      rules: {
        // Regels specifiek voor Container Components en pagina's
        'no-restricted-imports': 'off', // Toegestaan om hooks en supabase client te gebruiken
      },
    },
    { // Configuratie voor testbestanden
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
        node: true, // Voor Node.js globals in test setup bestanden
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Meer flexibiliteit in tests
      }
    }
  ],
};
