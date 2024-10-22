let isPlaying = false;
let timeoutDelay = 50 - parseInt(document.querySelector("#speed").value);
let scrollTimeout;

// Initialize the Web Worker
let scrollWorker = new Worker("/static/js/scrollWorker.js");

scrollWorker.onmessage = function (e) {
  if (e.data === "scroll") {
    handleScroll();
  }
};

// Get options from localStorage if user already visited site
fetchOptions();

// Disable Rich Text Formatting pasting
document.querySelector(".content").addEventListener("paste", function (e) {
  e.preventDefault();
  const text = (e.originalEvent || e).clipboardData.getData("text/plain");
  document.execCommand("insertHTML", false, text);
});

function getCssVariable(name) {
  let rootStyle = getComputedStyle(document.querySelector(":root"));
  return rootStyle.getPropertyValue("--" + name).trim();
}
function setCssVariable(name, value) {
  document.querySelector(":root").style.setProperty("--" + name, value);
}

document.querySelector("#play-pause").addEventListener("click", handlePlayPause);

function handlePlayPause() {
  if (isPlaying) {
    pause();
  } else {
    play();
  }
}

document.querySelector("#align").addEventListener("click", function (e) {
  if (getCssVariable("align") == "left") {
    setCssVariable("align", "center");
    document.querySelector("#left").style.setProperty("display", "block");
    document.querySelector("#center").style.setProperty("display", "none");
  } else {
    setCssVariable("align", "left");
    document.querySelector("#left").style.setProperty("display", "none");
    document.querySelector("#center").style.setProperty("display", "block");
  }
  saveChanges();
});

document.querySelector("#flipx").addEventListener("click", function (e) {
  toggleFlipx();
  saveChanges();
});

function toggleFlipx() {
  document.querySelector(".content").classList.toggle("flipx");
  document.querySelector("#flipx svg").classList.toggle("flipx");
  document.querySelector("#triangle").classList.toggle("shiftx");
}

document.querySelector("#flipy").addEventListener("click", function (e) {
  toggleFlipy();
  saveChanges();
});

function toggleFlipy() {
  document.querySelector(".content").classList.toggle("flipy");
  document.querySelector("#flipy svg").classList.toggle("flipy");
  document.querySelector("#triangle").classList.toggle("shifty");

  var currentScrollTop = window.scrollY;
  var totalScrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  var currentScrollPercentage = (currentScrollTop / totalScrollableHeight) * 100;
  var invertedScrollPercentage = 100 - currentScrollPercentage;
  var newScrollTop = (invertedScrollPercentage / 100) * totalScrollableHeight;

  window.scrollTo({
    top: newScrollTop,
    behavior: "smooth",
  });
}

document.querySelector("#expand").addEventListener("click", function (e) {
  document.querySelector("nav").classList.toggle("expanded");
  document.querySelector("body").classList.toggle("noscroll");
});

document.querySelector("#bg-color").addEventListener("input", function (e) {
  setCssVariable("bg-color", e.target.value);
  saveChanges();
});

document.querySelector("#text-color").addEventListener("input", function (e) {
  setCssVariable("text-color", e.target.value);
  saveChanges();
});

document.querySelector("#text-size").addEventListener("input", function (e) {
  setCssVariable("text-size", e.target.value + "px");
  document.querySelector("#text-size-display").textContent = e.target.value;
  saveChanges();
});

document.querySelector("#margin").addEventListener("input", function (e) {
  setCssVariable("margin", e.target.value + "%");
  document.querySelector("#margin-display").textContent = e.target.value;
  saveChanges();
});

document.querySelector("#speed").addEventListener("input", handleSpeedChange);

function handleSpeedChange() {
  const speedInput = document.querySelector("#speed");
  timeoutDelay = 40 - parseInt(speedInput.value);
  document.querySelector("#speed-display").textContent = speedInput.value;

  // Update worker with new timeoutDelay
  scrollWorker.postMessage({ command: "updateDelay", delay: timeoutDelay });

  saveChanges();
}

document.querySelector("#font-select").addEventListener("change", handleFontChange);
function handleFontChange() {
  const fontSelect = document.querySelector("#font-select");
  const value = fontSelect.options[fontSelect.selectedIndex].value;
  setCssVariable("font-family", value);
  saveChanges();
}

