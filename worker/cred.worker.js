const ms = require("ms");
const puppeteer = require("puppeteer");
const jwt = require("jsonwebtoken");

const { EventEmitter } = require("events");

class CredWorker extends EventEmitter {
  constructor(email, password, oktaEntryPointUrl) {
    super();

    this.criticalInterval = 2 * 60 * 1000;

    this.email = email;
    this.password = password;
    this.oktaEntryPointUrl = oktaEntryPointUrl;
    this.inProgress = false;
    this.tokensInfo = {
      authTokenInfo: {
        token: null,
        exp: null,
      },
      idTokenInfo: {
        token: null,
        exp: null,
      },
    };
  }

  async grabTokens() {
    console.info("WORKER: TRYING TO TAKE TOKENS", Date.now());

    const browser = await puppeteer.launch();
    const okta = await browser.newPage();

    await okta.goto(this.oktaEntryPointUrl);

    const authRequired = await okta.evaluate(
      () => !location.href.includes(this.oktaEntryPointUrl)
    );

    if (authRequired) {
      await okta.type("#okta-signin-username", this.email);
      await okta.type("#okta-signin-password", this.password);

      await okta.click("#okta-signin-submit");
      await okta.waitForNavigation();

      await okta.goto(this.oktaEntryPointUrl);
    }

    const grabbedTokens = await okta.evaluate(() => ({
      accessToken: localStorage.getItem("accessToken"),
      idToken: localStorage.getItem("idToken"),
    }));

    if (!(grabbedTokens.idToken && grabbedTokens.accessToken)) {
      throw new Error("Tokens are not found");
    }

    const accessTokenExp = jwt.decode(grabbedTokens.accessToken, { json: true })
      .exp;
    const idTokenExp = jwt.decode(grabbedTokens.idToken, { json: true }).exp;

    Object.assign(this.tokensInfo.authTokenInfo, {
      token: grabbedTokens.accessToken,
      exp: accessTokenExp,
    });

    Object.assign(this.tokensInfo.idTokenInfo, {
      token: grabbedTokens.idToken,
      exp: idTokenExp,
    });

    console.info("WORKER: TOKENS TAKEN", Date.now());
    await browser.close();
  }

  calcNextRunTimeout() {
    const {
      authTokenInfo: { exp: aExp },
      idTokenInfo: { exp: iExp },
    } = this.tokensInfo;
    const safeExpPeriod = Math.min(aExp, iExp);

    const nextRun = safeExpPeriod * 1000 - Date.now() - this.criticalInterval;

    return nextRun;
  }

  async run() {
    try {
      this.emit("run");

      await this.grabTokens();
      setTimeout(() => this.run(), this.calcNextRunTimeout());
    } catch (error) {
      this.emit("error", error);
    }
  }

  needToUpdateSoon() {
    const {
      authTokenInfo: { exp: aExp },
      idTokenInfo: { exp: iExp },
    } = this.tokensInfo;
    const safeExpPeriod = Math.min(aExp, iExp);

    const expIn = safeExpPeriod * 1000 - Date.now();

    return {
      needUpdate: expIn < this.criticalInterval,
      expIn: ms(expIn),
    };
  }

  getTokensInfo() {
    return Object.freeze(this.tokensInfo);
  }
}

module.exports = {
  CredWorker,
};
