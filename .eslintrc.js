module.exports = {
  extends: ['wesbos'],
  rules: {
    'no-plusplus': 0,

    'prettier/prettier': [
      'error',
      {
        arrowParens: 'avoid',
      },
    ],
  },
};
