// ============================================================================
// TRACKS OF BENGAL: BANGLADESH RAILWAY CO-OP SIMULATOR
// Module: physicsEngine.js — Authentic Diesel-Electric Physics, Braking & Co-Op
// ============================================================================

window.BRSim = window.BRSim || {};

class TrainPhysicsAndCoopState {
  constructor() {
    this.reset(window.BRSim.DATA.routes[0], window.BRSim.DATA.locomotives[0]);
  }

  reset(route, loco) {
    this.route = route;
    this.loco = loco;

    // Position & Kinematics
    this.distanceKm = 0.0;
    this.speedKmh = 0.0;
    this.accelerationMps2 = 0.0;

    // Player 1 (Loco Pilot - LP) Controls
    this.reverser = 1; // 1 = Forward, 0 = Neutral, -1 = Reverse
    this.notch = 0; // 0 (Idle) to 8
    this.autoBrakeIndex = 1; // 0=Release, 1=Running, 2=Min, 3=Service1, 4=Service2, 5=FullService, 6=Emergency
    this.autoBrakeLabels = [
      "OVERCHARGE (5.4)",
      "RELEASE / RUN (5.0)",
      "MINIMUM (4.5)",
      "SERVICE 1 (4.1)",
      "SERVICE 2 (3.7)",
      "FULL SERVICE (3.3)",
      "EMERGENCY (0.0)"
    ];
    this.indBrakeRatio = 0.0; // SA9 Independent Loco Brake (0.0 to 1.0 -> 0 to 3.5 kg/cm²)
    this.dynamicBrakeLevel = 0; // 0 to 8
    this.sanderActive = false;
    this.hornActive = false;

    // Pneumatic Pressures (kg/cm²)
    this.brakePipePressure = 5.0; // BP
    this.targetBrakePipe = 5.0;
    this.brakeCylinderPressure = 0.0; // BC (Released at 5.0 BP)
    this.locoBrakeCylinder = 0.0;
    this.mainReservoirPressure = 9.2; // MR

    // Prime Mover & Electrical Telemetry
    this.rpm = 315;
    this.amps = 0;
    this.waterTempC = 72.0; // Normal 70-85°C, Overheat > 93°C
    this.wheelSlip = false;
    this.couplerSlackStress = 0; // 0..100%

    // Player 2 (Assistant Loco Pilot - ALP) Co-Op Systems
    this.wipersOn = route.weatherDefault === "monsoon_rain";
    this.headlightMode = "BRIGHT"; // DIM, BRIGHT
    this.groundRelayTripped = false;
    this.radiatorLouversOpen = false;
    this.alarmChainPulled = false;
    this.acpCoachNumber = 0;
    this.lineClearGranted = true;
    this.hasCurrentSectionToken = true;
    this.tokensExchangedCount = 0;

    // Call-and-Response Signal & Caution Protocol
    this.activeSignalAspect = "GREEN"; // GREEN, YELLOW, DOUBLE_YELLOW, RED
    this.signalCalloutPending = false;
    this.alpCalledSignal = false;
    this.lpAcknowledgedSignal = false;
    this.signalCalloutTimer = 0;

    // Active Track Context
    this.currentSpeedLimitKmh = 90;
    this.currentGradientPct = 0.0;
    this.onBridge = null;
    this.nearLevelCrossing = null;
    this.encroachingHazardActive = false;
    this.nearTokenStation = null;
    this.tokenExchangeDoneMap = {};
    this.stationStopDoneMap = { 0: true };
    this.triggeredEventsMap = {};

    // Station Dwell & Boarding State
    this.atStation = route.stations[0];
    this.boardingProgress = 100;
    this.isBoarding = false;
    this.routeCompleted = false;

    // Co-Op Scoring & Service Book Metrics
    this.score = {
      safetyCompliance: 100,
      coopSynergy: 100,
      punctuality: 100,
      smoothness: 100,
      tokensCaught: 0,
      signalsCalled: 0,
      hazardsCleared: 0,
      faultsResolved: 0
    };

    // AI Co-Pilot Assist Option (if 1 human wants automated ALP or LP partner)
    this.aiAlpAssist = false;
  }

