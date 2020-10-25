const Router = require("@koa/router");

const credRoutes = new Router();

credRoutes.get("/api/cred/tokens", async (ctx) => {
  const { credService } = ctx.services;
  const tokens = await credService.getTokens();

  ctx.body = tokens;
});

credRoutes.get("/api/cred/tokens/almost-stale", async (ctx) => {
  const { credService } = ctx.services;
  const needUpdateInfo = await credService.needUpdateTokens();

  ctx.body = needUpdateInfo;
});

module.exports = {
  credRoutes,
};
