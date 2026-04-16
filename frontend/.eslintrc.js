module.exports = {
  plugins: ['react-hooks'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error'
  }
};