  // LP Throttle Control
  changeNotch(delta) {
    if (this.dynamicBrakeLevel > 0 && delta > 0) {
      return { ok: false, msg: "Release Dynamic Brake [Q] before advancing Throttle!" };
    }
    const prev = this.notch;
    this.notch = Math.max(0, Math.min(8, this.notch + delta));
    return { ok: this.notch !== prev, notch: this.notch };
  }

  // LP Automatic Train Brake (A9)
  changeAutoBrake(delta) {
    const prev = this.autoBrakeIndex;
    this.autoBrakeIndex = Math.max(0, Math.min(6, this.autoBrakeIndex + delta));
    const bpTargets = [5.3, 5.0, 4.5, 4.1, 3.7, 3.3, 0.0];
    this.targetBrakePipe = bpTargets[this.autoBrakeIndex];
    if (this.autoBrakeIndex <= 1) {
      this.indBrakeRatio = 0.0;
    }
    if (this.autoBrakeIndex !== prev) {
      window.BRSim.AudioEngine.playBrakeHiss(0.38);
    }
    return { ok: this.autoBrakeIndex !== prev, label: this.autoBrakeLabels[this.autoBrakeIndex] };
  }

  // LP Independent / Dynamic Brake
  changeIndependentBrake(delta) {
    this.indBrakeRatio = Math.max(0, Math.min(1, +(this.indBrakeRatio + delta * 0.2).toFixed(2)));
    window.BRSim.AudioEngine.playBrakeHiss(0.22);
    return this.indBrakeRatio;
  }

  // LP Reverser
  changeReverser(delta) {
    if (Math.abs(this.speedKmh) > 1.5 || this.notch > 0) {
      return { ok: false, msg: "Set Throttle to IDLE and Stop Train before shifting Reverser!" };
    }
    this.reverser = Math.max(-1, Math.min(1, this.reverser + delta));
    return { ok: true, reverser: this.reverser };
  }

  // ALP Action [I]: Call Out Upcoming Signal / Caution Order
  alpCallOutSignal() {
    this.alpCalledSignal = true;
    this.signalCalloutPending = true;
    this.signalCalloutTimer = 10.0;
    this.score.signalsCalled++;
    this.score.coopSynergy = Math.min(100, this.score.coopSynergy + 2);
    return {
      bn: `সহকারী লোকো পাইলট (ALP): "সামনে সিগন্যাল ${this.activeSignalAspect} — গতিসীমা ${this.currentSpeedLimitKmh} কিমি/ঘণ্টা!"`,
      en: `ALP Callout: "Signal Ahead ${this.activeSignalAspect} — Sectional Limit ${this.currentSpeedLimitKmh} km/h! LP Acknowledge with [C]!"`
    };
  }

  // LP Action [C]: Acknowledge ALP Callout
  lpAcknowledgeCallout() {
    if (this.alpCalledSignal) {
      this.lpAcknowledgedSignal = true;
      this.signalCalloutPending = false;
      this.alpCalledSignal = false;
      this.score.coopSynergy = Math.min(100, this.score.coopSynergy + 3);
      return {
        ok: true,
        bn: `লোকো পাইলট (LP): "সিগন্যাল ${this.activeSignalAspect} নিশ্চিত করা হলো! লাইন ক্লিয়ার!"`,
        en: `LP Acknowledged: "Copy ${this.activeSignalAspect} aspect & ${this.currentSpeedLimitKmh} km/h limit! Co-Op Synergy +3!"`
      };
    }
    return {
      ok: false,
      bn: `লোকো পাইলট: ভিজিল্যান্স অ্যালার্টার রিসেট করা হয়েছে।`,
      en: `LP Vigilance Alerter Reset. (Wait for ALP to call out Signal with [I] first for Co-Op bonus!)`
    };
  }

