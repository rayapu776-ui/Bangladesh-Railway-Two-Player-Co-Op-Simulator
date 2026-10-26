// ============================================================================
// TRACKS OF BENGAL: BANGLADESH RAILWAY CO-OP SIMULATOR
// Module: main.js — Co-Op Controller, Tactile Control Stand & Live Animation Loop
// ============================================================================

window.BRSim = window.BRSim || {};

class BangladeshRailwayGameController {
  constructor() {
    this.physics = window.BRSim.Physics;
    this.audio = window.BRSim.AudioEngine;
    this.renderer = window.BRSim.Renderer3D;
    this.mapRenderer = window.BRSim.MapRenderer;

    this.selectedRoute = window.BRSim.DATA.routes[0];
    this.selectedLoco = window.BRSim.DATA.locomotives[0];

    this.lastTimestamp = performance.now();
    this.hawkerTimer = 0;
  }

  init() {
    this.mainCanvas = document.getElementById("simViewportCanvas");
    this.miniMapCanvas = document.getElementById("miniMapCanvas");
    this.fullMapCanvas = document.getElementById("fullMapCanvas");
    this.trackProfileCanvas = document.getElementById("trackProfileCanvas");

    this._handleResize();
    window.addEventListener("resize", () => this._handleResize());

    this._populateSelectors();
    this._bindKeyboardAndButtons();
    this.startNewDuty(this.selectedRoute, this.selectedLoco);

    requestAnimationFrame((ts) => this._gameLoop(ts));
  }

  _handleResize() {
    if (this.mainCanvas && this.mainCanvas.parentElement) {
      const rect = this.mainCanvas.parentElement.getBoundingClientRect();
      this.mainCanvas.width = Math.max(820, rect.width);
      this.mainCanvas.height = Math.max(420, rect.height);
    }
  }

  _populateSelectors() {
    const routeSelect = document.getElementById("routeSelectDropdown");
    const locoSelect = document.getElementById("locoSelectDropdown");

    if (routeSelect) {
      routeSelect.innerHTML = "";
      window.BRSim.DATA.routes.forEach((r) => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = `[${r.gauge}] ${r.trainNo} ${r.name} — ${r.bengaliName}`;
        routeSelect.appendChild(opt);
      });
      routeSelect.addEventListener("change", (e) => {
        const r = window.BRSim.DATA.routes.find((x) => x.id === e.target.value);
        if (r) {
          this.selectedRoute = r;
          const recLoco = window.BRSim.DATA.locomotives.find((l) => l.id === r.recommendedLoco) || this.selectedLoco;
          this.selectedLoco = recLoco;
          if (locoSelect) locoSelect.value = recLoco.id;
          this.startNewDuty(this.selectedRoute, this.selectedLoco);
        }
      });
    }

