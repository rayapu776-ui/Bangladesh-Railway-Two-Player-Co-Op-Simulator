// ============================================================================
// TRACKS OF BENGAL: BANGLADESH RAILWAY CO-OP SIMULATOR
// Module: audioEngine.js — Procedural Web Audio Synthesizer (EMD/ALCO/Ambience)
// ============================================================================

window.BRSim = window.BRSim || {};

class BangladeshiRailwayAudioEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = false;
    this.masterGain = null;

    // Continuous Engine Nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.turboOsc = null;
    this.engineModOsc = null;
    this.engineGain = null;
    this.turboGain = null;

    // Horn Nodes
    this.hornActive = false;
    this.hornOscs = [];
    this.hornGain = null;

    // Rain / Monsoon Ambience
    this.rainNode = null;
    this.rainGain = null;

    // Track joint click scheduler
    this.trackStepAccumulator = 0;
    this.bellTimer = 0;
    this.soundProfile = "emd_710";
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.65;
      this.masterGain.connect(this.ctx.destination);

      this._setupPrimeMoverSynth();
      this._setupRainAmbience();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API could not initialize:", e);
    }
  }

  setProfile(profileName) {
    this.soundProfile = profileName || "emd_710";
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.65, this.ctx.currentTime, 0.08);
    }
    return this.muted;
  }

  _setupPrimeMoverSynth() {
    const now = this.ctx.currentTime;

    // Prime mover fundamental & harmonic
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc1.type = "sawtooth";
    this.engineOsc2.type = "triangle";

    // Cylinder firing pulse modulator (LFO)
    this.engineModOsc = this.ctx.createOscillator();
    this.engineModOsc.type = "square";
    this.engineModOsc.frequency.value = 10;

    const modGain = this.ctx.createGain();
    modGain.gain.value = 14;
    this.engineModOsc.connect(modGain);
    modGain.connect(this.engineOsc1.frequency);

    // Low-pass filter for warm diesel cabinet muffled rumble
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = "lowpass";
    this.engineFilter.frequency.value = 180;
    this.engineFilter.Q.value = 2.8;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.18;

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    // EMD / ALCO Turbocharger Whine Oscillator
    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = "sine";
    this.turboOsc.frequency.value = 620;

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.value = 0.01;

    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.masterGain);

    this.engineOsc1.start(now);
    this.engineOsc2.start(now);
    this.engineModOsc.start(now);
    this.turboOsc.start(now);
  }

  _setupRainAmbience() {
    // White noise buffer for monsoon rain & cab air ambience
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseBuffer = noiseBuffer;
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = "bandpass";
    rainFilter.frequency.value = 1100;
    rainFilter.Q.value = 0.7;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.0;

    whiteNoise.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    whiteNoise.start();
  }

  // Called every frame from main loop to update engine RPM, track joints, & weather
  update(dt, telemetry, weatherMode, onBridge, nearCrossing) {
    if (!this.initialized || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notch = telemetry.notch || 0;
    const rpmRatio = (telemetry.rpm - 310) / 600; // 0.0 at idle (310 RPM), 1.0 at Notch 8 (910 RPM)
    const clampedRpm = Math.max(0, Math.min(1.2, rpmRatio));

    // Differentiate ALCO 251 (deep 4-stroke chug) vs EMD 645/710 (2-stroke hum + turbo whine)
    const isAlco = this.soundProfile === "alco_251";
    const baseFreq = isAlco ? 36 + clampedRpm * 52 : 44 + clampedRpm * 68;
    const chugRate = isAlco ? 7 + clampedRpm * 19 : 11 + clampedRpm * 26;

    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.08);
    this.engineModOsc.frequency.setTargetAtTime(chugRate, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(140 + clampedRpm * 340, now, 0.1);
    this.engineGain.gain.setTargetAtTime(0.14 + clampedRpm * 0.18, now, 0.1);

    // Iconic Bangladeshi Hyundai Rotem / EMD Turbo Whine
    const turboFreq = isAlco ? 520 + clampedRpm * 980 : 680 + clampedRpm * 1350;
    const turboVol = (notch > 0 ? 0.018 + Math.pow(clampedRpm, 1.4) * 0.065 : 0.008);
    this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.15);
    this.turboGain.gain.setTargetAtTime(turboVol, now, 0.15);

    // Monsoon rain volume
    const targetRain = weatherMode === "monsoon_rain" ? 0.12 : 0.0;
    this.rainGain.gain.setTargetAtTime(targetRain, now, 0.3);

    // Rhythmic Track Joint "Ta-kat... Ta-kat" Clicks & Steel Bridge Resonance
    const speedMps = Math.abs(telemetry.speedKmh) / 3.6;
    if (speedMps > 0.5) {
      this.trackStepAccumulator += speedMps * dt;
      const railPanelLength = onBridge ? 9.5 : 13.0; // Faster metallic cadence on steel truss bridges
      if (this.trackStepAccumulator >= railPanelLength) {
        this.trackStepAccumulator %= railPanelLength;
        this._triggerTrackJointClick(speedMps, onBridge);
      }
    }

    // Level Crossing Bell ("Ding-Dong-Ding") when within 220m of an active Rail Gate
    if (nearCrossing) {
      this.bellTimer += dt;
      if (this.bellTimer >= 0.42) {
        this.bellTimer = 0;
        this._playCrossingBellTick();
      }
    }
  }

  _triggerTrackJointClick(speedMps, onBridge) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const vol = Math.min(0.22, 0.04 + (speedMps / 35) * 0.16);

    // Double bogie click ("ta-kat")
    [0, Math.max(0.05, 0.18 - speedMps * 0.003)].forEach((offset) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = onBridge ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(onBridge ? 135 : 95, now + offset);
      osc.frequency.exponentialRampToValueAtTime(onBridge ? 55 : 38, now + offset + 0.065);

      gain.gain.setValueAtTime(vol, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + (onBridge ? 0.11 : 0.065));

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + (onBridge ? 0.12 : 0.07));
    });
  }

  // Dual-Tone Pneumatic Horn (Authentic Bangladesh Railway Nathan/Wabco Chord)
  startHorn(highCountryMode = true) {
    this.init();
    if (!this.ctx || this.hornActive) return;
    this.hornActive = true;

    const now = this.ctx.currentTime;
    this.hornGain = this.ctx.createGain();
    this.hornGain.gain.setValueAtTime(0.01, now);
    this.hornGain.gain.linearRampToValueAtTime(0.28, now + 0.06);
    this.hornGain.connect(this.masterGain);

    // Authentic 3-chime Bangladeshi diesel horn chord
    const freqs = highCountryMode ? [311.13, 392.0, 466.16] : [261.63, 329.63, 392.0];
    this.hornOscs = freqs.map((f) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1450;

      osc.connect(filter);
      filter.connect(this.hornGain);
      osc.start(now);
      return osc;
    });
  }

  stopHorn() {
    if (!this.hornActive || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.hornGain) {
      this.hornGain.gain.setTargetAtTime(0.0001, now, 0.08);
    }
    const oscsToStop = this.hornOscs;
    setTimeout(() => {
      oscsToStop.forEach((o) => {
        try { o.stop(); } catch (e) {}
      });
    }, 260);
    this.hornOscs = [];
    this.hornActive = false;
  }

  // Westinghouse A9 Pneumatic Brake Pipe Exhaust Hiss
  playBrakeHiss(duration = 0.45) {
    this.init();
    if (!this.ctx || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.value = 1.4;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + duration);
  }

  // Metallic Token Hoop Snatch / Station Bell Sound
  playTokenSnatchSound(success = true) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const freqs = success ? [587.33, 880.0, 1174.66] : [220.0, 185.0];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + idx * 0.07);
      gain.gain.setValueAtTime(0.22, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.36);
    });
  }

  // Level Crossing "Ding-Dong" Bell
  _playCrossingBellTick() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    this._bellToggle = !this._bellToggle;
    osc.type = "sine";
    osc.frequency.setValueAtTime(this._bellToggle ? 987.77 : 783.99, now);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Cab Vigilance / Alerter / Fault Warning Beep
  playCabAlertBeep(urgent = false) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(urgent ? 1046.5 : 784.0, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  // Bilingual Bengali / English Voice Callout via SpeechSynthesis (non-blocking)
  speakAnnouncement(textEn, textBn) {
    if (this.muted || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(textEn);
      utter.rate = 1.02;
      utter.pitch = 0.98;
      utter.volume = 0.75;
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  }
}

window.BRSim.AudioEngine = new BangladeshiRailwayAudioEngine();

