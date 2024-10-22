let interval;
let timeoutDelay = 50;

self.onmessage = function (e) {
  const { command, delay } = e.data;
  
  if (command === "start") {
    timeoutDelay = delay;
    startScrolling();
  } else if (command === "stop") {
    stopScrolling();
  } else if (command === "updateDelay") {
    timeoutDelay = delay;
    if (interval != null) {
        restartScrolling();
    }
  }
};

function startScrolling() {
  if (!interval) {
    interval = setInterval(() => {
      postMessage("scroll");
    }, timeoutDelay);
  }
}

function stopScrolling() {
  clearInterval(interval);
  interval = null;
}

function restartScrolling() {
  stopScrolling();
  startScrolling();
}
