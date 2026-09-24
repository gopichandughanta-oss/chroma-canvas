// ===== Palette generator =====
var strip = document.getElementById("strip");
var savedArea = document.getElementById("savedArea");
var genBtn = document.getElementById("genBtn");
var saveBtn = document.getElementById("saveBtn");
var toast = document.getElementById("toast");

var colors = []; // array of { hex, locked }
var saved = loadSaved();

function rand(n) { return Math.floor(Math.random() * n); }

function randomColor() {
  // varied hues + saturation/lightness for pleasing palettes
  var h = rand(360);
  var s = 55 + rand(45);
  var l = 40 + rand(35);
  return hslToHex(h, s, l);
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
  function toHex(n) { return Math.round((n + m) * 255).toString(16).padStart(2, "0"); }
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function relLuminance(hex) {
  var r = parseInt(hex.slice(1, 3), 16) / 255;
  var g = parseInt(hex.slice(3, 5), 16) / 255;
  var b = parseInt(hex.slice(5, 7), 16) / 255;
  function lin(v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function textColor(hex) {
  return relLuminance(hex) > 0.45 ? "#111" : "#fff";
}

function generate(keepLocked) {
  while (colors.length < 5) colors.push({ hex: randomColor(), locked: false });
  for (var i = 0; i < colors.length; i++) {
    if (keepLocked && colors[i].locked) continue;
    colors[i].hex = randomColor();
  }
  render();
}

function render() {
  strip.innerHTML = "";
  colors.forEach(function (c, i) {
    var el = document.createElement("div");
    el.className = "pcolor";
    el.style.background = c.hex;
    el.style.color = textColor(c.hex);
    el.innerHTML =
      '<div class="top-row">' +
        '<span class="hex">' + c.hex.toUpperCase() + '</span>' +
        '<button class="lock ' + (c.locked ? "on" : "") + '" data-i="' + i + '" title="Lock color">' +
          (c.locked
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 10V8a6 6 0 0 1 12 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h8V8a4 4 0 0 0-8 0v2z"/></svg>'
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 7-2.6"/></svg>') +
        '</button>' +
      '</div>';
    el.addEventListener("click", function (e) {
      if (e.target.classList.contains("lock")) return;
      copyText(c.hex.toUpperCase());
      showToast(c.hex.toUpperCase() + " copied");
    });
    strip.appendChild(el);
  });

  strip.querySelectorAll(".lock").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var i = parseInt(btn.getAttribute("data-i"), 10);
      colors[i].locked = !colors[i].locked;
      render();
    });
  });

  renderSaved();
}

// ===== Copy =====
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
  } else { fallbackCopy(text); }
}
function fallbackCopy(text) {
  var ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(function () { toast.classList.remove("show"); }, 1400);
}

// ===== Saved palettes (localStorage) =====
function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem("chroma_saved") || "[]");
  } catch (e) { return []; }
}
function persistSaved() {
  try { localStorage.setItem("chroma_saved", JSON.stringify(saved)); } catch (e) {}
}

function renderSaved() {
  if (!saved.length) {
    savedArea.innerHTML = '<div class="empty-saved">No saved palettes yet. Generate one you love and hit “Save palette”.</div>';
    return;
  }
  savedArea.innerHTML = '<div class="saved-grid" id="savedGrid"></div>';
  var grid = document.getElementById("savedGrid");
  saved.forEach(function (pal, idx) {
    var card = document.createElement("div");
    card.className = "saved-card";
    var bars = pal.map(function (c) {
      return '<div style="background:' + c + '"></div>';
    }).join("");
    card.innerHTML =
      '<div class="bars">' + bars + '</div>' +
      '<div class="meta">' +
        '<button data-idx="' + idx + '" data-act="load">Load</button>' +
        '<button data-idx="' + idx + '" data-act="del">Delete</button>' +
      '</div>';
    grid.appendChild(card);
  });

  grid.querySelectorAll("button").forEach(function (b) {
    b.addEventListener("click", function () {
      var idx = parseInt(b.getAttribute("data-idx"), 10);
      var act = b.getAttribute("data-act");
      if (act === "load") {
        colors = saved[idx].map(function (c) { return { hex: c, locked: false }; });
        render();
        showToast("Palette loaded");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (act === "del") {
        saved.splice(idx, 1);
        persistSaved();
        renderSaved();
      }
    });
  });
}

// ===== Events =====
genBtn.addEventListener("click", function () { generate(true); });
saveBtn.addEventListener("click", function () {
  var snap = colors.map(function (c) { return c.hex.toUpperCase(); });
  // avoid exact dupes
  var dup = saved.some(function (p) { return p.join("|") === snap.join("|"); });
  if (dup) { showToast("Already saved"); return; }
  saved.unshift(snap);
  persistSaved();
  renderSaved();
  showToast("Palette saved");
});

document.addEventListener("keydown", function (e) {
  if (e.code === "Space" || e.key === " ") {
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    e.preventDefault();
    generate(true);
  }
});

generate(false);
renderSaved();