  // ALP Action [O]: Snatch / Exchange Neale's Ball Token Hoop at Single-Line Station
  alpAttemptTokenExchange() {
    if (!this.nearTokenStation) {
      return {
        ok: false,
        bn: "এখন কোনো টোকেন বিনিময় স্টেশন কাছাকাছি নেই!",
        en: "No Single-Line Token Station pointsman within arm's reach right now!"
      };
    }
    const st = this.nearTokenStation;
    if (this.tokenExchangeDoneMap[st.id]) {
      return {
        ok: false,
        bn: `${st.bn}-এর টোকেন ইতিমধ্যে গ্রহণ করা হয়েছে!`,
        en: `Neale's Ball Token for ${st.name} already exchanged!`
      };
    }
    if (this.speedKmh < 8) {
      return {
        ok: false,
        bn: "ট্রেনের গতি কম! ১৫–৩০ কিমি/ঘণ্টা গতিতে চলন্ত অবস্থায় অথবা প্ল্যাটফর্মে টোকেন নিন।",
        en: "Advance closer to Pointsman or maintain 12–32 km/h for clean Token Hoop exchange!"
      };
    }
    if (this.speedKmh > 35) {
      this.score.safetyCompliance = Math.max(0, this.score.safetyCompliance - 8);
      window.BRSim.AudioEngine.playTokenSnatchSound(false);
      return {
        ok: false,
        bn: `গতি বেশি (${Math.round(this.speedKmh)} কিমি/ঘণ্টা)! টোকেন হুপ হাত ফসকে পড়ে গেছে! গতি ৩০ কিমি/ঘণ্টার নিচে নামান!`,
        en: `TOO FAST (${Math.round(this.speedKmh)} km/h)! Safe Token Hoop snatch limit is <32 km/h! Slow down & retry!`
      };
    }

    // Success!
    this.tokenExchangeDoneMap[st.id] = true;
    this.hasCurrentSectionToken = true;
    this.tokensExchangedCount++;
    this.score.tokensCaught++;
    this.score.coopSynergy = Math.min(100, this.score.coopSynergy + 6);
    window.BRSim.AudioEngine.playTokenSnatchSound(true);
    return {
      ok: true,
      bn: `চমৎকার! ${st.bn} স্টেশন থেকে চলন্ত অবস্থায় নিলস বল টোকেন হুপ সফলভাবে গৃহীত হয়েছে!`,
      en: `PERFECT CO-OP! ALP snatched Neale's Ball Token Hoop at ${st.name} at ${Math.round(this.speedKmh)} km/h!`
    };
  }

  // ALP Action [P]: Reset Passenger Alarm Chain Pulling (ACP) Clapper Valve
  alpResetAlarmChain() {
    if (!this.alarmChainPulled) {
      return {
        ok: false,
        bn: "সব কোচের এসিপি (ACP) ক্ল্যাপার ভালভ স্বাভাবিক আছে।",
        en: "All coach Alarm Chain Clapper Valves are normal (5.0 kg/cm²)."
      };
    }
    if (this.speedKmh > 3.0) {
      return {
        ok: false,
        bn: "আগে ট্রেন সম্পূর্ণ থামান! চলন্ত ট্রেনে নিচে নেমে এসিপি ভালভ রিসেট করা যাবে না!",
        en: "Bring train to a HALT (<3 km/h) before ALP can step down to reset Coach " + this.acpCoachNumber + " ACP valve!"
      };
    }
    this.alarmChainPulled = false;
    this.targetBrakePipe = 5.0;
    this.autoBrakeIndex = 1;
    this.score.faultsResolved++;
    this.score.coopSynergy = Math.min(100, this.score.coopSynergy + 5);
    window.BRSim.AudioEngine.playBrakeHiss(0.5);
    return {
      ok: true,
      bn: `এএলপি (ALP) কোচ নং ${this.acpCoachNumber}-এর এসিপি ক্ল্যাপার ভালভ রিসেট করেছেন! ব্রেক পাইপ ৫.০ কেজি/সেমি২ চার্জ হচ্ছে।`,
      en: `ALP reset Coach #${this.acpCoachNumber} ACP Clapper Valve! Brake Pipe recharging to 5.0 kg/cm².`
    };
  }

