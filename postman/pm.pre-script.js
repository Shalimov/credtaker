function requestTokens() {
  pm.sendRequest('http://localhost:1991/api/cred/tokens', (err, result) => {
      if (err) {
          throw new Error('Can not grab tokens from token server');
      }

      const { accessToken, idToken } = result.json();
      
      // set global variables
      pm.globals.set('accessToken', accessToken);
      pm.globals.set('idToken', idToken);
  });
}

function needToUpdateExistingTokens() {
  const accessToken = pm.globals.get('accessToken');
  
  if (!accessToken) {
      return true;
  }

  const [, payloadStr] = accessToken.split('.');
  const tokenExpDate = JSON.parse(atob(payloadStr)).exp    
  
  return Date.now() > tokenExpDate * 1000;
}

pm.sendRequest('http://localhost:1991/api/cred/tokens/almost-stale', (err, result) => {
  if (err) {
      throw new Error('Can not deal with token server');
  }

  const { needUpdate, expIn } = result.json();

  console.info('Tokens expire in:', expIn);

  if (needUpdate || needToUpdateExistingTokens()) {
      requestTokens();
  }
});