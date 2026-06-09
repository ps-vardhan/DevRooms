import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
<<<<<<< HEAD
  globalIgnores(['dist', 'node_modules']),
  // Backend configuration (Node.js)
  {
    files: ['backend/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^err$|^_' }],
    }
  },
  // Frontend configuration (React / Browser)
  {
    files: ['src/**/*.{js,jsx}'],
=======
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
>>>>>>> a9858fce53e89caf6bc22def26bb1f0522c6343f
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
<<<<<<< HEAD
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }]
    }
=======
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
>>>>>>> a9858fce53e89caf6bc22def26bb1f0522c6343f
  },
])