  // ALP Action [K]: Engine Room — Reset Ground Relay (GR) & Open Radiator Louvers
  alpInspectEngineRoom() {
    let actions = [];
    if (this.groundRelayTripped) {
      if (this.notch > 1) {
        return {
          ok: false,
          bn: "গ্রাউন্ড রিলে (GR) রিসেট করার আগে লোকো পাইলটকে থ্রটল IDLE/Notch 1-এ নামাতে বলুন!",
          en: "LP must drop Throttle to IDLE before ALP can safely reset the High-Voltage Ground Relay!"
        };
      }
      this.groundRelayTripped = false;
      this.score.faultsResolved++;
      actions.push("Ground Relay (GR) Reset");
    }
    this.radiatorLouversOpen = !this.radiatorLouversOpen;
    if (this.waterTempC > 82) {
      this.waterTempC = Math.max(74, this.waterTempC - 9);
      this.score.faultsResolved++;
      actions.push("Radiator Louvers Opened & Coolant Flushed (-9°C)");
    } else {
      actions.push(this.radiatorLouversOpen ? "Radiator Louvers Opened" : "Radiator Louvers Set to Auto");
    }

    return {
      ok: true,
      bn: `ইঞ্জিন রুম পরিদর্শন সম্পন্ন: ${actions.join(", ")} (তাপমাত্রা: ${Math.round(this.waterTempC)}°C)`,
      en: `ALP Engine Room Action: ${actions.join(" | ")} (Coolant: ${Math.round(this.waterTempC)}°C)`
    };
  }

