// ============================================================================
// TRACKS OF BENGAL: BANGLADESH RAILWAY CO-OP SIMULATOR
// Module: renderer3D.js — Studio-Grade Animated Train, Parallax Bengal World & 3D Cab
// ============================================================================

window.BRSim = window.BRSim || {};

class BangladeshRailwayStudioRenderer {
  constructor() {
    // Camera Modes:
    // "STUDIO_DUAL" (Animated Exterior Train + 3D Driver Windshield PiP)
    // "EXTERIOR_CINEMATIC" (Full Widescreen Animated Train & Bangladeshi Scenery)
    // "CAB_FIRST_PERSON" (Full First-Person 3D Driver Cab Interior)
    // "ALP_TOKEN_WINDOW" (Close-up ALP Doorway Token Snatch & Coach Inspection)
    this.cameraMode = "STUDIO_DUAL";
    this.weatherMode = "clear_sunset";

    this.wheelAngle = 0;
    this.wiperAngle = 0;
    this.wiperDir = 1;
    this.fanAngle = 0;
    this.timeSec = 0;

    // Particle Systems
    this.exhaustParticles = [];
    this.sparkParticles = [];
    this.sandParticles = [];
    this.hornWaveRings = [];
    this.rainDrops = [];
    this.birds = [];
    this.clouds = [];

    this._initEnvironmentParticles();
  }

