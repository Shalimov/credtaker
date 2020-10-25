# Workaround solution for Postman to deal with and refresh Oauth2/OpenId tokens

### Problem: https://github.com/postmanlabs/postman-app-support/issues/8231

This server is exposing 2 endpoints:
- http://localhost:1991/api/cred/tokens -> To get id and access tokens
- http://localhost:1991/api/cred/tokens/almost-stale -> To get info whether you need to update tokens (+ exp time)

But this endpoints are not a whole solution
You need to use Postman pre-request script to complete it (Project is working for specific env and gonna be modified and extended to complete more cases in FUTURE);

Requirements: 
- Puppeteer (Chromium is gonna be downloaded automagically)
- `.env` file with:
```
APP_EMAIL=(for signin form)
APP_PASS=(for signin form)
TARGET_ADDRESS=(site where tokens are stored in local storage as accessToken and idToken)
```

Getting started:
- npm install
- npm start
- Copy and paste pre-request script in postman corresponding section (./postman/pm.pre-script.js)
- Enjoy

Caveates:
- Error handling leaves much to be desired and gonna be improved but after some time (thanks)

TODO:
- Use puppeteer-core instead of puppeteer;