  // Main Physics & Operational Step (called at 60Hz)
  update(dt, weatherMode, onEventCallback) {
    if (this.routeCompleted) return;

    // 1. Update Prime Mover RPM & Electrical Load
    const targetRpm = 315 + this.notch * 73.6; // 315 RPM (Idle) to 904 RPM (Notch 8)
    this.rpm += (targetRpm - this.rpm) * Math.min(1, dt * 1.8);

    // 2. Update Pneumatic Brake Pipe (BP) & Brake Cylinder (BC) Pressures
    if (this.alarmChainPulled) {
      // Passenger pulled chain: BP vents to 2.2 kg/cm²!
      this.targetBrakePipe = 2.2;
    }
    const bpRate = this.targetBrakePipe > this.brakePipePressure ? 0.85 : 1.65;
    this.brakePipePressure += (this.targetBrakePipe - this.brakePipePressure) * Math.min(1, dt * bpRate);

    // Train Brake Cylinder pressure is inversely proportional to BP drop below 5.0 kg/cm²
    const bpDrop = Math.max(0, 5.0 - this.brakePipePressure);
    const targetTrainBC = Math.min(3.8, bpDrop * 1.95);
    this.brakeCylinderPressure += (targetTrainBC - this.brakeCylinderPressure) * Math.min(1, dt * 1.4);

    // Independent locomotive brake cylinder
    const targetLocoBC = Math.max(this.brakeCylinderPressure, this.indBrakeRatio * 3.5);
    this.locoBrakeCylinder += (targetLocoBC - this.locoBrakeCylinder) * Math.min(1, dt * 3.0);

    // Main reservoir compressor cycling
    if (this.brakePipePressure > 4.8) {
      this.mainReservoirPressure = Math.min(9.5, this.mainReservoirPressure + dt * 0.15);
    } else {
      this.mainReservoirPressure = Math.max(7.8, this.mainReservoirPressure - dt * 0.08);
    }

    // 3. Evaluate Track Context (Bridges, Gradients, Level Crossings, Signals, Stations)
    this._evaluateTrackEnvironment(dt, weatherMode, onEventCallback);

    // 4. Calculate Tractive Effort, Adhesion Limit, & Wheel Slip
    let maxTE_kN = this.loco.maxTractiveEffortKN;
    const throttleRatio = Math.pow(this.notch / 8, 1.25);

    // Back-EMF power curve above 25 km/h
    const speedFactor = 1.0 / (1.0 + Math.max(0, this.speedKmh - 22) * 0.022);
    let appliedTE_kN = 0;

    if (!this.groundRelayTripped && this.reverser !== 0 && this.notch > 0) {
      appliedTE_kN = maxTE_kN * throttleRatio * speedFactor * this.reverser;
    }

    // Adhesion limit calculation (Monsoon rain & Srimangal wet tea leaves reduce grip!)
    let adhesionCoeff = 0.33;
    if (weatherMode === "monsoon_rain") adhesionCoeff = 0.21;
    else if (weatherMode === "winter_fog") adhesionCoeff = 0.26;
    if (this.currentGradientPct > 0.5) adhesionCoeff -= 0.04; // Slippery hill foliage
    if (this.sanderActive) adhesionCoeff += 0.12; // Pneumatic sand restores grip!

    const maxAdhesiveTE_kN = this.loco.massTons * 9.81 * adhesionCoeff;
    if (Math.abs(appliedTE_kN) > maxAdhesiveTE_kN && this.notch >= 5) {
      this.wheelSlip = true;
      appliedTE_kN *= 0.42; // Dramatic loss of traction during wheel slip
    } else {
      this.wheelSlip = false;
    }

    // Ammeter reading
    const targetAmps = this.groundRelayTripped
      ? 0
      : (Math.abs(appliedTE_kN) / maxTE_kN) * 1050 + (this.wheelSlip ? Math.sin(Date.now() * 0.04) * 180 : 0);
    this.amps += (targetAmps - this.amps) * Math.min(1, dt * 4.0);

    // 5. Engine Water Temperature & Ground Relay Fault Simulation
    const heatLoad = (this.notch / 8) * (this.currentGradientPct > 0.4 ? 1.45 : 1.0);
    const coolingFactor = this.radiatorLouversOpen ? 1.35 : 0.95;
    const ambientTarget = 71 + heatLoad * 27 - (this.radiatorLouversOpen ? 6 : 0);
    this.waterTempC += (ambientTarget - this.waterTempC) * dt * 0.045 * coolingFactor;

    if (this.waterTempC > 94.5 && !this.groundRelayTripped && Math.random() < dt * 0.12) {
      this.groundRelayTripped = true;
      window.BRSim.AudioEngine.playCabAlertBeep(true);
      if (onEventCallback) {
        onEventCallback({
          type: "fault_gr",
          bn: "সতর্কতা! অতিরিক্ত তাপে গ্রাউন্ড রিলে (GR) ট্রিপ করেছে! এএলপি [K] চেপে ইঞ্জিন রুম রিসেট করুন!",
          en: "ENGINE FAULT! High coolant temp tripped Ground Relay (GR)! LP set IDLE & ALP press [K] to reset!"
        });
      }
    }

    // 6. Total Mass, Braking Force, Rolling Resistance, & Gradient Gravity
    const coachMassTons = this.route.coachCount * 42;
    const totalMassTons = this.loco.massTons + coachMassTons;

    // Braking effort from train BC + loco BC + dynamic brake
    const trainBrakeForce_kN = (this.brakeCylinderPressure / 3.8) * (coachMassTons * 1.15);
    const locoBrakeForce_kN = (this.locoBrakeCylinder / 3.5) * (this.loco.massTons * 1.35);
    const dynBrakeForce_kN = (this.dynamicBrakeLevel / 8) * 145 * (this.speedKmh > 8 ? 1 : this.speedKmh / 8);
    const totalBraking_kN = trainBrakeForce_kN + locoBrakeForce_kN + dynBrakeForce_kN;

    // Davis Rolling Resistance + Aerodynamic Drag
    const rollingRes_kN = totalMassTons * (0.015 + 0.00012 * Math.pow(this.speedKmh, 1.8));

    // Grade Gravity Force (sin(theta) approx gradientPct / 100)
    const gradeForce_kN = totalMassTons * 9.81 * (this.currentGradientPct / 100);

    // Net Force & Acceleration
    const dirSign = this.speedKmh >= 0 ? 1 : -1;
    let netForce_kN = appliedTE_kN - gradeForce_kN;

    if (Math.abs(this.speedKmh) > 0.08) {
      netForce_kN -= dirSign * (totalBraking_kN + rollingRes_kN);
    } else {
      // Static holding check
      if (Math.abs(netForce_kN) <= totalBraking_kN + rollingRes_kN) {
        netForce_kN = 0;
        this.speedKmh = 0;
      }
    }

    const prevAccel = this.accelerationMps2;
    // Scale longitudinal dynamics by 3.6x so a 14-16 coach train reaches 70 km/h in ~16s for engaging gameplay
    this.accelerationMps2 = (netForce_kN / totalMassTons) * 3.6;

    // Coupler Jerk / Smoothness monitoring
    const jerk = Math.abs(this.accelerationMps2 - prevAccel) / Math.max(0.016, dt);
    this.couplerSlackStress = Math.min(100, Math.round(jerk * 8 + (this.brakeCylinderPressure > 3.2 ? 35 : 0)));

    this.speedKmh += this.accelerationMps2 * 3.6 * dt;
    if (this.speedKmh < 0 && this.reverser >= 0) this.speedKmh = 0;
    if (this.speedKmh > this.loco.maxSpeedKmh + 8) this.speedKmh = this.loco.maxSpeedKmh + 8;

    // Advance train along route (scaled 2.2x so stations & landmarks arrive at an exciting pace)
    this.distanceKm += (this.speedKmh / 3600) * dt * 2.2;
    if (this.distanceKm < 0) this.distanceKm = 0;

    // Optional AI ALP Co-Pilot Helper (when playing solo with AI ALP enabled)
    if (this.aiAlpAssist) {
      this._runAiAlpHelper(onEventCallback);
    }
  }

