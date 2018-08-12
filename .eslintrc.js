module.exports = {
  root: true,
  "extends": "eslint-config-egg",
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module"
  },
  "rules": {
    "linebreak-style":"off",
    "newline-per-chained-call":"off"
  },
  "env": {
    "node": true,
    "es6": true
  },
  "globals": {
    "PROD": true,
  },
  "parser": "babel-eslint"
}

