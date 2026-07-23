// Root ESLint config (flat config format, ESLint 9+).
// Individual apps/services may extend this with framework-specific rules
// (e.g. Next.js, NestJS) once they are scaffolded.
module.exports = [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },
];