  _evaluateTrackEnvironment(dt, weatherMode, onEventCallback) {
    const d = this.distanceKm;
    let limit = 95;
    let grad = 0.0;
    let activeBridge = null;
    let activeCrossing = null;

    // Check Route Events (Bridges, Level Crossings, Steep Gradients, ACP Zones)
    for (const ev of this.route.events) {
      if (ev.type === "bridge") {
        if (d >= ev.km - 0.15 && d <= ev.km + (ev.lengthKm || 0.8)) {
          activeBridge = ev;
          limit = Math.min(limit, ev.speedLimit || 60);
        }
      } else if (ev.type === "steep_gradient") {
        if (d >= ev.km && d <= ev.km + (ev.lengthKm || 1.2)) {
          grad = ev.gradientPct || 1.0;
          limit = Math.min(limit, ev.speedLimit || 50);
        }
      } else if (ev.type === "level_crossing") {
        const distToGate = ev.km - d;
        if (distToGate >= -0.08 && distToGate <= 0.45) {
          activeCrossing = ev;
          limit = Math.min(limit, ev.speedLimit || 70);
          // Trigger encroaching CNG / Rickshaw hazard when approaching within 320m
          if (distToGate > 0.05 && distToGate < 0.35 && !this.triggeredEventsMap[ev.name]) {
            this.triggeredEventsMap[ev.name] = true;
            this.encroachingHazardActive = true;
            if (onEventCallback) {
              onEventCallback({
                type: "crossing_hazard",
                bn: `সতর্কতা! ${ev.name}-এ সিএনজি ও রিকশা লাইনের ওপর! দ্রুত হর্ন [SPACE] বাজান!`,
                en: `RAIL GATE HAZARD! CNG & Rickshaws encroaching at ${ev.name}! Blow Horn [SPACE] to clear tracks!`
              });
            }
          }
          // If horn is blown while approaching, clear the encroaching vehicles!
          if (this.hornActive && this.encroachingHazardActive) {
            this.encroachingHazardActive = false;
            this.score.hazardsCleared++;
            this.score.safetyCompliance = Math.min(100, this.score.safetyCompliance + 2);
            if (onEventCallback) {
              onEventCallback({
                type: "crossing_cleared",
                bn: `হর্ন শুনে রিকশা ও সিএনজি রেললাইন থেকে সরে গেছে! নিরাপদ ক্রসিং!`,
                en: `Horn blast cleared encroaching CNGs & Rickshaws at ${ev.name}! Safe passage!`
              });
            }
          }
          // If train passes gate with hazard still active, apply safety penalty
          if (distToGate <= 0.01 && this.encroachingHazardActive) {
            this.encroachingHazardActive = false;
            this.score.safetyCompliance = Math.max(0, this.score.safetyCompliance - 12);
            if (onEventCallback) {
              onEventCallback({
                type: "crossing_near_miss",
                bn: `বিপজ্জনক নিয়ার-মিস! লেভেল ক্রসিংয়ে হর্ন না বাজানোয় রিকশার সাথে সংঘর্ষের ঝুঁকি হয়েছিল! (-১২ নিরাপত্তা)`,
                en: `NEAR MISS at ${ev.name}! Always sound Horn [SPACE] before Bangladeshi Rail Gates! (-12 Safety)`
              });
            }
          }
        }
      } else if (ev.type === "acp_zone") {
        if (Math.abs(d - ev.km) < 0.08 && !this.triggeredEventsMap[ev.name] && this.speedKmh > 25) {
          this.triggeredEventsMap[ev.name] = true;
          this.alarmChainPulled = true;
          this.acpCoachNumber = Math.floor(Math.random() * this.route.coachCount) + 1;
          window.BRSim.AudioEngine.playCabAlertBeep(true);
          window.BRSim.AudioEngine.playBrakeHiss(0.7);
          if (onEventCallback) {
            onEventCallback({
              type: "acp_pull",
              bn: `জরুরি বার্তা! কোচ নং ${this.acpCoachNumber}-এ যাত্রীরা অ্যালার্ম চেইন টেনেছে (ACP)! ট্রেন থামিয়ে এএলপি [P] চেপে ভালভ রিসেট করুন!`,
              en: `ALARM CHAIN PULLED (ACP) in Coach #${this.acpCoachNumber}! BP pressure dropping! Stop train & ALP press [P] to reset!`
            });
          }
        }
      }
    }

    this.onBridge = activeBridge;
    this.nearLevelCrossing = activeCrossing;
    this.currentGradientPct = grad;

    // Check Stations (Stopping Platforms & Single-Line Token Exchanges)
    let nextStation = null;
    this.nearTokenStation = null;
    this.atStation = null;

    for (let i = 0; i < this.route.stations.length; i++) {
      const st = this.route.stations[i];
      const distKm = st.km - d;

      if (distKm >= -0.18 && !this.stationStopDoneMap[i]) {
        if (!nextStation) nextStation = { station: st, index: i, distKm };
      }

      // Token exchange zone: within ±180 meters of a token station
      if (st.tokenExchange && Math.abs(distKm) <= 0.20) {
        this.nearTokenStation = st;
        limit = Math.min(limit, 30); // Token exchange speed limit
      }

      // Station platform stopping zone: within ±150 meters
      if (Math.abs(distKm) <= 0.16) {
        this.atStation = st;
        if (st.stopRequired && !this.stationStopDoneMap[i]) {
          limit = Math.min(limit, 35);
          // Check if train has stopped at platform
          if (Math.abs(this.speedKmh) < 1.2) {
            this.isBoarding = true;
            this.boardingProgress = Math.min(100, (this.boardingProgress || 0) + dt * 28);
            if (this.boardingProgress >= 100) {
              this.stationStopDoneMap[i] = true;
              this.isBoarding = false;
              this.score.punctuality = Math.min(100, this.score.punctuality + 4);
              window.BRSim.AudioEngine.playTokenSnatchSound(true);

              if (i === this.route.stations.length - 1) {
                this.routeCompleted = true;
                if (onEventCallback) {
                  onEventCallback({
                    type: "route_complete",
                    bn: `অভিনন্দন! ট্রেন সফলভাবে গন্তব্য ${st.bn} স্টেশনে পৌঁছেছে!`,
                    en: `DESTINATION REACHED! Welcome to ${st.name}! Duty Roster Complete!`
                  });
                }
              } else if (onEventCallback) {
                onEventCallback({
                  type: "station_depart",
                  bn: `${st.bn}: যাত্রী ওঠানামা সম্পন্ন! গার্ড সবুজ পতাকা দেখিয়েছেন—লাইন ক্লিয়ার!`,
                  en: `${st.name}: Passenger boarding complete! Guard shows Green Flag — Line Clear to depart!`
                });
              }
            }
          }
        }
      }
    }

    // Determine Signal Aspect based on upcoming station or hazard
    if (this.alarmChainPulled || this.groundRelayTripped) {
      this.activeSignalAspect = "RED";
    } else if (nextStation && nextStation.distKm < 0.75 && nextStation.station.stopRequired) {
      this.activeSignalAspect = "YELLOW";
      limit = Math.min(limit, 45);
    } else if (this.nearTokenStation && !this.tokenExchangeDoneMap[this.nearTokenStation.id]) {
      this.activeSignalAspect = "DOUBLE_YELLOW";
    } else if (activeBridge || activeCrossing) {
      this.activeSignalAspect = "DOUBLE_YELLOW";
    } else {
      this.activeSignalAspect = "GREEN";
    }

    this.currentSpeedLimitKmh = limit;

    // Overspeed penalty check
    if (this.speedKmh > this.currentSpeedLimitKmh + 8) {
      this.score.safetyCompliance = Math.max(0, +(this.score.safetyCompliance - dt * 1.2).toFixed(1));
    }
  }