  _initEnvironmentParticles() {
    for (let i = 0; i < 110; i++) {
      this.rainDrops.push({
        x: Math.random(),
        y: Math.random(),
        len: 14 + Math.random() * 20,
        speed: 0.8 + Math.random() * 0.6
      });
    }
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: i * 0.14,
        y: 0.06 + (i % 3) * 0.06,
        scale: 0.7 + (i % 4) * 0.25,
        speed: 0.004 + (i % 3) * 0.002
      });
    }
    // Flock of white Bangladeshi Egrets (Bok)
    for (let i = 0; i < 9; i++) {
      this.birds.push({
        x: 0.2 + i * 0.025,
        y: 0.14 + Math.abs(i - 4) * 0.015,
        wingPhase: i * 0.6
      });
    }
  }

  cycleCamera() {
    const modes = ["STUDIO_DUAL", "EXTERIOR_CINEMATIC", "CAB_FIRST_PERSON", "ALP_TOKEN_WINDOW"];
    const idx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.cameraMode = modes[idx];
    return this.cameraMode;
  }

  setWeather(mode) {
    this.weatherMode = mode;
  }

  render(canvas, physics, dt) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    this.timeSec += dt;
    const speedMps = (physics.speedKmh || 0) / 3.6;

    // Advance wheel rotation angle (exact kinematics: v = omega * r, wheel radius = 0.52m)
    this.wheelAngle = (this.wheelAngle + (speedMps / 0.52) * dt) % (Math.PI * 2);
    this.fanAngle = (this.fanAngle + dt * 12) % (Math.PI * 2);

    if (physics.wipersOn) {
      this.wiperAngle += this.wiperDir * dt * 2.9;
      if (this.wiperAngle > 1.0) {
        this.wiperAngle = 1.0;
        this.wiperDir = -1;
      } else if (this.wiperAngle < -1.0) {
        this.wiperAngle = -1.0;
        this.wiperDir = 1;
      }
    } else {
      this.wiperAngle *= 0.9;
    }

    const speedRatio = Math.min(1.5, Math.abs(physics.speedKmh) / 85);
    const swayX = Math.sin(this.timeSec * 8.5) * 2.5 * speedRatio + (physics.wheelSlip ? (Math.random() - 0.5) * 5 : 0);
    const swayY = Math.abs(Math.cos(this.timeSec * 14.0)) * 2.0 * speedRatio;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    if (this.cameraMode === "CAB_FIRST_PERSON") {
      this._render3DWorldOutWindow(ctx, w, h, physics, dt, swayX, swayY);
      this._renderCabInteriorOverlay(ctx, w, h, physics, dt, swayX, swayY);
    } else if (this.cameraMode === "ALP_TOKEN_WINDOW") {
      this._renderAlpWindowView(ctx, w, h, physics, dt, swayX, swayY);
    } else {
      // STUDIO_DUAL or EXTERIOR_CINEMATIC:
      // Render the rich multi-layer parallax Bangladeshi landscape + High-Detail Animated Train!
      this._renderAnimatedParallaxScene(ctx, w, h, physics, dt);

      // In STUDIO_DUAL mode, also render a live 3D Driver Forward Track View PiP Monitor in bottom-right!
      if (this.cameraMode === "STUDIO_DUAL") {
        this._renderForwardCabPiP(ctx, w, h, physics, dt, swayX, swayY);
      }
    }

    ctx.restore();
  }

  // ==========================================================================
  // PART A: MULTI-LAYER PARALLAX BANGLADESHI WORLD & ANIMATED TRAIN SHOWCASE
  // ==========================================================================
  _renderAnimatedParallaxScene(ctx, w, h, physics, dt) {
    const dKm = physics.distanceKm;
    const speedMps = physics.speedKmh / 3.6;
    const trackSurfaceY = h * 0.77;
    const horizonY = h * 0.52;

    // 1. SKY, SUN/MOON, VOLUMETRIC CLOUDS & FLYING WHITE EGRETS (BOK)
    this._drawSkyAndClouds(ctx, w, h, horizonY, dt, speedMps);

    // 2. FAR HORIZON LAYER (Parallax 0.08x): Tea Hills, Dhaka/Ctg Skyline, Brick Kilns, Mosques
    this._drawFarHorizonParallax(ctx, w, horizonY, dKm, physics);

    // 3. MIDGROUND VILLAGE & RIVER LAYER (Parallax 0.30x): Paddy Fields, Mustard, Haor Boats, Palms
    this._drawMidgroundBengalLife(ctx, w, h, horizonY, trackSurfaceY, dKm, physics);

    // 4. BACKGROUND STATION ARCHITECTURES & LEVEL CROSSINGS (World-Synced 1.0x)
    this._drawWorldStationsAndCrossingsBehindTrain(ctx, w, h, trackSurfaceY, dKm, physics);

    // 5. DETAILED TRACK EMBANKMENT, BALLAST, SLEEPERS & MULTI-GAUGE RAILS
    this._drawSideTrackBed(ctx, w, h, trackSurfaceY, dKm, physics);

    // 6. STUDIO-GRADE ANIMATED LOCOMOTIVE & PASSENGER COACH CONSIST
    this._drawProfessionalAnimatedTrain(ctx, w, h, trackSurfaceY, physics, dt);

    // 7. FOREGROUND BRIDGE TRUSSES (Padma Lower Deck, Hardinge Crimson Truss, Bhairab, Jamuna)
    this._drawForegroundBridgeAndPlatformElements(ctx, w, h, trackSurfaceY, dKm, physics);

    // 8. WEATHER OVERLAY (Monsoon Rain Deluge, Lightning, or Winter Kuasha Fog)
    this._drawWeatherEffects(ctx, w, h, horizonY, physics, dt);
  }

  _drawSkyAndClouds(ctx, w, h, horizonY, dt, speedMps) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (this.weatherMode === "clear_sunset") {
      skyGrad.addColorStop(0, "#0f172a");
      skyGrad.addColorStop(0.32, "#4c1d95");
      skyGrad.addColorStop(0.65, "#c2410c");
      skyGrad.addColorStop(0.88, "#f97316");
      skyGrad.addColorStop(1, "#fde047");
    } else if (this.weatherMode === "monsoon_rain") {
      skyGrad.addColorStop(0, "#090d16");
      skyGrad.addColorStop(0.5, "#1e293b");
      skyGrad.addColorStop(1, "#475569");
    } else if (this.weatherMode === "winter_fog") {
      skyGrad.addColorStop(0, "#475569");
      skyGrad.addColorStop(0.6, "#94a3b8");
      skyGrad.addColorStop(1, "#e2e8f0");
    } else if (this.weatherMode === "night_express") {
      skyGrad.addColorStop(0, "#020617");
      skyGrad.addColorStop(0.55, "#0f172a");
      skyGrad.addColorStop(1, "#1e1b4b");
    } else {
      skyGrad.addColorStop(0, "#0369a1");
      skyGrad.addColorStop(0.6, "#0ea5e9");
      skyGrad.addColorStop(1, "#bae6fd");
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY + 10);

    // Glowing Sun or Night Stars + Crescent Moon
    if (this.weatherMode === "clear_sunset" || this.weatherMode === "clear_day") {
      const sunX = w * 0.72;
      const sunY = this.weatherMode === "clear_sunset" ? horizonY - 48 : h * 0.14;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 110);
      sunGlow.addColorStop(0, "#ffffff");
      sunGlow.addColorStop(0.25, "#fde047");
      sunGlow.addColorStop(0.6, "rgba(251, 146, 60, 0.35)");
      sunGlow.addColorStop(1, "rgba(251, 146, 60, 0)");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.weatherMode === "night_express") {
      ctx.fillStyle = "#fef9c3";
      for (let s = 0; s < 45; s++) {
        const sx = ((s * 197) % w);
        const sy = ((s * 89) % (horizonY * 0.8));
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(this.timeSec * 2 + s));
        ctx.globalAlpha = twinkle;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.globalAlpha = 1.0;
      // Crescent Moon
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(w * 0.82, h * 0.12, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#04091a";
      ctx.beginPath();
      ctx.arc(w * 0.82 - 7, h * 0.12 - 4, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Animated Clouds
    ctx.save();
    this.clouds.forEach((c) => {
      c.x -= (c.speed + speedMps * 0.00018) * dt;
      if (c.x < -0.2) c.x = 1.15;
      const cx = c.x * w;
      const cy = c.y * h;
      const r = 28 * c.scale;

      ctx.fillStyle =
        this.weatherMode === "clear_sunset"
          ? "rgba(253, 186, 116, 0.28)"
          : this.weatherMode === "monsoon_rain"
          ? "rgba(51, 65, 85, 0.65)"
          : "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.8, cy - r * 0.2, r * 0.85, 0, Math.PI * 2);
      ctx.arc(cx + r * 1.6, cy + r * 0.05, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Animated Flock of White Bangladeshi Egrets (Bok) flying across the sky
    if (this.weatherMode !== "night_express") {
      ctx.save();
      ctx.strokeStyle = this.weatherMode === "clear_sunset" ? "#fef3c7" : "#f8fafc";
      ctx.lineWidth = 1.8;
      this.birds.forEach((b) => {
        b.x -= (0.015 + speedMps * 0.0003) * dt;
        if (b.x < -0.05) b.x = 1.08;
        const bx = b.x * w;
        const by = b.y * h + Math.sin(this.timeSec * 3 + b.wingPhase) * 3;
        const wingY = Math.sin(this.timeSec * 9 + b.wingPhase) * 6;

        ctx.beginPath();
        ctx.moveTo(bx - 7, by - wingY);
        ctx.quadraticCurveTo(bx - 3, by - 3, bx, by);
        ctx.quadraticCurveTo(bx + 3, by - 3, bx + 7, by - wingY);
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  _drawFarHorizonParallax(ctx, w, horizonY, dKm, physics) {
    ctx.save();
    const scrollPx = (dKm * 180) % w;
    const isNight = this.weatherMode === "night_express";
    const routeId = physics.route.id;

    // 1. Distant Mountain / Tea Hill Range (Sylhet & Panchagarh) or Distant Tree Silhouette
    ctx.fillStyle = isNight ? "#09101d" : this.weatherMode === "clear_sunset" ? "#2e1065" : "#064e3b";
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let x = 0; x <= w; x += 20) {
      const worldX = x + dKm * 140;
      const hillAmp = routeId === "sylhet_parabat_hills" || routeId === "hardinge_panchagarh" ? 42 : 16;
      const hy =
        horizonY -
        12 -
        Math.abs(Math.sin(worldX * 0.005)) * hillAmp -
        Math.abs(Math.cos(worldX * 0.013)) * (hillAmp * 0.5);
      ctx.lineTo(x, hy);
    }
    ctx.lineTo(w, horizonY);
    ctx.closePath();
    ctx.fill();

    // 2. Repeating Far Landmarks: Brick Kilns (Itt-Bhatta), Village Mosque Domes & Minarets, Power Pylons
    for (let tile = -1; tile <= 2; tile++) {
      const baseX = tile * 550 - (scrollPx % 550);

      // A. Traditional Bangladeshi Red Brick Kiln (Itt-Bhatta) with tall chimney & curling smoke
      const kilnX = baseX + 120;
      ctx.fillStyle = isNight ? "#1e1b4b" : "#7f1d1d";
      ctx.fillRect(kilnX - 24, horizonY - 14, 48, 14);
      ctx.beginPath();
      ctx.moveTo(kilnX - 7, horizonY - 14);
      ctx.lineTo(kilnX - 3, horizonY - 72);
      ctx.lineTo(kilnX + 3, horizonY - 72);
      ctx.lineTo(kilnX + 7, horizonY - 14);
      ctx.closePath();
      ctx.fill();

      // Kiln smoke puffs
      ctx.fillStyle = isNight ? "rgba(148, 163, 184, 0.18)" : "rgba(241, 245, 249, 0.42)";
      for (let p = 1; p <= 5; p++) {
        const puffX = kilnX - p * 11 - Math.sin(this.timeSec * 2 + p) * 4;
        const puffY = horizonY - 72 - p * 8;
        ctx.beginPath();
        ctx.arc(puffX, puffY, 4 + p * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // B. Village Mosque Silhouette with Three Domes & Twin Minarets
      const mosqX = baseX + 340;
      ctx.fillStyle = isNight ? "#0f172a" : "#115e59";
      ctx.fillRect(mosqX - 28, horizonY - 22, 56, 22);
      // Central & side domes
      ctx.beginPath();
      ctx.arc(mosqX, horizonY - 22, 13, Math.PI, 0);
      ctx.arc(mosqX - 18, horizonY - 22, 8, Math.PI, 0);
      ctx.arc(mosqX + 18, horizonY - 22, 8, Math.PI, 0);
      ctx.fill();
      // Minarets
      ctx.fillRect(mosqX - 33, horizonY - 46, 5, 46);
      ctx.fillRect(mosqX + 28, horizonY - 46, 5, 46);

      // C. High-Voltage Lattice Transmission Tower
      const pylonX = baseX + 470;
      ctx.strokeStyle = isNight ? "rgba(71, 85, 105, 0.4)" : "rgba(51, 65, 85, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pylonX - 10, horizonY);
      ctx.lineTo(pylonX, horizonY - 58);
      ctx.lineTo(pylonX + 10, horizonY);
      ctx.moveTo(pylonX - 14, horizonY - 42);
      ctx.lineTo(pylonX + 14, horizonY - 42);
      ctx.moveTo(pylonX - 11, horizonY - 26);
      ctx.lineTo(pylonX + 11, horizonY - 26);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawMidgroundBengalLife(ctx, w, h, horizonY, trackSurfaceY, dKm, physics) {
    ctx.save();
    const isNight = this.weatherMode === "night_express";
    const routeId = physics.route.id;
    const isRiverOrHaor = routeId === "haor_mohanganj" || Boolean(physics.onBridge);

    // 1. Midground Terrain Base (Emerald Rice Paddies, Mustard Fields, or River/Haor Water)
    const midGrad = ctx.createLinearGradient(0, horizonY, 0, trackSurfaceY);
    if (isRiverOrHaor) {
      midGrad.addColorStop(0, isNight ? "#082f49" : "#0284c7");
      midGrad.addColorStop(0.5, isNight ? "#0c4a6e" : "#0369a1");
      midGrad.addColorStop(1, isNight ? "#041e30" : "#075985");
    } else {
      midGrad.addColorStop(0, isNight ? "#052e16" : "#15803d");
      midGrad.addColorStop(0.45, isNight ? "#064e3b" : "#16a34a");
      midGrad.addColorStop(1, isNight ? "#022c22" : "#14532d");
    }
    ctx.fillStyle = midGrad;
    ctx.fillRect(0, horizonY, w, trackSurfaceY - horizonY);

    const midScroll = (dKm * 580) % 700;

    for (let tile = -1; tile <= 2; tile++) {
      const bx = tile * 700 - midScroll;

      if (isRiverOrHaor) {
        // Shimmering River Waves
        ctx.strokeStyle = isNight ? "rgba(56, 189, 248, 0.2)" : "rgba(224, 242, 254, 0.45)";
        ctx.lineWidth = 1.5;
        for (let wy = horizonY + 14; wy < trackSurfaceY - 12; wy += 16) {
          ctx.beginPath();
          ctx.moveTo(bx + (wy % 40), wy);
          ctx.lineTo(bx + (wy % 40) + 55, wy);
          ctx.stroke();
        }

        // Traditional Bangladeshi Wooden Country Boat (Nouka) with Colorful Sail
        const boatX = bx + 220 + Math.sin(this.timeSec * 1.5 + tile) * 10;
        const boatY = horizonY + 52;
        ctx.fillStyle = "#451a03";
        ctx.beginPath();
        ctx.moveTo(boatX - 38, boatY);
        ctx.quadraticCurveTo(boatX, boatY + 14, boatX + 38, boatY);
        ctx.lineTo(boatX + 28, boatY - 3);
        ctx.lineTo(boatX - 28, boatY - 3);
        ctx.closePath();
        ctx.fill();

        // Bamboo Cabin (Chhoi) & Red/Orange Sail
        ctx.fillStyle = "#a16207";
        ctx.beginPath();
        ctx.arc(boatX + 4, boatY - 3, 14, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#ea580c";
        ctx.beginPath();
        ctx.moveTo(boatX - 8, boatY - 6);
        ctx.lineTo(boatX - 8, boatY - 42);
        ctx.lineTo(boatX - 30, boatY - 12);
        ctx.closePath();
        ctx.fill();

        // Double-Deck Bangladeshi River Launch (Sadarghat/Chandpur Steamer) in distance
        const launchX = bx + 540;
        const launchY = horizonY + 26;
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(launchX - 42, launchY - 18, 84, 18);
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(launchX - 44, launchY - 6, 88, 6);
        ctx.fillStyle = "#fef08a";
        for (let lw = -34; lw <= 30; lw += 10) {
          ctx.fillRect(launchX + lw, launchY - 14, 6, 4);
        }
      } else {
        // Yellow Mustard Field Strip (Sorisha Khet) & Paddy Dykes (Ail)
        ctx.fillStyle = isNight ? "rgba(161, 98, 7, 0.35)" : "#eab308";
        ctx.fillRect(bx + 40, horizonY + 22, 230, 26);

        // Rural Bangladeshi Corrugated Tin-Roof Homestead (Tiner Ghar) under Coconut & Banana Trees
        const houseX = bx + 330;
        const houseY = horizonY + 46;
        ctx.fillStyle = isNight ? "#1e293b" : "#9a3412"; // Mud/brick plinth
        ctx.fillRect(houseX - 26, houseY + 12, 52, 8);
        ctx.fillStyle = isNight ? "#334155" : "#cbd5e1"; // Corrugated tin walls
        ctx.fillRect(houseX - 24, houseY - 8, 48, 20);
        ctx.fillStyle = isNight ? "#475569" : "#dc2626"; // Pitched tin roof
        ctx.beginPath();
        ctx.moveTo(houseX - 30, houseY - 8);
        ctx.lineTo(houseX, houseY - 22);
        ctx.lineTo(houseX + 30, houseY - 8);
        ctx.closePath();
        ctx.fill();
        if (isNight) {
          // Warm glowing lantern window
          ctx.fillStyle = "#fde047";
          ctx.fillRect(houseX - 6, houseY - 3, 10, 8);
        }

        // Detailed Coconut Palm & Banana Trees
        this._drawDetailedPalmTree(ctx, bx + 160, horizonY + 58, 0.9, isNight);
        this._drawDetailedPalmTree(ctx, bx + 385, horizonY + 54, 1.05, isNight);
        this._drawDetailedPalmTree(ctx, bx + 610, horizonY + 62, 0.85, isNight);

        // Srimangal Tea Garden Terraces if on Sylhet route
        if (routeId === "sylhet_parabat_hills") {
          ctx.fillStyle = isNight ? "#064e3b" : "#15803d";
          for (let bush = 0; bush < 8; bush++) {
            ctx.beginPath();
            ctx.arc(bx + 440 + bush * 24, horizonY + 48, 14, Math.PI, 0);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();
  }

  _drawDetailedPalmTree(ctx, x, baseY, scale, isNight) {
    ctx.save();
    const windSway = Math.sin(this.timeSec * 2.5 + x * 0.02) * 5 * scale;
    const topX = x + 8 * scale + windSway;
    const topY = baseY - 56 * scale;

    // Curved Palm Trunk
    ctx.strokeStyle = isNight ? "#1e1b18" : "#573016";
    ctx.lineWidth = 5 * scale;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + 4 * scale, baseY - 28 * scale, topX, topY);
    ctx.stroke();

    // 6 Drooping Fronds
    ctx.strokeStyle = isNight ? "#064e3b" : "#15803d";
    ctx.lineWidth = 3 * scale;
    const angles = [-2.6, -2.0, -1.2, -0.4, 0.3, 0.9];
    angles.forEach((ang) => {
      const fx = topX + Math.cos(ang) * 26 * scale;
      const fy = topY + Math.sin(ang) * 18 * scale + 8 * scale;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo((topX + fx) * 0.5, topY - 8 * scale, fx, fy);
      ctx.stroke();
    });
    ctx.restore();
  }

  // ==========================================================================
  // PART B: WORLD-SYNCED STATIONS, LEVEL CROSSINGS (CNGs/RICKSHAWS) & TRACKS
  // ==========================================================================
  _drawWorldStationsAndCrossingsBehindTrain(ctx, w, h, trackSurfaceY, dKm, physics) {
    // Locomotive nose is positioned at x = w * 0.72.
    // Scale: 1.0 km in simulation = 1800 pixels on screen
    const pxPerKm = 1800;
    const locoFrontX = w * 0.72;

    // 1. Draw All Stations within visible range
    physics.route.stations.forEach((st) => {
      const screenX = locoFrontX + (st.km - dKm) * pxPerKm;
      if (screenX > -650 && screenX < w + 650) {
        this._drawDetailedStationPlatform(ctx, screenX, trackSurfaceY, st, physics);
      }
    });

    // 2. Draw Level Crossings (Rail Gates) with Animated Barrier, Gateman, CNGs & Rickshaws
    physics.route.events.forEach((ev) => {
      if (ev.type === "level_crossing") {
        const screenX = locoFrontX + (ev.km - dKm) * pxPerKm;
        if (screenX > -400 && screenX < w + 450) {
          this._drawAnimatedRailGate(ctx, screenX, trackSurfaceY, ev, physics);
        }
      } else if (ev.type === "whistle_board") {
        const screenX = locoFrontX + (ev.km - dKm) * pxPerKm;
        if (screenX > -100 && screenX < w + 100) {
          this._drawWhistleBoard(ctx, screenX, trackSurfaceY);
        }
      }
    });
  }

  _drawDetailedStationPlatform(ctx, centerX, trackY, st, physics) {
    ctx.save();
    const platW = 560;
    const platX = centerX - platW * 0.55;
    const platTopY = trackY - 26;

    // 1. Iconic Station Roof Architecture
    if (st.landmark === "kamalapur_canopy") {
      // Kamalapur Railway Station's Famous Scalloped Concrete Parasol Arches!
      for (let i = 0; i < 6; i++) {
        const ax = platX + i * 92;
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(ax, platTopY - 95);
        ctx.quadraticCurveTo(ax + 46, platTopY - 148, ax + 92, platTopY - 95);
        ctx.lineTo(ax + 78, platTopY - 82);
        ctx.quadraticCurveTo(ax + 46, platTopY - 118, ax + 14, platTopY - 82);
        ctx.closePath();
        ctx.fill();

        // Angled concrete support pillars
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(ax + 46, platTopY);
        ctx.lineTo(ax + 14, platTopY - 85);
        ctx.moveTo(ax + 46, platTopY);
        ctx.lineTo(ax + 78, platTopY - 85);
        ctx.stroke();
      }
    } else if (st.landmark === "coxsbazar_oyster") {
      // Cox's Bazar Iconic Oyster-Shaped Glass & Steel Mega-Dome!
      const domeGrad = ctx.createLinearGradient(platX, platTopY - 165, platX, platTopY);
      domeGrad.addColorStop(0, "rgba(56, 189, 248, 0.85)");
      domeGrad.addColorStop(1, "rgba(15, 23, 42, 0.9)");
      ctx.fillStyle = domeGrad;
      ctx.beginPath();
      ctx.moveTo(platX + 20, platTopY);
      ctx.bezierCurveTo(platX + 110, platTopY - 185, platX + 440, platTopY - 185, platX + 540, platTopY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      // Classic Bangladeshi Heritage Red-Brick & Tin Veranda Station Building
      ctx.fillStyle = "#991b1b";
      ctx.fillRect(platX + 60, platTopY - 88, 420, 88);
      // Corrugated veranda canopy
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(platX + 30, platTopY - 58);
      ctx.lineTo(platX + 60, platTopY - 76);
      ctx.lineTo(platX + 480, platTopY - 76);
      ctx.lineTo(platX + 510, platTopY - 58);
      ctx.closePath();
      ctx.fill();
      // Support columns
      ctx.fillStyle = "#e2e8f0";
      for (let c = 0; c < 6; c++) {
        ctx.fillRect(platX + 55 + c * 85, platTopY - 58, 5, 58);
      }
    }

    // 2. Concrete Platform Base & Yellow Tactile Safety Line
    ctx.fillStyle = "#475569";
    ctx.fillRect(platX, platTopY, platW, 28);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(platX, platTopY, platW, 4);

    // 3. Official Bangladesh Railway Green & White Bilingual Station Nameboard
    const signX = centerX - 110;
    const signY = platTopY - 76;
    ctx.fillStyle = "#006a4e";
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.5;
    ctx.fillRect(signX, signY, 220, 38);
    ctx.strokeRect(signX, signY, 220, 38);
    // Sign posts
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(signX + 18, signY + 38, 4, 38);
    ctx.fillRect(signX + 198, signY + 38, 4, 38);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(st.bn || st.name, centerX, signY + 17);
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(st.name.toUpperCase(), centerX, signY + 31);

    // 4. Platform Tong Tea Stall ("গরম চা") with Steaming Kettle
    const stallX = platX + 45;
    ctx.fillStyle = "#78350f";
    ctx.fillRect(stallX, platTopY - 38, 52, 38);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(stallX - 4, platTopY - 44, 60, 7);
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("গরম চা স্টল", stallX + 26, platTopY - 22);

    // 5. Animated Passengers, Coolies & Hawkers on the Platform
    for (let p = 0; p < 11; p++) {
      // When train is boarding at this station, passengers walk toward the coach doors!
      const walkShift = physics.isBoarding && physics.atStation && physics.atStation.id === st.id
        ? Math.sin(this.timeSec * 5 + p) * 14
        : Math.sin(this.timeSec * 1.8 + p) * 3;
      const px = platX + 120 + p * 36 + walkShift;
      const py = platTopY;
      this._drawAnimatedPerson(ctx, px, py, p);
    }

    // 6. Single-Line Token Pointsman Holding Up the Golden Neale's Ball Token Hoop!
    if (st.tokenExchange) {
      const pmX = centerX + 165;
      const pmY = platTopY;
      const caught = Boolean(physics.tokenExchangeDoneMap[st.id]);

      // Pointsman in dark blue Bangladesh Railway uniform
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(pmX - 6, pmY - 34, 12, 22);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(pmX - 5, pmY - 12, 4, 12);
      ctx.fillRect(pmX + 1, pmY - 12, 4, 12);
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(pmX, pmY - 40, 6, 0, Math.PI * 2);
      ctx.fill();

      // Waving Green Flag in left hand
      ctx.fillStyle = "#10b981";
      ctx.fillRect(pmX + 8, pmY - 44 + Math.sin(this.timeSec * 8) * 3, 16, 11);

      // Raised Right Arm holding the Golden Circular Token Hoop!
      if (!caught) {
        const hoopX = pmX - 18;
        const hoopY = pmY - 46 + Math.sin(this.timeSec * 6) * 3;
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(hoopX, hoopY, 13, 0, Math.PI * 2);
        ctx.stroke();

        // Glowing indicator banner
        ctx.fillStyle = "rgba(120, 53, 15, 0.92)";
        ctx.fillRect(pmX - 95, pmY - 88, 190, 24);
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pmX - 95, pmY - 88, 190, 24);
        ctx.fillStyle = "#fef08a";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("🟡 TOKEN HOOP READY! PRESS [O]", pmX, pmY - 72);
      } else {
        ctx.fillStyle = "#34d399";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("✅ TOKEN EXCHANGED!", pmX, pmY - 68);
      }
    }

    ctx.restore();
  }

  _drawAnimatedPerson(ctx, x, groundY, seed) {
    const legSwing = Math.sin(this.timeSec * 6 + seed) * 3;
    const colors = ["#e11d48", "#0284c7", "#16a34a", "#d97706", "#7c3aed", "#0d9488"];
    const shirtColor = colors[seed % colors.length];

    // Legs
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, groundY - 12);
    ctx.lineTo(x - 3 + legSwing, groundY);
    ctx.moveTo(x, groundY - 12);
    ctx.lineTo(x + 3 - legSwing, groundY);
    ctx.stroke();

    // Torso (Panjabi / Shirt / Saree)
    ctx.fillStyle = shirtColor;
    ctx.fillRect(x - 5, groundY - 27, 10, 16);

    // Head
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(x, groundY - 32, 5, 0, Math.PI * 2);
    ctx.fill();

    // Every 4th person is a Coolie / Hawker carrying a basket on their head!
    if (seed % 4 === 0) {
      ctx.fillStyle = "#b45309";
      ctx.fillRect(x - 8, groundY - 41, 16, 5);
    }
  }

  _drawAnimatedRailGate(ctx, centerX, trackY, ev, physics) {
    ctx.save();
    // Asphalt road crossing the track embankment
    ctx.fillStyle = "#334155";
    ctx.fillRect(centerX - 48, trackY - 22, 96, 55);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, trackY - 22);
    ctx.lineTo(centerX, trackY + 33);
    ctx.stroke();
    ctx.setLineDash([]);

    // Waiting / Encroaching Bangladeshi Vehicles (Green CNG Auto-Rickshaw & Colorful Cycle-Rickshaw)
    // When physics.encroachingHazardActive is true, they sit dangerously close to the rail until Horn [SPACE] is blown!
    const retreatOffset = physics.encroachingHazardActive ? 0 : 42;

    // 1. Authentic Green Bangladeshi CNG Auto-Rickshaw
    const cngX = centerX - 24 - retreatOffset;
    const cngY = trackY - 14;
    ctx.fillStyle = "#16a34a"; // Signature Dhaka/Ctg Green CNG body
    ctx.fillRect(cngX - 22, cngY - 22, 44, 18);
    ctx.fillStyle = "#1e293b"; // Black canvas hood
    ctx.beginPath();
    ctx.moveTo(cngX - 20, cngY - 22);
    ctx.lineTo(cngX - 10, cngY - 34);
    ctx.lineTo(cngX + 18, cngY - 34);
    ctx.lineTo(cngX + 22, cngY - 22);
    ctx.closePath();
    ctx.fill();
    // CNG Windshield & headlight
    ctx.fillStyle = "#bae6fd";
    ctx.fillRect(cngX + 12, cngY - 31, 8, 9);
    // CNG Wheels
    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.arc(cngX - 13, cngY - 3, 6, 0, Math.PI * 2);
    ctx.arc(cngX + 15, cngY - 3, 6, 0, Math.PI * 2);
    ctx.fill();

    // 2. Traditional Colorful Bangladeshi Cycle-Rickshaw
    const rickX = centerX + 22 + retreatOffset;
    const rickY = trackY - 14;
    ctx.fillStyle = "#f43f5e"; // Vibrant hood
    ctx.beginPath();
    ctx.arc(rickX + 8, rickY - 24, 14, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rickX + 8, rickY - 8, 9, 0, Math.PI * 2);
    ctx.arc(rickX - 14, rickY - 8, 9, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Level Crossing Gate Post, Flashing Red Warning Lights & Rotating Barrier Arm
    const postX = centerX - 52;
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(postX - 4, trackY - 72, 8, 65);

    // Flashing red crossbuck lamps
    const flash = Math.floor(this.timeSec * 4) % 2 === 0;
    ctx.fillStyle = flash ? "#ef4444" : "#450a0a";
    ctx.beginPath();
    ctx.arc(postX - 6, trackY - 58, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = !flash ? "#ef4444" : "#450a0a";
    ctx.beginPath();
    ctx.arc(postX + 6, trackY - 58, 5, 0, Math.PI * 2);
    ctx.fill();

    // Red & White Striped Barrier Boom
    const boomAngle = physics.encroachingHazardActive ? -0.38 : 0.0;
    ctx.save();
    ctx.translate(postX, trackY - 38);
    ctx.rotate(boomAngle);
    for (let seg = 0; seg < 6; seg++) {
      ctx.fillStyle = seg % 2 === 0 ? "#ef4444" : "#ffffff";
      ctx.fillRect(seg * 16, -3, 16, 6);
    }
    ctx.restore();

    if (physics.encroachingHazardActive) {
      ctx.fillStyle = "rgba(127, 29, 29, 0.92)";
      ctx.fillRect(centerX - 135, trackY - 102, 270, 24);
      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚠️ CNG ON TRACK! HOLD HORN [SPACE] TO CLEAR!", centerX, trackY - 86);
    }
    ctx.restore();
  }

  _drawWhistleBoard(ctx, x, trackY) {
    ctx.save();
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x - 2, trackY - 54, 4, 48);
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.fillRect(x - 16, trackY - 78, 32, 26);
    ctx.strokeRect(x - 16, trackY - 78, 32, 26);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("W/L", x, trackY - 61);
    ctx.restore();
  }

  _drawSideTrackBed(ctx, w, h, trackSurfaceY, dKm, physics) {
    ctx.save();
    // 1. Crushed Granite Ballast Embankment Slope
    const balGrad = ctx.createLinearGradient(0, trackSurfaceY, 0, h);
    balGrad.addColorStop(0, "#475569");
    balGrad.addColorStop(0.25, "#334155");
    balGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = balGrad;
    ctx.fillRect(0, trackSurfaceY, w, h - trackSurfaceY);

    // Ballast texture pebbles scrolling at 1.0x world speed
    const scrollPx = (dKm * 1800) % 24;
    ctx.fillStyle = "#1e293b";
    for (let sx = -scrollPx; sx < w + 24; sx += 24) {
      // Concrete Sleepers (Ties)
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(sx, trackSurfaceY - 2, 13, 8);
      // Pandrol rail fastening clips
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(sx + 2, trackSurfaceY - 4, 9, 3);
    }

    // Continuous Welded Steel Rail Head & Web
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(0, trackSurfaceY - 7, w, 4);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(0, trackSurfaceY - 3, w, 3);
    ctx.restore();
  }

  // ==========================================================================
  // PART C: STUDIO-GRADE ANIMATED LOCOMOTIVE & PASSENGER COACH CONSIST
  // ==========================================================================
  _drawProfessionalAnimatedTrain(ctx, w, h, trackSurfaceY, physics, dt) {
    const loco = physics.loco;
    const locoWidth = 258;
    const locoHeight = 76;
    const locoX = w * 0.62;
    const suspensionBounce = Math.sin(this.timeSec * 14) * Math.min(2.2, physics.speedKmh * 0.025);
    const railTopY = trackSurfaceY - 7;
    const wheelRadius = 13;
    const bodyBottomY = railTopY - wheelRadius * 2 + 4 + suspensionBounce;
    const bodyTopY = bodyBottomY - locoHeight;

    // 1. Update & Draw Diesel Exhaust Smoke Plume from Locomotive Stack
    this._updateAndDrawExhaustSmoke(ctx, locoX + 108, bodyTopY, physics, dt);

    // 2. Draw Trailing PT INKA / LHB Red-and-Green Passenger Coaches (3 visible coaches behind loco)
    const coachWidth = 228;
    const coachGap = 12;
    for (let c = 0; c < 3; c++) {
      const cx = locoX - (c + 1) * (coachWidth + coachGap);
      if (cx + coachWidth > -40) {
        this._drawDetailedPassengerCoach(
          ctx,
          cx,
          bodyBottomY + 4,
          coachWidth,
          locoHeight - 6,
          railTopY,
          wheelRadius,
          c + 1,
          physics
        );
      }
    }

    // 3. Draw Flexible Coupler & Air Brake Hoses between Locomotive & First Coach
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(locoX - coachGap, bodyBottomY - 12, coachGap + 4, 6);
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(locoX - coachGap, bodyBottomY - 8);
    ctx.quadraticCurveTo(locoX - coachGap * 0.5, bodyBottomY + 4, locoX, bodyBottomY - 8);
    ctx.stroke();

    // 4. Draw Lead Bangladesh Railway Diesel-Electric Locomotive!
    this._drawDetailedLocomotive(
      ctx,
      locoX,
      bodyTopY,
      locoWidth,
      locoHeight,
      railTopY,
      wheelRadius,
      loco,
      physics,
      dt
    );
  }

  _drawDetailedLocomotive(ctx, x, topY, w, h, railTopY, wheelR, loco, physics, dt) {
    ctx.save();
    const bottomY = topY + h;

    // A. Two 3-Axle Co-Co Bogie Trucks (6 Animated Rotating Wheels with Spokes, Springs & Brake Sparks!)
    const bogiePositions = [x + 48, x + w - 62];
    bogiePositions.forEach((bx) => {
      this._drawCoCoBogie(ctx, bx, railTopY, wheelR, physics, dt);
    });

    // Underframe Fuel Tank between bogies (4,500 Liter Black Steel Tank with Sight Gauge)
    const tankGrad = ctx.createLinearGradient(x + 92, bottomY - 4, x + 92, bottomY + 16);
    tankGrad.addColorStop(0, "#334155");
    tankGrad.addColorStop(0.5, "#0f172a");
    tankGrad.addColorStop(1, "#020617");
    ctx.fillStyle = tankGrad;
    ctx.beginPath();
    ctx.roundRect(x + 95, bottomY - 2, 68, 17, 5);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.stroke();

    // B. Locomotive Main Body Shell (Aerodynamic Slanted Nose & Long Hood)
    const bodyGrad = ctx.createLinearGradient(x, topY, x, bottomY);
    bodyGrad.addColorStop(0, this._brightenHex(loco.liveryPrimary, 18));
    bodyGrad.addColorStop(0.45, loco.liveryPrimary);
    bodyGrad.addColorStop(1, this._darkenHex(loco.liveryPrimary, 22));

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(x, bottomY);
    ctx.lineTo(x, topY + 6);
    ctx.quadraticCurveTo(x, topY, x + 8, topY);
    ctx.lineTo(x + w - 26, topY); // Roof line to cab front
    ctx.lineTo(x + w - 8, topY + 26); // Slanted aerodynamic cab windshield
    ctx.lineTo(x + w, topY + 32); // Short nose hood
    ctx.lineTo(x + w, bottomY);
    ctx.closePath();
    ctx.fill();

    // Livery Secondary Stripe (Bangladesh Flag Vermilion Red or Classic BR Gold)
    ctx.fillStyle = loco.liverySecondary || "#f42a41";
    ctx.fillRect(x, topY + h * 0.48, w - 3, 16);

    // Gold Accent Pinstripe
    ctx.fillStyle = loco.liveryAccent || "#ffd700";
    ctx.fillRect(x, topY + h * 0.48 - 3, w - 4, 3);
    ctx.fillRect(x, topY + h * 0.48 + 16, w - 2, 2.5);

    // C. Long-Hood Radiator Louvers, Engine Access Doors & Dynamic Brake Roof Blister
    ctx.fillStyle = "rgba(9, 13, 22, 0.58)";
    // Radiator intake grilles
    for (let g = 0; g < 5; g++) {
      const gx = x + 14 + g * 26;
      ctx.fillRect(gx, topY + 10, 20, 20);
      // Louver slats (open wider if ALP opened radiator louvers!)
      ctx.strokeStyle = physics.radiatorLouversOpen ? "#38bdf8" : "#64748b";
      ctx.lineWidth = 1.5;
      for (let s = 0; s < 4; s++) {
        ctx.beginPath();
        ctx.moveTo(gx + 2, topY + 13 + s * 4.5);
        ctx.lineTo(gx + 18, topY + 13 + s * 4.5);
        ctx.stroke();
      }
    }

    // Engine room inspection doors seams
    ctx.strokeStyle = "rgba(15, 23, 42, 0.5)";
    ctx.lineWidth = 1;
    for (let d = 0; d < 6; d++) {
      ctx.strokeRect(x + 18 + d * 24, topY + 34, 20, 34);
    }

    // Roof Exhaust Stack & Dynamic Brake Fan Housing
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x + 102, topY - 7, 14, 7);
    ctx.fillRect(x + 32, topY - 4, 48, 4);

    // Dual Brass Pneumatic Roof Horn Trumpets (Nathan AirChime)
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(x + w - 58, topY - 7, 14, 5);
    ctx.beginPath();
    ctx.moveTo(x + w - 44, topY - 7);
    ctx.lineTo(x + w - 36, topY - 10);
    ctx.lineTo(x + w - 36, topY - 1);
    ctx.closePath();
    ctx.fill();

    // Expanding Acoustic Shockwave Rings when Horn [SPACE] is blown!
    if (physics.hornActive) {
      for (let r = 1; r <= 3; r++) {
        const rad = ((this.timeSec * 90 + r * 22) % 65);
        ctx.strokeStyle = `rgba(250, 204, 21, ${1 - rad / 65})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x + w - 32, topY - 6, rad, -Math.PI * 0.45, Math.PI * 0.25);
        ctx.stroke();
      }
    }

    // D. Authentic Bilingual Signage & Locomotive Road Number Plate
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("বাংলাদেশ রেলওয়ে • BANGLADESH RAILWAY", x + 98, topY + h * 0.48 + 11.5);

    // Number plate under cab window
    ctx.fillStyle = "#090d16";
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.5;
    ctx.fillRect(x + w - 76, topY + 44, 46, 16);
    ctx.strokeRect(x + w - 76, topY + 44, 46, 16);
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 10px Consolas, monospace";
    ctx.fillText(loco.code.split(" ")[0], x + w - 53, topY + 55);

    // E. Cab Windows with Animated Loco Pilot (LP) & Assistant Loco Pilot (ALP)!
    // Side Cab Window (ALP & LP)
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x + w - 78, topY + 10, 46, 24);
    const glassGrad = ctx.createLinearGradient(x + w - 76, topY + 12, x + w - 34, topY + 32);
    glassGrad.addColorStop(0, "#38bdf8");
    glassGrad.addColorStop(1, "#0369a1");
    ctx.fillStyle = glassGrad;
    ctx.fillRect(x + w - 76, topY + 12, 42, 20);

    // LP Silhouette at Controls
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(x + w - 44, topY + 20, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + w - 49, topY + 25, 10, 7);

    // ALP Leaning Out Cab Window to Snatch Token Hoop when near Token Station!
    const alpLeaning = Boolean(physics.nearTokenStation && !physics.tokenExchangeDoneMap[physics.nearTokenStation.id]);
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(x + w - 65, topY + (alpLeaning ? 18 : 21), 5, 0, Math.PI * 2);
    ctx.fill();
    if (alpLeaning) {
      // Extended arm reaching out for the Token Hoop!
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x + w - 65, topY + 24);
      ctx.lineTo(x + w - 78, topY + 14 + Math.sin(this.timeSec * 10) * 3);
      ctx.stroke();
    }

    // Slanted Front Windshield Glass
    ctx.fillStyle = "#bae6fd";
    ctx.beginPath();
    ctx.moveTo(x + w - 25, topY + 6);
    ctx.lineTo(x + w - 10, topY + 26);
    ctx.lineTo(x + w - 19, topY + 26);
    ctx.lineTo(x + w - 28, topY + 6);
    ctx.closePath();
    ctx.fill();

    // F. Front Buffer Beam, Red/Yellow Hazard Chevrons, Cowcatcher Pilot & Marigold Garland!
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(x + w - 6, bottomY - 12, 10, 14);
    // Steel Cowcatcher (Pilot)
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(x + w - 4, bottomY + 2);
    ctx.lineTo(x + w + 12, bottomY + 14);
    ctx.lineTo(x + w - 4, bottomY + 14);
    ctx.closePath();
    ctx.fill();

    // Festive Marigold Garland (Genda Phul) on the Locomotive Nose!
    for (let m = 0; m < 4; m++) {
      ctx.fillStyle = m % 2 === 0 ? "#f97316" : "#facc15";
      ctx.beginPath();
      ctx.arc(x + w - 3, topY + 36 + m * 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // G. Volumetric Twin Headlight Beams & Ditch Lights
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(x + w, topY + 34, 4.5, 0, Math.PI * 2);
    ctx.fill();

    if (physics.headlightMode === "BRIGHT") {
      const beam = ctx.createLinearGradient(x + w, topY + 34, x + w + 280, topY + 75);
      beam.addColorStop(0, "rgba(254, 240, 138, 0.55)");
      beam.addColorStop(0.5, "rgba(254, 240, 138, 0.18)");
      beam.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(x + w, topY + 31);
      ctx.lineTo(x + w + 280, topY - 10);
      ctx.lineTo(x + w + 280, railTopY + 10);
      ctx.lineTo(x + w, topY + 38);
      ctx.closePath();
      ctx.fill();
    }

    // Exterior Safety Handrails along the running board
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, bottomY - 2);
    ctx.lineTo(x + 6, bottomY - 22);
    ctx.lineTo(x + w - 82, bottomY - 22);
    ctx.stroke();

    ctx.restore();
  }

  _drawCoCoBogie(ctx, centerX, railTopY, wheelR, physics, dt) {
    ctx.save();
    const wheelOffsets = [-32, 0, 32]; // 3 axles per Co-Co bogie

    // 1. Rotating Steel Wheels with Animated Spokes & Counterweights
    wheelOffsets.forEach((dx) => {
      const wx = centerX + dx;
      const wy = railTopY - wheelR;

      // Steel tyre rim
      ctx.beginPath();
      ctx.arc(wx, wy, wheelR, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#cbd5e1";
      ctx.stroke();

      // Rotating wheel spokes & counterweight crescent
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(this.wheelAngle + (physics.wheelSlip ? this.timeSec * 18 : 0));

      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      for (let s = 0; s < 3; s++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.moveTo(-wheelR + 2, 0);
        ctx.lineTo(wheelR - 2, 0);
        ctx.stroke();
      }

      // Bright axle hub cap
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      ctx.restore();

      // Glowing Orange Brake Shoe Sparks when heavy braking!
      if (physics.brakeCylinderPressure > 1.4 && physics.speedKmh > 12) {
        for (let sp = 0; sp < 2; sp++) {
          ctx.fillStyle = sp % 2 === 0 ? "#fb923c" : "#fef08a";
          const sx = wx - wheelR - Math.random() * 14;
          const sy = railTopY - 2 - Math.random() * 8;
          ctx.fillRect(sx, sy, 3, 2);
        }
      }
    });

    // 2. Cast-Steel Bogie Side Frame & Equalizer Beam
    ctx.fillStyle = "#334155";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    ctx.fillRect(centerX - 44, railTopY - wheelR - 6, 88, 7);
    ctx.strokeRect(centerX - 44, railTopY - wheelR - 6, 88, 7);

    // Helical Coil Suspension Springs
    [-18, 18].forEach((sx) => {
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX + sx - 4, railTopY - wheelR - 14, 8, 8);
    });

    // 3. Pneumatic Rail Sander Jet Spray when Sander [X] is Active!
    if (physics.sanderActive) {
      ctx.fillStyle = "rgba(250, 204, 21, 0.75)";
      for (let p = 0; p < 6; p++) {
        const px = centerX + 42 - Math.random() * 16;
        const py = railTopY - Math.random() * 10;
        ctx.fillRect(px, py, 2.5, 2.5);
      }
    }

    ctx.restore();
  }

  _drawDetailedPassengerCoach(ctx, x, bottomY, w, h, railTopY, wheelR, coachNum, physics) {
    ctx.save();
    const topY = bottomY - h;

    // 1. Two 2-Axle Passenger Bogies per Coach
    [x + 36, x + w - 36].forEach((bx) => {
      [-14, 14].forEach((dx) => {
        const wx = bx + dx;
        const wy = railTopY - wheelR + 2;
        ctx.beginPath();
        ctx.arc(wx, wy, wheelR - 2, 0, Math.PI * 2);
        ctx.fillStyle = "#1e293b";
        ctx.fill();
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(this.wheelAngle);
        ctx.strokeStyle = "#94a3b8";
        ctx.beginPath();
        ctx.moveTo(-(wheelR - 4), 0);
        ctx.lineTo(wheelR - 4, 0);
        ctx.stroke();
        ctx.restore();
      });
      ctx.fillStyle = "#334155";
      ctx.fillRect(bx - 24, railTopY - wheelR - 2, 48, 5);
    });

    // 2. PT INKA / LHB Stainless & National Green/Red Coach Shell
    const bodyGrad = ctx.createLinearGradient(x, topY, x, bottomY);
    bodyGrad.addColorStop(0, "#059669");
    bodyGrad.addColorStop(0.35, "#006a4e");
    bodyGrad.addColorStop(1, "#064e3b");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(x, topY, w, h, 5);
    ctx.fill();

    // Rounded Corrugated Roof & AC Units
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(x + 4, topY, w - 8, 6);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(x + 35, topY - 3, 38, 3);
    ctx.fillRect(x + w - 73, topY - 3, 38, 3);

    // National Flag Vermilion Red Window Band with Gold Borders
    ctx.fillStyle = "#f42a41";
    ctx.fillRect(x, topY + 16, w, 24);
    ctx.fillStyle = "#fde047";
    ctx.fillRect(x, topY + 14, w, 2);
    ctx.fillRect(x, topY + 40, w, 2);

    // 3. Panoramic Tinted Windows with Illuminated Passengers Inside!
    const numWindows = 7;
    const winStart = x + 24;
    const winStep = 26;
    for (let i = 0; i < numWindows; i++) {
      const wx = winStart + i * winStep;
      const wy = topY + 19;
      ctx.fillStyle = this.weatherMode === "night_express" ? "#fef08a" : "#bae6fd";
      ctx.beginPath();
      ctx.roundRect(wx, wy, 19, 15, 2);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Passenger silhouette inside window
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(wx + 9, wy + 7, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(wx + 5, wy + 10, 8, 4);
    }

    // 4. Coach Doors on Left & Right Ends (Open when boarding at station!)
    const doorsOpen = Boolean(physics.isBoarding && physics.atStation);
    [x + 5, x + w - 19].forEach((dx) => {
      ctx.fillStyle = doorsOpen ? "#090d16" : "#047857";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.fillRect(dx, topY + 12, 14, h - 14);
      ctx.strokeRect(dx, topY + 12, 14, h - 14);
      if (doorsOpen) {
        // Yellow boarding steps & passenger stepping in
        ctx.fillStyle = "#facc15";
        ctx.fillRect(dx + 2, bottomY - 4, 10, 3);
      }
    });

    // 5. Bilingual Digital Destination Board & Coach Number ("ক-১", "খ-২")
    const bengaliCoachLetters = ["ক", "খ", "গ", "ঘ", "ঙ"];
    ctx.fillStyle = "#090d16";
    ctx.fillRect(x + w * 0.5 - 48, topY + 45, 96, 12);
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 8.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `কোচ ${bengaliCoachLetters[coachNum - 1] || coachNum} • ${physics.route.name.split(" ")[0].toUpperCase()}`,
      x + w * 0.5,
      topY + 54
    );

    // 6. Rubber Inter-Coach Gangway Bellows (Diaphragm)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x - 10, topY + 8, 10, h - 12);

    // 7. Alarm Chain Pull (ACP) Flashing External Clapper Disc & Venting Steam!
    if (physics.alarmChainPulled && (coachNum === 1 || coachNum === physics.acpCoachNumber)) {
      const flash = Math.floor(this.timeSec * 8) % 2 === 0;
      ctx.fillStyle = flash ? "#ef4444" : "#facc15";
      ctx.beginPath();
      ctx.arc(x + w - 24, topY + 10, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("🚨 ACP VALVE OPEN! PRESS [P]", x + w * 0.5, topY - 10);
    }

    ctx.restore();
  }

  _updateAndDrawExhaustSmoke(ctx, stackX, stackY, physics, dt) {
    // Spawn rate and darkness scale with Throttle Notch (0..8)
    const spawnChance = 0.35 + (physics.notch / 8) * 0.65;
    if (Math.random() < spawnChance) {
      this.exhaustParticles.push({
        x: stackX,
        y: stackY - 6,
        vx: -28 - physics.speedKmh * 1.15 - Math.random() * 20,
        vy: -22 - physics.notch * 4.5 - Math.random() * 12,
        r: 6 + physics.notch * 0.9,
        alpha: 0.35 + (physics.notch / 8) * 0.4,
        darkness: physics.notch >= 5 ? 25 : 95
      });
    }

    ctx.save();
    for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
      const p = this.exhaustParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += 18 * dt;
      p.alpha -= 0.38 * dt;

      if (p.alpha <= 0.01) {
        this.exhaustParticles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = `rgba(${p.darkness}, ${p.darkness + 8}, ${p.darkness + 18}, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawForegroundBridgeAndPlatformElements(ctx, w, h, trackSurfaceY, dKm, physics) {
    if (!physics.onBridge) return;

    ctx.save();
    const style = physics.onBridge.bridgeStyle || "steel_truss";
    const spanW = 140;
    const scrollPx = (dKm * 1800) % spanW;

    let mainColor = "#475569";
    let hiColor = "#94a3b8";
    if (style === "hardinge_crimson") {
      // Historic 1915 Hardinge Bridge over Padma River in Deep Riveted Crimson!
      mainColor = "#7f1d1d";
      hiColor = "#b91c1c";
    } else if (style === "padma_double_deck") {
      // Padma Multipurpose Bridge Double-Deck Warren Steel Truss!
      mainColor = "#334155";
      hiColor = "#cbd5e1";
    }

    const deckBottomY = trackSurfaceY + 8;
    const topChordY = trackSurfaceY - 128;

    // Upper Highway Deck on Padma Multipurpose Bridge with Cars & Buses driving above the train!
    if (style === "padma_double_deck") {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, topChordY - 14, w, 16);
      // Animated Bus & Trucks on Padma Bridge Upper Road Deck
      const busX = (w - ((this.timeSec * 120) % (w + 200)));
      ctx.fillStyle = "#e11d48";
      ctx.fillRect(busX, topChordY - 30, 56, 16);
      ctx.fillStyle = "#fef08a";
      for (let bw = 4; bw < 48; bw += 10) {
        ctx.fillRect(busX + bw, topChordY - 27, 7, 6);
      }
    }

    // Foreground Warren / Pettit Steel Truss Girder Bays passing in front of the train
    for (let bx = -scrollPx - spanW; bx < w + spanW; bx += spanW) {
      // Vertical riveted post
      ctx.fillStyle = mainColor;
      ctx.fillRect(bx - 5, topChordY, 10, deckBottomY - topChordY);

      // Diagonal truss members
      ctx.strokeStyle = hiColor;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(bx, deckBottomY);
      ctx.lineTo(bx + spanW * 0.5, topChordY);
      ctx.lineTo(bx + spanW, deckBottomY);
      ctx.stroke();

      // Massive Concrete River Pier in the Padma/Jamuna/Meghna water below
      if (Math.abs((bx + scrollPx) % (spanW * 2)) < 10) {
        ctx.fillStyle = "#64748b";
        ctx.fillRect(bx - 22, deckBottomY, 44, h - deckBottomY);
      }
    }

    // Top & Bottom Heavy Steel Chords
    ctx.fillStyle = mainColor;
    ctx.fillRect(0, topChordY - 4, w, 10);
    ctx.fillRect(0, deckBottomY - 4, w, 12);

    // Bridge Name Banner
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(w * 0.5 - 180, topChordY + 14, 360, 24);
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 12px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`🌉 CROSSING: ${physics.onBridge.name.toUpperCase()}`, w * 0.5, topChordY + 30);

    ctx.restore();
  }

  // ==========================================================================
  // PART D: LIVE 3D FORWARD CAB WINDSHIELD PICTURE-IN-PICTURE (PiP) MONITOR
  // ==========================================================================
  _renderForwardCabPiP(ctx, w, h, physics, dt, swayX, swayY) {
    const pipW = 290;
    const pipH = 168;
    const pipX = w - pipW - 14;
    const pipY = h - pipH - 12;

    ctx.save();
    // Clip to PiP Monitor Frame
    ctx.beginPath();
    ctx.roundRect(pipX, pipY, pipW, pipH, 8);
    ctx.clip();

    ctx.translate(pipX, pipY);
    this._render3DWorldOutWindow(ctx, pipW, pipH, physics, dt, swayX * 0.4, swayY * 0.4);

    // Windshield Wiper & Marigold Garland inside PiP
    ctx.save();
    ctx.translate(pipW * 0.5, 10);
    ctx.rotate(this.wiperAngle * 0.5);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, pipH * 0.55);
    ctx.stroke();
    ctx.restore();

    // PiP Header Bar
    ctx.fillStyle = "rgba(9, 13, 22, 0.82)";
    ctx.fillRect(0, 0, pipW, 22);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 10px 'Segoe UI', sans-serif";
    ctx.fillText("👁️ 3D DRIVER WINDSHIELD CAM (Press [V] Fullscreen)", 8, 15);

    ctx.restore();

    // Outer Brass/Emerald Bezel around PiP
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(pipX, pipY, pipW, pipH, 8);
    ctx.stroke();
  }

  // ==========================================================================
  // PART E: FULL-SCREEN 3D FORWARD WORLD & CAB INTERIOR (FOR CAB_FIRST_PERSON)
  // ==========================================================================
  _render3DWorldOutWindow(ctx, w, h, physics, dt, swayX, swayY) {
    const horizonY = h * 0.44 + swayY;
    const vanishX = w * 0.5 + swayX * 1.4;

    this._drawSkyAndClouds(ctx, w, h, horizonY, dt, physics.speedKmh / 3.6);
    this._drawFarHorizonParallax(ctx, w, horizonY, physics.distanceKm, physics);

    // Ground Plane
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    groundGrad.addColorStop(0, "#15803d");
    groundGrad.addColorStop(1, "#14532d");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // 3D Perspective Track Bed
    const spread = w * 0.34;
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(vanishX - 6, horizonY);
    ctx.lineTo(vanishX + 6, horizonY);
    ctx.lineTo(vanishX + spread * 0.8, h);
    ctx.lineTo(vanishX - spread * 0.8, h);
    ctx.closePath();
    ctx.fill();

    // Perspective Sleepers
    const sleeperOffset = (physics.distanceKm * 1000) % 1.0;
    for (let i = 1; i <= 26; i++) {
      const z = (i - sleeperOffset) / 26;
      const p = Math.pow(z, 2.2);
      const sy = horizonY + p * (h - horizonY);
      const hw = 4 + p * (spread * 0.52);
      ctx.fillStyle = i % 2 === 0 ? "#94a3b8" : "#64748b";
      ctx.fillRect(vanishX - hw, sy, hw * 2, Math.max(1, p * 5));
    }

    // Steel Rails (with 3rd Dual-Gauge rail when on DG route)
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(vanishX - 2, horizonY);
    ctx.lineTo(vanishX - spread * 0.4, h);
    ctx.moveTo(vanishX + 2, horizonY);
    ctx.lineTo(vanishX + spread * 0.4, h);
    if (physics.route.gauge === "DG") {
      ctx.moveTo(vanishX + 0.8, horizonY);
      ctx.lineTo(vanishX + spread * 0.14, h);
    }
    ctx.stroke();

    // Upcoming Signal Mast in 3D View
    const sigX = vanishX - spread * 0.28;
    const sigY = horizonY + (h - horizonY) * 0.45;
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(sigX - 2, sigY - 48, 4, 48);
    ctx.fillStyle = "#090d16";
    ctx.fillRect(sigX - 7, sigY - 56, 14, 24);
    ctx.fillStyle =
      physics.activeSignalAspect === "RED"
        ? "#ef4444"
        : physics.activeSignalAspect === "GREEN"
        ? "#22c55e"
        : "#eab308";
    ctx.beginPath();
    ctx.arc(sigX, sigY - 44, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  _renderCabInteriorOverlay(ctx, w, h, physics, dt, swayX, swayY) {
    ctx.save();
    ctx.translate(swayX * 0.3, swayY * 0.3);

    // Cab pillars & overhead header
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h * 0.09);
    ctx.fillRect(w * 0.488, h * 0.08, w * 0.024, h * 0.52);
    ctx.fillRect(0, 0, w * 0.04, h);
    ctx.fillRect(w * 0.96, 0, w * 0.04, h);

    // Marigold Flower Garland across windshield top
    for (let gx = w * 0.06; gx <= w * 0.94; gx += 20) {
      ctx.beginPath();
      ctx.arc(gx, h * 0.095 + Math.sin(gx * 0.05) * 4, 6, 0, Math.PI * 2);
      ctx.fillStyle = gx % 40 < 20 ? "#f97316" : "#facc15";
      ctx.fill();
    }

    // Lower Control Stand Desk
    const deskY = h * 0.58;
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, deskY, w, h - deskY);
    ctx.fillStyle = physics.loco.liveryPrimary || "#006a4e";
    ctx.fillRect(0, deskY, w, 6);

    ctx.fillStyle = "#fde047";
    ctx.font = "bold 13px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `FIRST-PERSON 3D CAB VIEW (${physics.loco.code}) — Press [V] to return to Studio Dual Train Animation`,
      w * 0.5,
      deskY + 32
    );
    ctx.restore();
  }

  _renderAlpWindowView(ctx, w, h, physics, dt, swayX, swayY) {
    this._renderAnimatedParallaxScene(ctx, w, h, physics, dt);
    ctx.save();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(w * 0.52, h * 0.42, w * 0.36, h * 0.38);
    ctx.fillStyle = "rgba(9, 13, 22, 0.85)";
    ctx.fillRect(w * 0.25, h * 0.04, w * 0.5, 36);
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 13px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🟡 ALP TOKEN HOOP & COACH INSPECTION VIEW — Press [O] at Token Station (15–30 km/h)", w * 0.5, h * 0.04 + 23);
    ctx.restore();
  }

  _drawWeatherEffects(ctx, w, h, horizonY, physics, dt) {
    if (this.weatherMode === "winter_fog") {
      const fog = ctx.createLinearGradient(0, horizonY - 60, 0, h);
      fog.addColorStop(0, "rgba(226, 232, 240, 0.78)");
      fog.addColorStop(0.6, "rgba(203, 213, 225, 0.45)");
      fog.addColorStop(1, "rgba(203, 213, 225, 0.12)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, w, h);
    } else if (this.weatherMode === "monsoon_rain") {
      ctx.strokeStyle = "rgba(186, 230, 253, 0.58)";
      ctx.lineWidth = 1.6;
      this.rainDrops.forEach((drop) => {
        drop.y += drop.speed * dt * 1.9;
        drop.x -= 0.18 * dt;
        if (drop.y > 1.0) {
          drop.y = 0;
          drop.x = Math.random();
        }
        if (drop.x < 0) drop.x = 1.0;
        const rx = drop.x * w;
        const ry = drop.y * h;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 7, ry + drop.len);
        ctx.stroke();
      });
    }
  }

  _brightenHex(hex, pct) {
    const num = parseInt((hex || "#006a4e").replace("#", ""), 16);
    const r = Math.min(255, ((num >> 16) & 255) + pct);
    const g = Math.min(255, ((num >> 8) & 255) + pct);
    const b = Math.min(255, (num & 255) + pct);
    return `rgb(${r},${g},${b})`;
  }

  _darkenHex(hex, pct) {
    const num = parseInt((hex || "#006a4e").replace("#", ""), 16);
    const r = Math.max(0, ((num >> 16) & 255) - pct);
    const g = Math.max(0, ((num >> 8) & 255) - pct);
    const b = Math.max(0, (num & 255) - pct);
    return `rgb(${r},${g},${b})`;
  }
}

window.BRSim.Renderer3D = new BangladeshRailwayStudioRenderer();
