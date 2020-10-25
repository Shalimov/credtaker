const { Worker } = require("worker_threads");

module.exports = {
  createWorker() {
    return new Worker("./worker/runner.js", {
      workerData: {
        email: process.env.APP_EMAIL,
        password: process.env.APP_PASS,
        targetAddress: process.env.TARGET_ADDRESS,
      },
    });
  },
};
