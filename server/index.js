const fs = require("fs");
const chalk = require("chalk");
const Koa = require("koa");
require("dotenv").config();

const { createWorker } = require("../worker");
const { CredService } = require("../service/cred.service");
const { credRoutes } = require("./controller");

const application = new Koa();

application.context.services = {
  credService: new CredService(createWorker()),
};

application.use(credRoutes.routes());

application.listen(1991, () => {
  console.info(
    chalk.yellow(`
      Token Service started on port ${chalk.green("http://localhost:1991")}
      Available Endpoints:
      // get id and access tokens
      ${chalk.green("http://localhost:1991/api/cred/tokens")}
      
      // Get info whether you need to update tokens (+ exp time)
      ${chalk.green("http://localhost:1991/api/cred/tokens/almost-stale")}

      ---- POSTMAN PRE-REQUEST SCRIPT HELPER ----
      ${chalk.green("./postman/pm.pre-script.js")}
    `)
  );
});