window.addEventListener("keydown", function (e) {
  if (document.activeElement == document.querySelector(".content")) {
    return;
  }
  e.preventDefault();
  switch (e.code) {
    case "Space":
      handlePlayPause();
      break;
    case "ArrowDown":
      document.querySelector("#speed").value = parseInt(document.querySelector("#speed").value) - 1;
      handleSpeedChange();
      break;
    case "ArrowUp":
      document.querySelector("#speed").value = parseInt(document.querySelector("#speed").value) + 1;
      handleSpeedChange();
      break;
  }
});

document.querySelector(".content").addEventListener("keyup", saveChanges);

function handleScroll() {
  const contentEl = document.querySelector(".content");
  if (contentEl.classList.contains("flipy")) {
    window.scrollBy(0, -1);

    if (window.scrollY == 0) {
      pause();
      window.scrollTo({
        top: document.body.scrollHeight - window.innerHeight,
        left: 0,
        behavior: "smooth",
      });
    }
  } else {
    window.scrollBy(0, 1);

    if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
      pause();
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  }
}

function play() {
  document.querySelector("#play").style.setProperty("display", "none");
  document.querySelector("#pause").style.setProperty("display", "block");

  document.querySelector(".content").setAttribute("contenteditable", false);
  document.querySelector("#triangle").style.setProperty("display", "block");
  document.querySelector("body").classList.add("playing");
  isPlaying = true;

  // Start worker with current timeoutDelay
  scrollWorker.postMessage({ command: "start", delay: timeoutDelay });
}

function pause() {
  document.querySelector("#play").style.setProperty("display", "block");
  document.querySelector("#pause").style.setProperty("display", "none");

  // Stop worker
  scrollWorker.postMessage({ command: "stop" });

  document.querySelector(".content").setAttribute("contenteditable", true);
  document.querySelector("#triangle").style.setProperty("display", "none");
  document.querySelector("body").classList.remove("playing");
  isPlaying = false;
}

function saveChanges() {
  const recorderInput = document.getElementById("record-content");
  if (recorderInput) {
    recorderInput.value = document.querySelector(".content").innerHTML;
  }
  localStorage.setItem("content", document.querySelector(".content").innerHTML);
  localStorage.setItem("align", getCssVariable("align"));
  localStorage.setItem("flipx", document.querySelector(".content").classList.contains("flipx"));
  localStorage.setItem("flipy", document.querySelector(".content").classList.contains("flipy"));
  localStorage.setItem("bg-color", getCssVariable("bg-color"));
  localStorage.setItem("text-color", getCssVariable("text-color"));
  localStorage.setItem("text-size", getCssVariable("text-size"));
  localStorage.setItem("margin", getCssVariable("margin"));
  localStorage.setItem("speed", parseInt(document.querySelector("#speed").value));
  const fontSelect = document.querySelector("#font-select");
  localStorage.setItem("font", fontSelect.options[fontSelect.selectedIndex].value);
}
saveChanges();

function fetchOptions() {
  const content = localStorage.getItem("content");
  if (content) {
    //document.querySelector(".content").innerHTML = content;

    if (localStorage.getItem("align") == "left") {
      document.querySelector("#left").style.setProperty("display", "none");
      document.querySelector("#center").style.setProperty("display", "block");
    } else {
      document.querySelector("#left").style.setProperty("display", "block");
      document.querySelector("#center").style.setProperty("display", "none");
    }
    setCssVariable("align", localStorage.getItem("align"));

    if (localStorage.getItem("flipx") == "true") {
      toggleFlipx();
    }

    if (localStorage.getItem("flipy") == "true") {
      toggleFlipy();
    }

    setCssVariable("bg-color", localStorage.getItem("bg-color"));
    document.querySelector("#bg-color").value = localStorage.getItem("bg-color");

    setCssVariable("text-color", localStorage.getItem("text-color"));
    document.querySelector("#text-color").value = localStorage.getItem("text-color");

    const textSize = localStorage.getItem("text-size");
    setCssVariable("text-size", textSize);
    const textSizeNum = parseInt(textSize.replace("px", ""));
    document.querySelector("#text-size").value = textSizeNum;
    document.querySelector("#text-size-display").textContent = textSizeNum;

    const margin = localStorage.getItem("margin");
    setCssVariable("margin", margin);
    const marginNum = parseInt(margin.replace("%", ""));
    document.querySelector("#margin").value = marginNum;
    document.querySelector("#margin-display").textContent = marginNum;

    const font = localStorage.getItem("font");
    setCssVariable("font-family", font);
    document.querySelector("#font-select").value = font;

    document.querySelector("#speed").value = parseInt(localStorage.getItem("speed"));  
    handleSpeedChange();
  }
}
