/* TerraSense hackathon booth app — vanilla JS, no build step, no backend */
(function () {
  "use strict";

  /* ============ Tabs ============ */
  var tabBtns = document.querySelectorAll(".tab-btn");
  var panels = document.querySelectorAll(".demo-panel");
  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabBtns.forEach(function (b) { b.classList.remove("active"); });
      panels.forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
    });
  });

  /* ============================================================
     DEMO A — Corridor Simulation
  ============================================================ */
  (function corridorSim() {
    var POLE_POS = [12, 31, 50, 69, 88];
    var polesLayer = document.getElementById("poles-layer");
    var carEl = document.getElementById("car");
    var statLatency = document.getElementById("stat-latency");
    var statEvents = document.getElementById("stat-events");
    var statAccuracy = document.getElementById("stat-accuracy");
    var logEl = document.getElementById("sim-log");
    if (!polesLayer) return;

    var poleEls = [];
    var signalEls = [];
    var eventsCount = 0;
    var simBusy = false;

    POLE_POS.forEach(function (pos, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pole";
      btn.style.left = pos + "%";
      btn.dataset.idx = i;
      btn.innerHTML =
        '<div class="status">IDLE</div>' +
        '<div class="deer">🦌</div>' +
        '<div class="beam"></div>' +
        '<div class="panel"></div>' +
        '<div class="stick"></div>';
      btn.addEventListener("click", function () { triggerPole(i); });
      polesLayer.appendChild(btn);
      poleEls.push(btn);
    });

    for (var i = 0; i < POLE_POS.length - 1; i++) {
      var a = POLE_POS[i], b = POLE_POS[i + 1];
      var div = document.createElement("div");
      div.className = "signal";
      div.style.left = a + "%";
      div.style.width = (b - a) + "%";
      polesLayer.appendChild(div);
      signalEls.push(div);
    }

    function setStatus(idx, text) {
      var s = poleEls[idx].querySelector(".status");
      if (s) s.textContent = text;
    }

    /* The car drives left -> right (see tick(): pct increases over time). So
       the poles a driver reaches BEFORE the animal's pole are the ones with a
       LOWER index — that's the only direction worth warning. A pole past the
       animal (higher index) is behind the driver by the time it matters, so
       it never gets cascaded into. */
    var CASCADE_DEPTH = 4;
    var HOP_MS = 420;

    function chainBehind(idx) {
      var chain = [];
      for (var k = 1; k <= CASCADE_DEPTH && idx - k >= 0; k++) {
        chain.push(idx - k); // nearest pole first, then further back
      }
      return chain;
    }

    function triggerPole(idx) {
      if (simBusy) {
        logEl.textContent = "Simulation running — wait for the current cycle to finish.";
        return;
      }
      simBusy = true;
      var chain = chainBehind(idx);

      logEl.innerHTML = "<strong>Pole " + (idx + 1) + "</strong>: camera scanning…";
      poleEls[idx].classList.add("busy");
      setStatus(idx, "DETECT");

      setTimeout(function () {
        setStatus(idx, "VERIFY");
        logEl.innerHTML = "<strong>Pole " + (idx + 1) + "</strong>: verifying across consecutive frames…";
      }, 550);

      var CONNECT_AT = 1200;
      setTimeout(function () {
        setStatus(idx, "CONNECT");
        logEl.innerHTML = chain.length
          ? "<strong>Pole " + (idx + 1) + "</strong>: relaying the alert backward, toward approaching traffic…"
          : "<strong>Pole " + (idx + 1) + "</strong>: first pole in the corridor — no one further back to warn.";
      }, CONNECT_AT);

      var idxWarnAt = CONNECT_AT + 600;
      setTimeout(function () {
        poleEls[idx].classList.remove("busy");
        poleEls[idx].classList.add("active");
        setStatus(idx, "WARN");

        var latency = 180 + Math.round(Math.random() * 240);
        eventsCount++;
        var accuracy = (96 + Math.random() * 1.4).toFixed(1);
        statLatency.textContent = latency + "ms";
        statEvents.textContent = eventsCount;
        statAccuracy.textContent = accuracy + "%";
        logEl.innerHTML = "<strong>Beacon active</strong> — approaching drivers warned at the source.";
      }, idxWarnAt);

      /* Relay backward one hop at a time — each pole passes the alert to the
         one before it, like the beam travelling pole-to-pole over LoRa. */
      chain.forEach(function (poleIdx, hop) {
        var segIdx = poleIdx; // signal segment sits between poleIdx and poleIdx+1
        var travelAt = idxWarnAt + hop * HOP_MS;
        var arriveAt = travelAt + HOP_MS * 0.6;

        setTimeout(function () {
          if (signalEls[segIdx]) signalEls[segIdx].classList.add("on");
        }, travelAt);

        setTimeout(function () {
          if (signalEls[segIdx]) signalEls[segIdx].classList.remove("on");
          poleEls[poleIdx].classList.add("relay");
          setStatus(poleIdx, "WARN");
          var leadCount = hop + 1;
          logEl.innerHTML = "<strong>Pole " + (poleIdx + 1) + "</strong> warned — drivers now get " +
            leadCount + " pole" + (leadCount === 1 ? "" : "s") + " of advance notice.";
        }, arriveAt);
      });

      var lastArriveAt = chain.length
        ? idxWarnAt + (chain.length - 1) * HOP_MS + HOP_MS * 0.6
        : idxWarnAt;
      var holdUntil = lastArriveAt + 2200;

      setTimeout(function () {
        poleEls[idx].classList.remove("active", "busy");
        setStatus(idx, "IDLE");
        chain.forEach(function (poleIdx) {
          poleEls[poleIdx].classList.remove("relay", "active", "busy");
          setStatus(poleIdx, "IDLE");
        });
        logEl.textContent = "Tap a pole above to start another detection.";
        simBusy = false;
      }, holdUntil);
    }

    /* moving car + proximity toast */
    var toastEl = document.createElement("div");
    toastEl.className = "warn-toast";
    toastEl.textContent = "⚠️ WILDLIFE AHEAD";
    carEl.parentElement.appendChild(toastEl);

    var LAP_MS = 12000;
    function tick(ts) {
      var t = (ts % LAP_MS) / LAP_MS;
      var pct = t * 120 - 10; // -10 .. 110
      carEl.style.left = pct + "%";

      var near = false;
      POLE_POS.forEach(function (pos, i) {
        var warned = poleEls[i].classList.contains("active") || poleEls[i].classList.contains("relay");
        if (warned && Math.abs(pct - pos) < 6) near = true;
      });
      toastEl.style.left = pct + "%";
      toastEl.classList.toggle("on", near);

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* ============================================================
     DEMO B — Verify-the-Detection game
  ============================================================ */
  (function verifyGame() {
    var progressEl = document.getElementById("game-progress");
    var playEl = document.getElementById("game-play");
    var endEl = document.getElementById("game-end");
    if (!progressEl) return;

    var emojiEl = document.getElementById("game-emoji");
    var captionEl = document.getElementById("game-caption");
    var timerFill = document.getElementById("game-timerfill");
    var feedbackEl = document.getElementById("game-feedback");
    var youEl = document.getElementById("game-you");
    var roundEl = document.getElementById("game-round");
    var finalEl = document.getElementById("game-final");
    var btnReal = document.getElementById("btn-real");
    var btnFalse = document.getElementById("btn-false");
    var replayBtn = document.getElementById("game-replay");

    var ROUNDS_MASTER = [
      { emoji: "🦌", caption: "Deer stepping onto the shoulder at dusk", real: true },
      { emoji: "🍃", caption: "Branch swaying hard in the wind", real: false },
      { emoji: "🐘", caption: "Elephant herd crossing near the corridor", real: true },
      { emoji: "✨", caption: "Headlight reflection off wet tarmac", real: false },
      { emoji: "🐆", caption: "Leopard glimpsed behind roadside brush", real: true },
      { emoji: "🌫️", caption: "Fog drifting low across the road", real: false },
      { emoji: "🐗", caption: "Wild boar family crossing at night", real: true },
      { emoji: "🕸️", caption: "Spider web vibrating on the camera housing", real: false }
    ];

    var rounds = [];
    var idx = 0, correct = 0, attempted = 0, timerId = null, answered = false;
    var ROUND_MS = 3000;

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    }

    function buildProgress() {
      progressEl.innerHTML = "";
      for (var i = 0; i < rounds.length; i++) {
        var seg = document.createElement("div");
        seg.className = "seg";
        progressEl.appendChild(seg);
      }
    }

    function startGame() {
      rounds = shuffle(ROUNDS_MASTER);
      idx = 0; correct = 0; attempted = 0;
      playEl.style.display = "";
      endEl.style.display = "none";
      buildProgress();
      loadRound();
    }

    function loadRound() {
      answered = false;
      feedbackEl.textContent = "";
      feedbackEl.className = "game-feedback";
      btnReal.disabled = false;
      btnFalse.disabled = false;
      var r = rounds[idx];
      emojiEl.textContent = r.emoji;
      captionEl.textContent = r.caption;
      roundEl.textContent = (idx + 1) + "/" + rounds.length;

      timerFill.style.transition = "none";
      timerFill.style.width = "100%";
      // eslint-disable-next-line no-unused-expressions
      timerFill.offsetWidth; // force reflow
      timerFill.style.transition = "width " + ROUND_MS + "ms linear";
      timerFill.style.width = "0%";

      clearTimeout(timerId);
      timerId = setTimeout(function () { handleAnswer(null); }, ROUND_MS);
    }

    function handleAnswer(choice) {
      if (answered) return;
      answered = true;
      clearTimeout(timerId);
      btnReal.disabled = true;
      btnFalse.disabled = true;

      var r = rounds[idx];
      attempted++;
      var seg = progressEl.children[idx];

      if (choice === null) {
        feedbackEl.textContent = "⏱️ Too slow — that was " + (r.real ? "real wildlife." : "a false trigger.");
        feedbackEl.classList.add("bad");
        if (seg) seg.classList.add("fail");
      } else {
        var isCorrect = choice === r.real;
        if (isCorrect) {
          correct++;
          feedbackEl.textContent = r.real ? "✅ Correct — genuine wildlife, alert confirmed." : "✅ Correct — false trigger filtered out.";
          feedbackEl.classList.add("good");
          if (seg) seg.classList.add("done");
        } else {
          feedbackEl.textContent = r.real ? "❌ Missed it — that was real wildlife." : "❌ False alarm — nothing was really there.";
          feedbackEl.classList.add("bad");
          if (seg) seg.classList.add("fail");
        }
      }
      youEl.textContent = correct + "/" + attempted;

      setTimeout(function () {
        idx++;
        if (idx >= rounds.length) {
          endGame();
        } else {
          loadRound();
        }
      }, 950);
    }

    function endGame() {
      playEl.style.display = "none";
      endEl.style.display = "";
      finalEl.textContent = correct + "/" + rounds.length;
    }

    btnReal.addEventListener("click", function () { handleAnswer(true); });
    btnFalse.addEventListener("click", function () { handleAnswer(false); });
    replayBtn.addEventListener("click", startGame);

    startGame();
  })();

  /* ============================================================
     DEMO C — Pilot cost calculator
  ============================================================ */
  (function calculator() {
    var kmSlider = document.getElementById("calc-km");
    if (!kmSlider) return;
    var densitySlider = document.getElementById("calc-density");
    var kmVal = document.getElementById("calc-km-val");
    var densityVal = document.getElementById("calc-density-val");
    var totalEl = document.getElementById("calc-total");
    var polesEl = document.getElementById("calc-poles");
    var breakdownEl = document.getElementById("calc-breakdown");

    var COMPONENTS = [
      { label: "Edge AI board (Raspberry Pi)", cost: 4000 },
      { label: "Camera module", cost: 1500 },
      { label: "Sensors & communication (PIR, LoRa)", cost: 1000 },
      { label: "Solar panel + battery", cost: 2500 },
      { label: "Warning system (LED + buzzer)", cost: 1000 },
      { label: "Enclosure + pole + wiring", cost: 2500 }
    ];
    var PER_POLE = COMPONENTS.reduce(function (s, c) { return s + c.cost; }, 0); // 12500
    var OVERHEAD = 0.12; // installation & testing, matches deck's ~2.1L / 15-pole benchmark

    function formatINR(n) {
      if (n >= 100000) return "₹" + (n / 100000).toFixed(2).replace(/\.00$/, "") + "L";
      return "₹" + Math.round(n).toLocaleString("en-IN");
    }

    function recompute() {
      var km = parseFloat(kmSlider.value);
      var density = parseFloat(densitySlider.value);
      var poles = Math.max(1, Math.round(km * density));

      kmVal.textContent = km;
      densityVal.textContent = (Math.round(density * 100) / 100).toString();

      var rawTotal = poles * PER_POLE;
      var overheadAmt = rawTotal * OVERHEAD;
      var grandTotal = rawTotal + overheadAmt;

      totalEl.textContent = formatINR(grandTotal);
      polesEl.textContent = poles;

      var rows = COMPONENTS.map(function (c) {
        return '<div class="row"><span>' + c.label + '</span><span>' + formatINR(c.cost * poles) + "</span></div>";
      });
      rows.push('<div class="row"><span>Installation &amp; testing (~12%)</span><span>' + formatINR(overheadAmt) + "</span></div>");
      breakdownEl.innerHTML = rows.join("");
    }

    kmSlider.addEventListener("input", recompute);
    densitySlider.addEventListener("input", recompute);
    recompute();
  })();

  /* ============================================================
     Deck viewer (pdf.js)
  ============================================================ */
  (function deckViewer() {
    var viewerEl = document.getElementById("deck-viewer");
    if (!viewerEl || typeof pdfjsLib === "undefined") {
      if (viewerEl) viewerEl.innerHTML = '<span class="deck-loading">Inline preview unavailable — use the download buttons below.</span>';
      return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/vendor/pdf.worker.min.js";

    var pageInfoEl = document.getElementById("pdf-pageinfo");
    var prevBtn = document.getElementById("pdf-prev");
    var nextBtn = document.getElementById("pdf-next");
    var pdfDoc = null, pageNum = 1, pageCount = 0, rendering = false;

    function renderPage(num) {
      if (!pdfDoc || rendering) return;
      rendering = true;
      pdfDoc.getPage(num).then(function (page) {
        var containerWidth = Math.max(240, viewerEl.clientWidth - 20);
        var unscaled = page.getViewport({ scale: 1 });
        var scale = Math.min(containerWidth / unscaled.width, 1.8);
        var viewport = page.getViewport({ scale: scale });

        var canvas = viewerEl.querySelector("canvas");
        if (!canvas) {
          canvas = document.createElement("canvas");
          viewerEl.innerHTML = "";
          viewerEl.appendChild(canvas);
        }
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        var ctx = canvas.getContext("2d");
        page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
          rendering = false;
        });
        pageInfoEl.textContent = "Slide " + num + " / " + pageCount;
        prevBtn.disabled = num <= 1;
        nextBtn.disabled = num >= pageCount;
      }).catch(function () { rendering = false; });
    }

    pdfjsLib.getDocument("assets/deck.pdf").promise.then(function (doc) {
      pdfDoc = doc;
      pageCount = doc.numPages;
      renderPage(pageNum);
    }).catch(function () {
      pageInfoEl.textContent = "Preview unavailable";
      viewerEl.innerHTML = '<span class="deck-loading">Couldn’t load the inline preview — use the download buttons below.</span>';
    });

    prevBtn.addEventListener("click", function () { if (pageNum > 1) { pageNum--; renderPage(pageNum); } });
    nextBtn.addEventListener("click", function () { if (pageNum < pageCount) { pageNum++; renderPage(pageNum); } });
  })();
})();
