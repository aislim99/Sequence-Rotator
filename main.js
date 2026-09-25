(function () {
  var cep = window.__adobe_cep__;
  var $ = function (id) { return document.getElementById(id); };
  var btn = $("rotate");
  var fillBtn = $("fill");
  var msgTimer;
  function flash(text, ok) {
    var m = $("msg");
    m.textContent = text; m.className = "msg" + (ok ? " ok" : "");
    clearTimeout(msgTimer);
    msgTimer = setTimeout(function () { m.textContent = ""; m.className = "msg"; msgTimer = null; }, 4000);
  }
  var busy = false;

  function evalJSX(script, cb) {
    if (!cep) { cb("ERR|Not running inside Premiere Pro"); return; }
    cep.evalScript(script, cb);
  }

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  function render(res) {
    var p = String(res || "").split("|");
    if (p[0] !== "OK") {
      $("name").textContent = "-";
      $("dims").textContent = "-";
      $("ratio").textContent = "";
      $("orient").textContent = "";
      $("msg").textContent = p[1] || "Unknown error";
      btn.disabled = true;
      fillBtn.disabled = true;
      return;
    }
    var w = +p[2], h = +p[3], g = gcd(w, h) || 1;
    $("name").textContent = p[1];
    $("dims").textContent = w + "×" + h;
    $("ratio").textContent = (w / g) + ":" + (h / g);
    $("orient").textContent = " · " + (w > h ? "Horizontal" : w < h ? "Vertical" : "Square");
    if (!msgTimer) $("msg").textContent = "";
    btn.disabled = (w === h);
    fillBtn.disabled = false;
    layout();
  }

  function refresh() {
    if (busy) return;
    evalJSX("sr_info()", render);
  }

  btn.addEventListener("click", function () {
    if (busy) return;
    busy = true;
    btn.classList.add("spin");
    evalJSX("sr_rotate()", function (res) {
      render(res);
      setTimeout(function () { btn.classList.remove("spin"); busy = false; }, 250);
    });
  });

  fillBtn.addEventListener("click", function () {
    if (busy) return;
    busy = true;
    fillBtn.classList.add("spin");
    evalJSX("sr_fill()", function (res) {
      var p = String(res || "").split("|");
      if (p[0] === "FILL") {
        var why = [];
        if (+p[4]) why.push(p[4] + " keyframed");
        if (+p[5]) why.push(p[5] + " locked");
        if (+p[3]) why.push(p[3] + " no size");
        flash("Filled " + p[1] + (+p[2] ? " · skipped " + why.join(", ") : ""), +p[1] > 0);
      } else {
        flash(p[1] || "Unknown error", false);
      }
      setTimeout(function () { fillBtn.classList.remove("spin"); busy = false; }, 250);
    });
  });

  // ---- Responsive layout (measured, so it follows the panel's real size) ----
  var root = document.body, wrap = $("wrap"), info = $("info"), dims = $("dims");
  var lastKey = "";
  function setCls(c, on) { if (on) root.classList.add(c); else root.classList.remove(c); }
  function layout() {
    var W = root.clientWidth, H = root.clientHeight;
    var key = W + "x" + H + "|" + dims.textContent;
    if (key === lastKey) return;
    lastKey = key;

    setCls("tiny", H < 44);
    setCls("short", H < 70);
    setCls("narrow", W < 170);
    setCls("slim", W < 72);
    // Tall enough for two rows -> text goes under the buttons
    setCls("stack", H >= 62);

    // Size text to the space available: up to 12px, down to 8px
    var stacked = root.classList.contains("stack");
    var size = Math.max(8, Math.min(12, Math.floor(stacked ? Math.min(W / 7, H / 7.5) : Math.min(W / 11, H / 3.2))));
    dims.style.fontSize = size + "px";
    // If still on one row and it doesn't fit, stack (when there's height) or shrink
    if (!root.classList.contains("stack") && wrap.scrollWidth > wrap.clientWidth + 1 && H >= 50) setCls("stack", true);
    while (size > 8 && (dims.scrollWidth > info.clientWidth + 1)) {
      size -= 0.5; dims.style.fontSize = size + "px";
    }
  }
  window.addEventListener("resize", layout);
  if (window.ResizeObserver) new ResizeObserver(layout).observe(root);

  refresh();
  setInterval(refresh, 1000); // follow whichever sequence is active
})();
