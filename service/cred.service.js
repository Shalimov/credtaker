const { GET_TOKENS, NEED_TOKENS_UPDATE } = require("../events/names");

class CredService {
  constructor(worker) {
    this.worker = worker;
    this.defererPool = new Map();

    this._listen();
  }

  _listen() {
    const avOperations = [GET_TOKENS, NEED_TOKENS_UPDATE];

    this.worker.on("message", ({ response, data }) => {
      if (!avOperations.includes(response)) {
        console.warn(`CredService get strange response ${response}`);
        // throw new Error(`CredService get strange response ${response}`);
      }

      const deferer = this.defererPool.get(response);

      if (deferer) {
        this.defererPool.delete(response);
        deferer.resolve(data);
      }
    });
  }

  _addOperation(id) {
    this.worker.postMessage({ request: id });

    const deferer = this._createDeferer(id);

    this.defererPool.set(id, deferer);

    return deferer.promise;
  }

  _createDeferer(id) {
    const defer = { promise: null, resolve: null, reject: null, stale: false };

    defer.promise = new Promise((resolve, reject) => {
      const defererRejectTimeout = setTimeout(() => {
        reject(new Error(`Deferer timeout ${id}`));
        this.stale = true;
      }, 10000);

      defer.resolve = (data) => {
        if (defer.stale) {
          return;
        }

        this.stale = true;
        clearTimeout(defererRejectTimeout);

        resolve(data);
      };

      defer.reject = (err) => {
        if (defer.stale) {
          return;
        }

        this.stale = true;
        clearTimeout(defererRejectTimeout);

        reject(err);
      };
    });

    return defer;
  }

  async getTokens() {
    const tokens = await this._addOperation(GET_TOKENS);

    return {
      accessToken: tokens.authTokenInfo.token,
      idToken: tokens.idTokenInfo.token,
    };
  }

  needUpdateTokens() {
    return this._addOperation(NEED_TOKENS_UPDATE);
  }
}

module.exports = {
  CredService,
};
