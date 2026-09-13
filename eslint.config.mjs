import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.config.mjs',
      '**/generated/**'
    ],
  },

  eslint.configs.recommended,
  {
    // 1. Tell ESLint to target ALL TypeScript files in your workspace
    files: ['services/**/*.ts', 'shared/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest, // Useful if your teammates write tests
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-unused-vars': 'off',
      // Custom rules your team wants to enforce
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off', // Turn off if you're okay with 'any' during development
      'no-console': 'off',
    },
  },
  // 2. This turns off style rules that conflict with Prettier
  prettierConfig,
];