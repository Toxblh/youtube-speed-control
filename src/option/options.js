var defaultStorage = {
  speedStep: 0.25,
  slowerKeyCode: "109,189,173",
  fasterKeyCode: "107,187,61",
  resetKeyCode: "106",
  displayOption: "FadeInFadeOut",
  allowMouseWheel: true,
  mouseInvert: false,
  rememberSpeed: false
};

function keyPressHandler(event) {
  var kCode = String.fromCharCode(event.keyCode);
  if (!/[\d\.]$/.test(kCode) || !/^\d+(\.\d*)?$/.test(event.target.value + kCode)) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function onSave() {
  var displayValue;
  var speedStep = document.getElementById("speedStep").value;
  var slowerKeyInput = document.getElementById("slowerKeyInput").value;
  var fasterKeyInput = document.getElementById("fasterKeyInput").value;
  var resetKeyInput = document.getElementById("resetKeyInput").value;
  var allowMouseWheel = document.getElementById("allowMouseWheel").checked;
  var mouseInvert = document.getElementById("mouseInvert").checked;
  var rememberSpeed = document.getElementById("rememberSpeed").checked;
  var displayOption = document.getElementsByName("displayOption");

  for (var i = 0, length = displayOption.length; i < length; i++) {
    if (displayOption[i].checked) {
      displayValue = displayOption[i].value;
      break;
    }
  }

  speedStep = isNaN(speedStep) ? defaultStorage.speedStep : Number(speedStep);

  browser.storage.sync
    .set({
      speedStep: speedStep,
      slowerKeyCode: slowerKeyInput,
      fasterKeyCode: fasterKeyInput,
      resetKeyCode: resetKeyInput,
      displayOption: displayValue,
      mouseInvert: mouseInvert,
      allowMouseWheel: allowMouseWheel,
      rememberSpeed: rememberSpeed
    })
    .then(function() {
      var statusElem = document.getElementById("status");
      statusElem.textContent = "Options saved";
      setTimeout(function() {
        statusElem.textContent = "";
      }, 1000);
    });
}

function loadFromStorage() {
  browser.storage.sync.get(defaultStorage).then(function(store) {
    document.getElementById("speedStep").value = store.speedStep.toFixed(2);
    document.getElementById("slowerKeyInput").value = store.slowerKeyCode;
    document.getElementById("fasterKeyInput").value = store.fasterKeyCode;
    document.getElementById("resetKeyInput").value = store.resetKeyCode;
    document.getElementById(store.displayOption).checked = true;
    document.getElementById("allowMouseWheel").checked = store.allowMouseWheel;
    document.getElementById("mouseInvert").checked = store.mouseInvert;
    document.getElementById("rememberSpeed").checked = store.rememberSpeed;
  });
}

function resetStorage() {
  browser.storage.sync.set(defaultStorage).then(function() {
    loadFromStorage();
    var statusElem = document.getElementById("status");
    statusElem.textContent = "Default options restored";

    setTimeout(function() {
      statusElem.textContent = "";
    }, 1000);
  });
}

document.addEventListener("DOMContentLoaded", function() {
  loadFromStorage();
  document.getElementById("save").addEventListener("click", onSave);
  document.getElementById("restore").addEventListener("click", resetStorage);
  document.getElementById("speedStep").addEventListener("keypress", keyPressHandler);
});

$(document).ready(function() {
  var o = $("#fasterKeyInput");
  var p = $("#slowerKeyInput");
  var q = $("#resetKeyInput");

  $.getJSON("keycodedict.json", function(keyDict) {
    o.html("");
    p.html("");
    q.html("");
    $.each(keyDict.keycodedict, function(index, element) {
      o.append(new Option(element.input, element.keycode));
      p.append(new Option(element.input, element.keycode));
      q.append(new Option(element.input, element.keycode));
    });
  });
});