  _runAiAlpHelper(onEventCallback) {
    // Automatically handles ALP duties if player enabled AI Co-Pilot
    if (this.nearTokenStation && !this.tokenExchangeDoneMap[this.nearTokenStation.id] && this.speedKmh >= 10 && this.speedKmh <= 34) {
      const res = this.alpAttemptTokenExchange();
      if (res.ok && onEventCallback) onEventCallback({ type: "ai_alp", bn: res.bn, en: res.en });
    }
    if (this.alarmChainPulled && this.speedKmh < 2.0) {
      const res = this.alpResetAlarmChain();
      if (res.ok && onEventCallback) onEventCallback({ type: "ai_alp", bn: res.bn, en: res.en });
    }
    if (this.groundRelayTripped && this.notch <= 1) {
      const res = this.alpInspectEngineRoom();
      if (res.ok && onEventCallback) onEventCallback({ type: "ai_alp", bn: res.bn, en: res.en });
    }
  }

  getNextStationInfo() {
    for (let i = 0; i < this.route.stations.length; i++) {
      const st = this.route.stations[i];
      if (!this.stationStopDoneMap[i] && st.km >= this.distanceKm - 0.15) {
        return {
          station: st,
          distanceRemainingKm: Math.max(0, st.km - this.distanceKm),
          index: i
        };
      }
    }
    const last = this.route.stations[this.route.stations.length - 1];
    return { station: last, distanceRemainingKm: Math.max(0, last.km - this.distanceKm), index: this.route.stations.length - 1 };
  }
}

window.BRSim.Physics = new TrainPhysicsAndCoopState();
