import js from '@eslint/js';
import security from 'eslint-plugin-security';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Regras de segurança (SAST no lint): detectam padrões como eval, regex inseguras,
  // child_process com entrada dinâmica, acesso a arquivos por caminho não literal etc.
  security.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: { 'security/detect-child-process': 'off' },
  },
);
