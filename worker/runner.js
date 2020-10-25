const { parentPort, isMainThread, workerData } = require("worker_threads");

const { GET_TOKENS, NEED_TOKENS_UPDATE } = require("../events/names");

const { CredWorker } = require("./cred.worker");

if (isMainThread) {
  throw new Error("Only worker has permissions to run it");
}

const credWorker = new CredWorker(
  workerData.email,
  workerData.password,
  workerData.targetAddress
);

parentPort.on("message", ({ request }) => {
  switch (request) {
    case NEED_TOKENS_UPDATE:
      return parentPort.postMessage({
        response: NEED_TOKENS_UPDATE,
        data: credWorker.needToUpdateSoon(),
      });
    case GET_TOKENS:
      return parentPort.postMessage({
        response: GET_TOKENS,
        data: credWorker.getTokensInfo(),
      });
    default:
      throw new Error(`Unrecognised Request ${request}`);
  }
});

credWorker.once("error", (error) => {
  parentPort.postMessage("error", error);
});

credWorker.run();
