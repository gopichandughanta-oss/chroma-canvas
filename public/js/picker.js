// ===== Color conversions =====
function hsvToRgb(h, s, v) {
  h = (h % 360 + 360) % 360;
  var c = v * s;
  var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  var m = v - c;
  var r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(function (n) {
    return n.toString(16).padStart(2, "0");
  }).join("");
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  var c = (1 - Math.abs(2 * l - 1)) * s;
  var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  var m = l - c / 2;
  var r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return rgbToHex(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
}

function relLuminance(r, g, b) {
  var a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

// ===== State =====
var state = { h: 11, s: 1, v: 1 }; // default -> #ff5d3b

// ===== Elements =====
var sv = document.getElementById("sv");
var svBg = document.getElementById("svBg");
var svCursor = document.getElementById("svCursor");
var hue = document.getElementById("hue");
var hueCursor = document.getElementById("hueCursor");
var preview = document.getElementById("preview");
var hexVal = document.getElementById("hexVal");
var rgbVal = document.getElementById("rgbVal");
var hslVal = document.getElementById("hslVal");
var toast = document.getElementById("toast");

function render() {
  var rgb = hsvToRgb(state.h, state.s, state.v);
  var hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
  var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

  // sv background: pure hue at top-left, white top-right, black bottom
  svBg.style.background =
    "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(" + state.h + ",100%,50%))";

  // cursors
  svCursor.style.left = (state.s * 100) + "%";
  svCursor.style.top = ((1 - state.v) * 100) + "%";
  hueCursor.style.left = (state.h / 360 * 100) + "%";
  hueCursor.style.background = hex;

  preview.style.background = hex;
  preview.textContent = hex;

  hexVal.textContent = hex;
  rgbVal.textContent = "rgb(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ")";
  hslVal.textContent = "hsl(" + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%)";

  renderHarmonies(state.h, state.s, state.v);
}

function renderHarmonies(h, s, v) {
  // Convert harmonies to HSL-ish via hue rotation; keep s/l consistent-ish using hslToHex
  var rgb = hsvToRgb(h, s, v);
  var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  var H = hsl[0], S = hsl[1], L = hsl[2];

  function swatches(degrees) {
    return degrees.map(function (d) {
      var nh = (H + d + 360) % 360;
      return hslToHex(nh, S, L);
    });
  }

  fillSwatches("harmonyComp", swatches([0, 180]));
  fillSwatches("harmonyAna", swatches([-30, 0, 30]));
  fillSwatches("harmonyTri", swatches([0, 120, 240]));
}

function fillSwatches(id, colors) {
  var el = document.getElementById(id);
  el.innerHTML = "";
  colors.forEach(function (c) {
    var div = document.createElement("div");
    div.className = "sw";
    div.style.background = c;
    div.textContent = c;
    div.addEventListener("click", function () {
      copyText(c);
      showToast(c + " copied");
    });
    el.appendChild(div);
  });
}

// ===== Pointer interaction =====
function point(el, e) {
  var rect = el.getBoundingClientRect();
  var x = (e.clientX - rect.left) / rect.width;
  var y = (e.clientY - rect.top) / rect.height;
  return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
}

function bindDrag(el, onMove) {
  var dragging = false;
  function start(e) {
    dragging = true;
    e.preventDefault();
    move(e);
  }
  function move(e) {
    if (!dragging) return;
    onMove(point(el, e));
  }
  function end() { dragging = false; }
  el.addEventListener("pointerdown", start);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
}

bindDrag(sv, function (p) {
  state.s = p.x;
  state.v = 1 - p.y;
  render();
});

bindDrag(hue, function (p) {
  state.h = p.x * 360;
  render();
});

// ===== Copy =====
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  var ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
}

document.querySelectorAll(".copy-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var kind = btn.getAttribute("data-copy");
    var text = "";
    if (kind === "hex") text = hexVal.textContent;
    if (kind === "rgb") text = rgbVal.textContent;
    if (kind === "hsl") text = hslVal.textContent;
    copyText(text);
    var orig = btn.textContent;
    btn.textContent = "Copied";
    btn.classList.add("copied");
    showToast(text + " copied");
    setTimeout(function () { btn.textContent = orig; btn.classList.remove("copied"); }, 1200);
  });
});

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(function () { toast.classList.remove("show"); }, 1400);
}

render();