    if (locoSelect) {
      locoSelect.innerHTML = "";
      window.BRSim.DATA.locomotives.forEach((l) => {
        const opt = document.createElement("option");
        opt.value = l.id;
        opt.textContent = `${l.code} — ${l.name} (${l.powerHP} HP, ${l.gauge})`;
        locoSelect.appendChild(opt);
      });
      locoSelect.addEventListener("change", (e) => {
        const l = window.BRSim.DATA.locomotives.find((x) => x.id === e.target.value);
        if (l) {
          this.selectedLoco = l;
          this.startNewDuty(this.selectedRoute, this.selectedLoco);
        }
      });
    }
  }

  startNewDuty(route, loco) {
    this.physics.reset(route, loco);
    // Start in Notch 3 departing the origin platform so the train & wheels animate immediately!
    this.physics.notch = 3;
    this.physics.speedKmh = 28;

    this.renderer.setWeather(route.weatherDefault || "clear_sunset");
    this.audio.setProfile(loco.soundProfile);

    const weatherSelect = document.getElementById("weatherSelectDropdown");
    if (weatherSelect) weatherSelect.value = this.renderer.weatherMode;

    this._updateCautionOrderUI();
    this.logComms(
      "DISPATCH / GUARD",
      `Departing ${route.stations[0].name} on ${route.trainNo} ${route.name} (${loco.code}). Use [W]/[S] for Throttle, [A]/[D] for Brakes, [SPACE] for Horn!`,
      `ডিউটি শুরু: ${route.bengaliName} (${loco.bengaliName})। থ্রটল [W]/[S], ব্রেক [A]/[D], এবং হর্ন [SPACE] ব্যবহার করুন!`
    );
  }

  _updateCautionOrderUI() {
    const r = this.physics.route;
    const coBox = document.getElementById("cautionOrderList");
    if (!coBox) return;
    coBox.innerHTML = `
      <div class="co-header">📋 FORM ${r.cautionOrder.formNo} — ${r.signalingSystem}</div>
      ${r.cautionOrder.restrictions.map((item) => `<div class="co-item">⚠️ ${item}</div>`).join("")}
    `;
  }

  _bindKeyboardAndButtons() {
    // Keyboard Controls for Player 1 (LP) & Player 2 (ALP)
    window.addEventListener("keydown", (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT")) return;
      this.audio.init();
      const key = e.key.toLowerCase();

      // Player 1: Loco Pilot (LP)
      if (key === "w") {
        const res = this.physics.changeNotch(1);
        if (!res.ok && res.msg) this.logComms("LP CAB", res.msg, res.msg);
      } else if (key === "s") {
        this.physics.changeNotch(-1);
      } else if (key === "d") {
        this.physics.changeAutoBrake(1);
      } else if (key === "a") {
        this.physics.changeAutoBrake(-1);
      } else if (key === "e") {
        this.physics.changeIndependentBrake(1);
      } else if (key === "q") {
        this.physics.changeIndependentBrake(-1);
      } else if (key === "r") {
        const res = this.physics.changeReverser(1);
        if (!res.ok && res.msg) this.logComms("LP CAB", res.msg, res.msg);
      } else if (key === "f") {
        const res = this.physics.changeReverser(-1);
        if (!res.ok && res.msg) this.logComms("LP CAB", res.msg, res.msg);
      } else if (key === " ") {
        e.preventDefault();
        this.physics.hornActive = true;
        this.audio.startHorn(true);
      } else if (key === "x") {
        this.physics.sanderActive = !this.physics.sanderActive;
        this.logComms(
          "LP SANDER",
          `Pneumatic Rail Sander ${this.physics.sanderActive ? "ENGAGED (High Grip)" : "OFF"}`,
          `রেল স্যান্ডার ${this.physics.sanderActive ? "চালু করা হয়েছে" : "বন্ধ করা হয়েছে"}`
        );
      } else if (key === "c") {
        const res = this.physics.lpAcknowledgeCallout();
        this.logComms("LP -> ALP", res.en, res.bn);
      }

      // Player 2: Assistant Loco Pilot (ALP)
      else if (key === "i") {
        const res = this.physics.alpCallOutSignal();
        this.logComms("ALP -> LP", res.en, res.bn);
        this.audio.playCabAlertBeep(false);
      } else if (key === "o") {
        const res = this.physics.alpAttemptTokenExchange();
        this.logComms("ALP TOKEN HOOP", res.en, res.bn);
      } else if (key === "p") {
        const res = this.physics.alpResetAlarmChain();
        this.logComms("ALP ACP VALVE", res.en, res.bn);
      } else if (key === "k") {
        const res = this.physics.alpInspectEngineRoom();
        this.logComms("ALP ENGINE ROOM", res.en, res.bn);
      } else if (key === "l") {
        const msg = window.BRSim.DATA.guardMessages[0];
        this.logComms("GUARD VHF", msg.en, msg.bn);
        this.audio.speakAnnouncement("Guard reports Brake Pipe five point zero kilograms. Green flag shown, line clear!", msg.bn);
      } else if (key === "j") {
        this.physics.wipersOn = !this.physics.wipersOn;
        this.logComms(
          "ALP CAB",
          `Windshield Wipers ${this.physics.wipersOn ? "ON" : "OFF"}`,
          `উইন্ডশিল্ড ওয়াইপার ${this.physics.wipersOn ? "চালু" : "বন্ধ"}`
        );
      } else if (key === "v") {
        const cam = this.renderer.cycleCamera();
        const camBtn = document.getElementById("btnCycleCamera");
        if (camBtn) camBtn.textContent = `🎥 View: ${cam.replace(/_/g, " ")} [V]`;
        this.logComms("CAMERA", `Switched View Mode: ${cam}`, `ক্যামেরা ভিউ: ${cam}`);
      } else if (key === "m") {
        this.toggleFullMapModal();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === " ") {
        this.physics.hornActive = false;
        this.audio.stopHorn();
      }
    });

    // Direct Clickable Throttle Quadrant Pips (IDLE..N8)
    const throttlePips = document.getElementById("throttleNotchPips");
    if (throttlePips) {
      throttlePips.querySelectorAll(".pip").forEach((pip) => {
        pip.addEventListener("click", () => {
          this.audio.init();
          const targetNotch = parseInt(pip.getAttribute("data-notch"), 10);
          if (!isNaN(targetNotch)) {
            this.physics.notch = targetNotch;
          }
        });
      });
    }

    // Direct Clickable A9 Air Brake Quadrant Pips (OVR..EMRG)
    const brakePips = document.getElementById("brakeNotchPips");
    if (brakePips) {
      brakePips.querySelectorAll(".pip").forEach((pip) => {
        pip.addEventListener("click", () => {
          this.audio.init();
          const targetIdx = parseInt(pip.getAttribute("data-brake"), 10);
          if (!isNaN(targetIdx)) {
            const delta = targetIdx - this.physics.autoBrakeIndex;
            this.physics.changeAutoBrake(delta);
          }
        });
      });
    }

    // Bind On-Screen Co-Op Control Stand Buttons
    const bindBtn = (id, fn) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("click", () => {
          this.audio.init();
          fn();
        });
      }
    };

    bindBtn("btnNotchUp", () => this.physics.changeNotch(1));
    bindBtn("btnNotchDown", () => this.physics.changeNotch(-1));
    bindBtn("btnBrakeApply", () => this.physics.changeAutoBrake(1));
    bindBtn("btnBrakeRelease", () => this.physics.changeAutoBrake(-1));
    bindBtn("btnReverserFwd", () => {
      if (Math.abs(this.physics.speedKmh) > 1.5 || this.physics.notch > 0) {
        this.logComms("LP CAB", "Stop train & set IDLE before toggling Reverser!", "রিভার্সার পরিবর্তনের আগে ট্রেন থামান!");
        return;
      }
      this.physics.reverser = this.physics.reverser === 1 ? -1 : 1;
    });
    bindBtn("btnSander", () => {
      this.physics.sanderActive = !this.physics.sanderActive;
    });
    bindBtn("btnLpAck", () => {
      const res = this.physics.lpAcknowledgeCallout();
      this.logComms("LP -> ALP", res.en, res.bn);
    });

    // Horn button press & hold
    const hornBtn = document.getElementById("btnHorn");
    if (hornBtn) {
      hornBtn.addEventListener("mousedown", () => {
        this.audio.init();
        this.physics.hornActive = true;
        this.audio.startHorn(true);
      });
      window.addEventListener("mouseup", () => {
        if (this.physics.hornActive) {
          this.physics.hornActive = false;
          this.audio.stopHorn();
        }
      });
    }

    // Player 2 (ALP) Hardware Buttons
    bindBtn("btnAlpSignal", () => {
      const res = this.physics.alpCallOutSignal();
      this.logComms("ALP -> LP", res.en, res.bn);
      this.audio.playCabAlertBeep(false);
    });
    bindBtn("btnAlpToken", () => {
      const res = this.physics.alpAttemptTokenExchange();
      this.logComms("ALP TOKEN HOOP", res.en, res.bn);
    });
    bindBtn("btnAlpAcp", () => {
      const res = this.physics.alpResetAlarmChain();
      this.logComms("ALP ACP VALVE", res.en, res.bn);
    });
    bindBtn("btnAlpEngine", () => {
      const res = this.physics.alpInspectEngineRoom();
      this.logComms("ALP ENGINE ROOM", res.en, res.bn);
    });
    bindBtn("btnAlpGuard", () => {
      const msg = window.BRSim.DATA.guardMessages[0];
      this.logComms("GUARD VHF", msg.en, msg.bn);
      this.audio.speakAnnouncement("Guard reports Brake Pipe 5.0! Green flag shown, line clear!", msg.bn);
    });
    bindBtn("btnAlpWipers", () => {
      this.physics.wipersOn = !this.physics.wipersOn;
    });

    // Top Bar Utility Buttons
    bindBtn("btnCycleCamera", () => {
      const mode = this.renderer.cycleCamera();
      const camBtn = document.getElementById("btnCycleCamera");
      if (camBtn) camBtn.textContent = `🎥 View: ${mode.replace(/_/g, " ")} [V]`;
    });

    bindBtn("btnToggleMap", () => this.toggleFullMapModal());
    bindBtn("btnCloseMapModal", () => this.toggleFullMapModal(false));

    bindBtn("btnToggleAiAlp", () => {
      this.physics.aiAlpAssist = !this.physics.aiAlpAssist;
      const btn = document.getElementById("btnToggleAiAlp");
      if (btn) {
        btn.textContent = this.physics.aiAlpAssist ? "🤖 AI Co-Pilot: ON" : "👥 2P Manual Co-Op";
        btn.classList.toggle("active-pill", this.physics.aiAlpAssist);
      }
      this.logComms(
        "CO-OP MODE",
        this.physics.aiAlpAssist
          ? "AI Assistant Loco Pilot Enabled (Auto-snatches tokens & resets faults alongside you)"
          : "Full Two-Player Manual Co-Op Active (Player 1 LP + Player 2 ALP)",
        this.physics.aiAlpAssist ? "এআই সহকারী লোকো পাইলট চালু হয়েছে" : "দুই-খেলোয়াড় ম্যানুয়াল কো-অপ মোড চালু"
      );
    });

    bindBtn("btnMuteAudio", () => {
      const muted = this.audio.toggleMute();
      const btn = document.getElementById("btnMuteAudio");
      if (btn) btn.textContent = muted ? "🔇 Audio Muted" : "🔊 Audio Live";
    });

    const weatherSelect = document.getElementById("weatherSelectDropdown");
    if (weatherSelect) {
      weatherSelect.addEventListener("change", (e) => {
        this.renderer.setWeather(e.target.value);
      });
    }
  }

  toggleFullMapModal(forceState) {
    const modal = document.getElementById("fullMapModal");
    if (!modal) return;
    const isHidden = modal.classList.contains("hidden");
    const show = typeof forceState === "boolean" ? forceState : isHidden;
    modal.classList.toggle("hidden", !show);
    if (show && this.fullMapCanvas) {
      this.mapRenderer.renderMap(this.fullMapCanvas, this.physics, true);
    }
  }

  logComms(sender, textEn, textBn) {
    const logEl = document.getElementById("commsLogFeed");
    if (!logEl) return;

    const entry = document.createElement("div");
    entry.className = "comms-entry";
    entry.innerHTML = `
      <span class="comms-badge">${sender}</span>
      <div class="comms-text">
        <div class="comms-bn">${textBn || ""}</div>
        <div class="comms-en">${textEn || ""}</div>
      </div>
    `;
    logEl.prepend(entry);
    while (logEl.children.length > 8) {
      logEl.removeChild(logEl.lastChild);
    }
  }

  _gameLoop(timestamp) {
    const dt = Math.min(0.05, Math.max(0.001, (timestamp - this.lastTimestamp) / 1000));
    this.lastTimestamp = timestamp;

    // 1. Update Physics & Co-Op Events
    this.physics.update(dt, this.renderer.weatherMode, (ev) => {
      this.logComms(ev.type.toUpperCase(), ev.en, ev.bn);
      if (ev.type === "station_depart" || ev.type === "route_complete") {
        this.audio.speakAnnouncement(ev.en, ev.bn);
      }
    });

    // 2. Ambient Platform Hawker Calls when stopped at a Bangladeshi station
    if (this.physics.atStation && Math.abs(this.physics.speedKmh) < 3) {
      this.hawkerTimer += dt;
      if (this.hawkerTimer > 9.5) {
        this.hawkerTimer = 0;
        const cry = window.BRSim.DATA.hawkerCries[Math.floor(Math.random() * window.BRSim.DATA.hawkerCries.length)];
        this.logComms("PLATFORM HAWKER", cry.en, cry.bn);
      }
    }

    // 3. Update Web Audio Synthesizer
    this.audio.update(
      dt,
      this.physics,
      this.renderer.weatherMode,
      Boolean(this.physics.onBridge),
      Boolean(this.physics.nearLevelCrossing)
    );

    // 4. Render Studio Viewport, Mini-Map, & Track Profile Ribbon
    this.renderer.render(this.mainCanvas, this.physics, dt);
    this.mapRenderer.renderMap(this.miniMapCanvas, this.physics, false);
    this._renderTrackProfileRibbon();

    const modal = document.getElementById("fullMapModal");
    if (modal && !modal.classList.contains("hidden")) {
      this.mapRenderer.renderMap(this.fullMapCanvas, this.physics, true);
    }

    // 5. Update DOM Telemetry, Quadrant Pips, Hardware Button LEDs & SVG Dials
    this._updateDomReadouts();

    requestAnimationFrame((ts) => this._gameLoop(ts));
  }

  _renderTrackProfileRibbon() {
    const canvas = this.trackProfileCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const p = this.physics;
    const totalKm = p.route.totalDistanceKm;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#08101c";
    ctx.fillRect(0, 0, w, h);

    const padX = 36;
    const usableW = w - padX * 2;
    const lineY = h * 0.56;

    // Track Line
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(padX, lineY);
    ctx.lineTo(w - padX, lineY);
    ctx.stroke();

    // Completed progress bar
    const progX = padX + Math.min(1, p.distanceKm / totalKm) * usableW;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(padX, lineY);
    ctx.lineTo(progX, lineY);
    ctx.stroke();

    // Bridges & Level Crossings along profile
    p.route.events.forEach((ev) => {
      const ex = padX + (ev.km / totalKm) * usableW;
      ctx.fillStyle = ev.type === "bridge" ? "#38bdf8" : ev.type === "level_crossing" ? "#f59e0b" : "#a855f7";
      ctx.fillRect(ex - 3, lineY - 8, 6, 16);
    });

    // Stations along profile
    p.route.stations.forEach((st, idx) => {
      const sx = padX + (st.km / totalKm) * usableW;
      const done = Boolean(p.stationStopDoneMap[idx] || p.tokenExchangeDoneMap[st.id]);

      ctx.beginPath();
      ctx.arc(sx, lineY, 6, 0, Math.PI * 2);
      ctx.fillStyle = done ? "#10b981" : st.tokenExchange ? "#facc15" : "#f8fafc";
      ctx.fill();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 9.5px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(st.name.split(" ")[0], sx, lineY - 11);
      ctx.fillStyle = "#64748b";
      ctx.font = "8.5px monospace";
      ctx.fillText(`${st.km.toFixed(1)}km`, sx, lineY + 17);
    });

    // Live Train Marker on Profile
    ctx.fillStyle = "#f42a41";
    ctx.beginPath();
    ctx.arc(progX, lineY, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  _updateDomReadouts() {
    const p = this.physics;
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setTxt("hudSpeedVal", `${Math.round(p.speedKmh)} km/h`);
    setTxt("hudLimitVal", `Limit: ${p.currentSpeedLimitKmh} km/h`);
    setTxt("hudNotchVal", p.notch === 0 ? "IDLE (N0)" : `NOTCH ${p.notch}`);
    setTxt("hudReverserVal", p.reverser === 1 ? "FORWARD" : p.reverser === -1 ? "REVERSE" : "NEUTRAL");
    setTxt("hudAutoBrakeVal", p.autoBrakeLabels[p.autoBrakeIndex]);
    setTxt("hudIndBrakeVal", `Loco Brake: ${(p.indBrakeRatio * 3.5).toFixed(1)} kg/cm²`);
    setTxt("hudBpVal", `BP: ${p.brakePipePressure.toFixed(1)} | BC: ${p.brakeCylinderPressure.toFixed(1)} kg/cm²`);
    setTxt("hudRpmAmpsVal", `${Math.round(p.rpm)} RPM | ${Math.round(p.amps)} A | ${Math.round(p.waterTempC)}°C`);
    setTxt("btnReverserLabel", p.reverser === 1 ? "REV: FWD" : p.reverser === -1 ? "REV: BACK" : "REV: NEUT");

    // 1. Update Throttle & Brake Quadrant Pips
    const throttlePips = document.getElementById("throttleNotchPips");
    if (throttlePips) {
      throttlePips.querySelectorAll(".pip").forEach((pip) => {
        const n = parseInt(pip.getAttribute("data-notch"), 10);
        pip.classList.toggle("active", n === p.notch);
      });
    }
    const brakePips = document.getElementById("brakeNotchPips");
    if (brakePips) {
      brakePips.querySelectorAll(".pip").forEach((pip) => {
        const b = parseInt(pip.getAttribute("data-brake"), 10);
        pip.classList.toggle("active", b === p.autoBrakeIndex);
      });
    }

    // 2. Update SVG Analog Dial Needles
    const speedNeedle = document.getElementById("svgNeedleSpeed");
    if (speedNeedle) {
      const deg = (Math.min(120, Math.max(0, p.speedKmh)) / 120) * 260;
      speedNeedle.style.transform = `rotate(${deg}deg)`;
    }
    setTxt("svgTextSpeed", `${Math.round(p.speedKmh)}`);

    const bpNeedle = document.getElementById("svgNeedleBp");
    if (bpNeedle) {
      const deg = ((Math.min(6, Math.max(0, p.brakePipePressure)) / 6) * 260) - 130;
      bpNeedle.style.transform = `rotate(${deg}deg)`;
    }
    const bcNeedle = document.getElementById("svgNeedleBc");
    if (bcNeedle) {
      const deg = (Math.min(5, Math.max(0, p.brakeCylinderPressure)) / 5) * 240;
      bcNeedle.style.transform = `rotate(${deg}deg)`;
    }
    setTxt("svgTextBp", `${p.brakePipePressure.toFixed(1)}`);

    // 3. Update 3-Lens Cab Signal Repeater
    const asp = p.activeSignalAspect;
    const lg = document.getElementById("lensGreen");
    const ly = document.getElementById("lensYellow");
    const lr = document.getElementById("lensRed");
    if (lg) lg.classList.toggle("active", asp === "GREEN");
    if (ly) ly.classList.toggle("active", asp === "YELLOW" || asp === "DOUBLE_YELLOW");
    if (lr) lr.classList.toggle("active", asp === "RED");
    setTxt("cabSignalText", asp.replace("_", " "));

    // 4. Update Tactile Hardware Button LED Rings
    const setLed = (id, stateClass) => {
      const el = document.getElementById(id);
      if (el) el.className = "led-ring " + (stateClass || "");
    };
    setLed("ledHorn", p.hornActive ? "led-warn" : "");
    setLed("ledSander", p.sanderActive ? "led-on" : "");
    setLed("ledLpAck", p.alpCalledSignal ? "led-warn" : "led-on");
    setLed("ledAlpSignal", p.alpCalledSignal ? "led-on" : "");
    setLed("ledAlpToken", p.nearTokenStation && !p.tokenExchangeDoneMap[p.nearTokenStation.id] ? "led-warn" : "");
    setLed("ledAlpAcp", p.alarmChainPulled ? "led-alert" : "");
    setLed("ledAlpEngine", p.groundRelayTripped || p.waterTempC > 88 ? "led-alert" : p.radiatorLouversOpen ? "led-on" : "");
    setLed("ledAlpWipers", p.wipersOn ? "led-on" : "");

    // 5. Next Station & Action Banner
    const nextInfo = p.getNextStationInfo();
    setTxt(
      "hudNextStationVal",
      `${nextInfo.station.name} (${nextInfo.station.bn}) — ${(nextInfo.distanceRemainingKm * 1000).toFixed(0)}m`
    );

    const modeBadge = document.getElementById("hudStationActionBadge");
    if (modeBadge) {
      if (p.alarmChainPulled) {
        modeBadge.textContent = `🚨 COACH #${p.acpCoachNumber} CHAIN PULLED! STOP & ALP PRESS [P]`;
        modeBadge.className = "action-badge badge-danger";
      } else if (p.nearTokenStation && !p.tokenExchangeDoneMap[p.nearTokenStation.id]) {
        modeBadge.textContent = `🟡 TOKEN HOOP AT ${p.nearTokenStation.name.toUpperCase()}! ALP PRESS [O] (15-30 km/h)`;
        modeBadge.className = "action-badge badge-warning";
      } else if (p.encroachingHazardActive) {
        modeBadge.textContent = `⚠️ CNG & RICKSHAW ON RAIL GATE! LP BLOW HORN [SPACE]!`;
        modeBadge.className = "action-badge badge-danger";
      } else if (p.atStation && p.isBoarding) {
        modeBadge.textContent = `🚉 BOARDING AT ${p.atStation.name.toUpperCase()} (${Math.round(p.boardingProgress)}%)`;
        modeBadge.className = "action-badge badge-ok";
      } else {
        modeBadge.textContent = nextInfo.station.tokenExchange
          ? `🟡 Next: Token Snatch [O] at 15–30 km/h`
          : `🛑 Next: Platform Stop at ${nextInfo.station.name}`;
        modeBadge.className = "action-badge badge-info";
      }
    }

    // Co-Op Scores
    setTxt("scoreSafety", `${Math.round(p.score.safetyCompliance)}%`);
    setTxt("scoreSynergy", `${Math.round(p.score.coopSynergy)}%`);
    setTxt("scoreTokens", `${p.score.tokensCaught}`);
    setTxt("scoreSignals", `${p.score.signalsCalled}`);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.BRSim.App = new BangladeshRailwayGameController();
  window.BRSim.App.init();
});
