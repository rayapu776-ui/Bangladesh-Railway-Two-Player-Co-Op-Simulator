// ============================================================================
// TRACKS OF BENGAL: BANGLADESH RAILWAY CO-OP SIMULATOR
// Module: renderer3D.js — 3D Perspective World, Bridges, Local Life & Cab View
// ============================================================================

window.BRSim = window.BRSim || {};

class BangladeshRailway3DRenderer {
  constructor() {
    this.cameraMode = "CAB_COOP"; // "CAB_COOP", "ALP_TOKEN_WINDOW", "EXTERIOR_CHASE"
    this.weatherMode = "clear_sunset"; // "clear_sunset", "clear_day", "monsoon_rain", "winter_fog", "night_express"
    this.wiperAngle = 0;
    this.wiperDir = 1;
    this.fanAngle = 0;
    this.rainDrops = [];
    this.smokeParticles = [];

    for (let i = 0; i < 90; i++) {
      this.rainDrops.push({
        x: Math.random(),
        y: Math.random(),
        len: 12 + Math.random() * 18,
        speed: 0.7 + Math.random() * 0.6
      });
    }
  }

  cycleCamera() {
    const modes = ["CAB_COOP", "ALP_TOKEN_WINDOW", "EXTERIOR_CHASE"];
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

    this.fanAngle = (this.fanAngle + dt * 11) % (Math.PI * 2);
    if (physics.wipersOn) {
      this.wiperAngle += this.wiperDir * dt * 2.8;
      if (this.wiperAngle > 1.05) {
        this.wiperAngle = 1.05;
        this.wiperDir = -1;
      } else if (this.wiperAngle < -1.05) {
        this.wiperAngle = -1.05;
        this.wiperDir = 1;
      }
    } else {
      this.wiperAngle *= 0.92;
    }

    // Cab vibration / sway over bolted fishplate track joints
    const speedRatio = Math.min(1.5, Math.abs(physics.speedKmh) / 90);
    const swayX = Math.sin(Date.now() * 0.009) * 3.5 * speedRatio + (physics.wheelSlip ? (Math.random() - 0.5) * 6 : 0);
    const swayY = Math.abs(Math.cos(Date.now() * 0.018)) * 2.5 * speedRatio;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    if (this.cameraMode === "EXTERIOR_CHASE") {
      this._renderExteriorChaseView(ctx, w, h, physics, dt);
    } else if (this.cameraMode === "ALP_TOKEN_WINDOW") {
      this._renderAlpWindowView(ctx, w, h, physics, dt, swayX, swayY);
    } else {
      // Default: Full 2-Player Co-Op Cab Interior + 3D World View
      this._render3DWorldOutWindow(ctx, w, h, physics, dt, swayX, swayY);
      this._renderCabInteriorOverlay(ctx, w, h, physics, dt, swayX, swayY);
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 1. 3D PERSPECTIVE WORLD RENDERER (TRACKS, BRIDGES, STATIONS, LOCAL LIFE)
  // --------------------------------------------------------------------------
  _render3DWorldOutWindow(ctx, w, h, physics, dt, swayX, swayY) {
    const horizonY = h * 0.44 + swayY;
    const vanishX = w * 0.5 + swayX * 1.5;

    // 1. Sky & Atmosphere Shader based on Bangladeshi Weather
    this._drawSkyAndSun(ctx, w, h, horizonY);

    // 2. Distant Horizon Silhouettes (Srimangal Tea Hills, Dhaka Skyline, or Brick Kilns)
    this._drawDistantHorizon(ctx, w, horizonY, physics);

    // 3. Ground Plane (Emerald Paddy Fields, Flooded Haor Water, or Mustard Fields)
    this._drawGroundBiome(ctx, w, h, horizonY, physics);

    // 4. Perspective 3D Railway Embankment, Multi-Gauge Sleepers & Rails (MG/BG/DG)
    this._draw3DTrackBed(ctx, w, h, vanishX, horizonY, physics);

    // 5. Dynamic 3D World Objects (Stations, Bridges, Level Crossings, Signals, Trees, People)
    this._draw3DTracksideEntities(ctx, w, h, vanishX, horizonY, physics);

    // 6. Headlight Volumetric Cone (Night / Fog / Monsoon)
    if (physics.headlightMode === "BRIGHT" && (this.weatherMode === "night_express" || this.weatherMode === "winter_fog" || this.weatherMode === "monsoon_rain")) {
      const beamGrad = ctx.createRadialGradient(vanishX, horizonY + 35, 10, vanishX, h * 0.85, w * 0.48);
      beamGrad.addColorStop(0, "rgba(254, 240, 138, 0.32)");
      beamGrad.addColorStop(0.6, "rgba(254, 240, 138, 0.10)");
      beamGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(vanishX - 30, horizonY + 10);
      ctx.lineTo(vanishX + 30, horizonY + 10);
      ctx.lineTo(w * 0.92, h);
      ctx.lineTo(w * 0.08, h);
      ctx.closePath();
      ctx.fill();
    }

    // 7. Weather Particles (Monsoon Rain Deluge or Winter River Fog Kuasha)
    this._drawWeatherEffects(ctx, w, h, horizonY, physics, dt);
  }

  _drawSkyAndSun(ctx, w, h, horizonY) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (this.weatherMode === "clear_sunset") {
      skyGrad.addColorStop(0, "#1e1b4b");
      skyGrad.addColorStop(0.45, "#7c2d12");
      skyGrad.addColorStop(0.8, "#ea580c");
      skyGrad.addColorStop(1, "#fde047");
    } else if (this.weatherMode === "monsoon_rain") {
      skyGrad.addColorStop(0, "#0f172a");
      skyGrad.addColorStop(0.5, "#1e293b");
      skyGrad.addColorStop(1, "#475569");
    } else if (this.weatherMode === "winter_fog") {
      skyGrad.addColorStop(0, "#64748b");
      skyGrad.addColorStop(0.6, "#94a3b8");
      skyGrad.addColorStop(1, "#cbd5e1");
    } else if (this.weatherMode === "night_express") {
      skyGrad.addColorStop(0, "#020617");
      skyGrad.addColorStop(0.6, "#090d16");
      skyGrad.addColorStop(1, "#1e293b");
    } else {
      // Clear Bengal Day
      skyGrad.addColorStop(0, "#0284c7");
      skyGrad.addColorStop(0.65, "#38bdf8");
      skyGrad.addColorStop(1, "#bae6fd");
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY + 2);

    // Sun or Moon
    if (this.weatherMode === "clear_sunset") {
      const sunGrad = ctx.createRadialGradient(w * 0.58, horizonY - 38, 8, w * 0.58, horizonY - 38, 75);
      sunGrad.addColorStop(0, "#fffbeb");
      sunGrad.addColorStop(0.3, "#fb923c");
      sunGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w * 0.58, horizonY - 38, 75, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawDistantHorizon(ctx, w, horizonY, physics) {
    const routeId = physics.route.id;
    ctx.save();

    if (routeId === "sylhet_parabat_hills" || routeId === "hardinge_panchagarh") {
      // Rolling Srimangal Tea Hills / Himalayan Foothills
      ctx.fillStyle = this.weatherMode === "night_express" ? "#0f172a" : "#064e3b";
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let x = 0; x <= w; x += 40) {
        const hillH = Math.sin(x * 0.008 + physics.distanceKm * 0.5) * 24 + Math.cos(x * 0.015) * 14 + 26;
        ctx.lineTo(x, horizonY - hillH);
      }
      ctx.lineTo(w, horizonY);
      ctx.closePath();
      ctx.fill();
    } else {
      // Distant Bangladeshi Village Tree Line & Brick Kilns (Itt-Bhatta)
      ctx.fillStyle = this.weatherMode === "night_express" ? "#09121c" : "#113025";
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let x = 0; x <= w; x += 25) {
        const treeH = 10 + Math.abs(Math.sin(x * 0.04)) * 12;
        ctx.lineTo(x, horizonY - treeH);
      }
      ctx.lineTo(w, horizonY);
      ctx.closePath();
      ctx.fill();

      // Draw 2 Iconic Brick Kiln Chimneys (Itt-Bhatta) belching white smoke on the horizon
      [w * 0.22, w * 0.78].forEach((kx, i) => {
        ctx.fillStyle = "#7f1d1d";
        ctx.beginPath();
        ctx.moveTo(kx - 7, horizonY);
        ctx.lineTo(kx - 3, horizonY - 46);
        ctx.lineTo(kx + 3, horizonY - 46);
        ctx.lineTo(kx + 7, horizonY);
        ctx.closePath();
        ctx.fill();

        // Smoke plume
        ctx.fillStyle = "rgba(226, 232, 240, 0.35)";
        for (let s = 1; s <= 4; s++) {
          const sx = kx + s * 9 + Math.sin(Date.now() * 0.002 + s + i) * 4;
          const sy = horizonY - 46 - s * 7;
          ctx.beginPath();
          ctx.arc(sx, sy, 4 + s * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    ctx.restore();
  }

  _drawGroundBiome(ctx, w, h, horizonY, physics) {
    const routeId = physics.route.id;
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);

    if (routeId === "haor_mohanganj" || physics.onBridge) {
      // Flooded Haor Basin or Major River (Padma / Jamuna / Meghna)
      groundGrad.addColorStop(0, "#0e7490");
      groundGrad.addColorStop(0.35, "#155e75");
      groundGrad.addColorStop(1, "#083344");
    } else if (this.weatherMode === "night_express") {
      groundGrad.addColorStop(0, "#05100c");
      groundGrad.addColorStop(1, "#020604");
    } else {
      // Lush Alluvial Emerald Paddy Fields of Bengal
      groundGrad.addColorStop(0, "#15803d");
      groundGrad.addColorStop(0.4, "#166534");
      groundGrad.addColorStop(1, "#14532d");
    }

    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Draw Yellow Mustard Field patches (Sorisha Khet) or Haor Country Boats (Nouka)
    if (routeId === "haor_mohanganj" || physics.onBridge) {
      // Animated water ripples & traditional wooden Nouka country boats
      ctx.strokeStyle = "rgba(186, 230, 253, 0.25)";
      ctx.lineWidth = 1.5;
      for (let r = 0; r < 14; r++) {
        const ry = horizonY + 18 + r * 16;
        const rx = ((r * 137 + Date.now() * 0.02) % (w * 0.85));
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + 35, ry);
        ctx.stroke();
      }
      // Wooden Country Boat (Nouka) with colorful sail
      const boatX = w * 0.16 + Math.sin(Date.now() * 0.0006) * 25;
      const boatY = horizonY + 58;
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.moveTo(boatX - 28, boatY);
      ctx.quadraticCurveTo(boatX, boatY + 12, boatX + 28, boatY);
      ctx.closePath();
      ctx.fill();
      // Boat canopy (Chhoi)
      ctx.fillStyle = "#b45309";
      ctx.fillRect(boatX - 10, boatY - 8, 20, 8);
    }
  }

  _draw3DTrackBed(ctx, w, h, vanishX, horizonY, physics) {
    const gauge = physics.route.gauge; // "MG", "BG", "DG"
    const trackSpreadBottom = gauge === "MG" ? w * 0.28 : w * 0.34;

    // 1. Stone Ballast Shoulder Trapezoid
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(vanishX - 8, horizonY);
    ctx.lineTo(vanishX + 8, horizonY);
    ctx.lineTo(vanishX + trackSpreadBottom * 0.85, h);
    ctx.lineTo(vanishX - trackSpreadBottom * 0.85, h);
    ctx.closePath();
    ctx.fill();

    // Inner darker ballast core
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(vanishX - 5, horizonY);
    ctx.lineTo(vanishX + 5, horizonY);
    ctx.lineTo(vanishX + trackSpreadBottom * 0.62, h);
    ctx.lineTo(vanishX - trackSpreadBottom * 0.62, h);
    ctx.closePath();
    ctx.fill();

    // 2. Animated Concrete/Wooden Sleepers (scrolling smoothly with physics.distanceKm)
    const sleeperOffset = (physics.distanceKm * 1000) % 1.0; // 1 meter spacing
    const numSleepers = 34;

    for (let i = 1; i <= numSleepers; i++) {
      const z = (i - sleeperOffset) / numSleepers; // 0 (far) to 1 (near)
      const p = Math.pow(z, 2.25); // Perspective foreshortening
      const sy = horizonY + p * (h - horizonY);
      const halfWidth = 4 + p * (trackSpreadBottom * 0.56);
      const thickness = Math.max(1, p * 6.5);

      ctx.fillStyle = i % 2 === 0 ? "#64748b" : "#475569";
      ctx.fillRect(vanishX - halfWidth, sy - thickness * 0.5, halfWidth * 2, thickness);
    }

    // 3. Steel Rails (2 Rails for MG/BG, 3 Rails for Dual-Gauge DG!)
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3.2;

    // Left Common Rail
    ctx.beginPath();
    ctx.moveTo(vanishX - 2.5, horizonY);
    ctx.lineTo(vanishX - trackSpreadBottom * 0.42, h);
    ctx.stroke();

    // Right Outer Rail
    ctx.beginPath();
    ctx.moveTo(vanishX + 2.5, horizonY);
    ctx.lineTo(vanishX + trackSpreadBottom * 0.42, h);
    ctx.stroke();

    // Third Inner Meter-Gauge Rail if Dual Gauge (DG) route!
    if (gauge === "DG") {
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(vanishX + 1.0, horizonY);
      ctx.lineTo(vanishX + trackSpreadBottom * 0.16, h);
      ctx.stroke();
    }
  }

  // --------------------------------------------------------------------------
  // 2. 3D TRACKSIDE ENTITIES (BRIDGES, LEVEL CROSSINGS, STATIONS, PEOPLE)
  // --------------------------------------------------------------------------
  _draw3DTracksideEntities(ctx, w, h, vanishX, horizonY, physics) {
    const d = physics.distanceKm;

    // A. Steel Truss Bridges (Padma Bridge, Hardinge Bridge, Jamuna Bridge, Bhairab Bridge)
    if (physics.onBridge) {
      this._drawBridgeTrussTunnel(ctx, w, h, vanishX, horizonY, physics);
    }

    // B. Repeating Trackside Trees, KM Posts, & Telegraph/Signal Poles
    const repeatIntervalKm = 0.05; // Every 50 meters
    const baseIndex = Math.floor(d / repeatIntervalKm);

    for (let offset = 12; offset >= 1; offset--) {
      const idx = baseIndex + offset;
      const objKm = idx * repeatIntervalKm;
      const distAheadKm = objKm - d;
      if (distAheadKm <= 0.005 || distAheadKm > 0.6) continue;

      // Normalized depth (1.0 = right at camera, 0.0 = horizon)
      const z = 1.0 - distAheadKm / 0.6;
      const p = Math.pow(z, 2.1);
      const sy = horizonY + p * (h - horizonY);
      const scale = 0.08 + p * 1.35;
      const trackEdgeOffset = 12 + p * (w * 0.36);

      // Draw Tropical Trees (Palm, Banana, or Tea Garden Shade Trees) on left & right
      const side = idx % 2 === 0 ? -1 : 1;
      const tx = vanishX + side * (trackEdgeOffset + 45 * scale);
      this._drawBangladeshiTree(ctx, tx, sy, scale, idx);

      // Every 200m: Draw Authentic White Concrete KM Post & Signal Mast
      if (idx % 4 === 0) {
        const postX = vanishX - trackEdgeOffset * 0.85;
        this._drawKmPostAndSignal(ctx, postX, sy, scale, objKm, physics);
      }
    }

    // C. Upcoming Level Crossing (Rail Gate) with Gateman, CNG Auto-Rickshaws & Rickshaws
    for (const ev of physics.route.events) {
      if (ev.type === "level_crossing") {
        const distKm = ev.km - d;
        if (distKm > 0.01 && distKm < 0.55) {
          const z = 1.0 - distKm / 0.55;
          const p = Math.pow(z, 2.0);
          const sy = horizonY + p * (h - horizonY);
          const scale = 0.12 + p * 1.4;
          this._drawLevelCrossingScene(ctx, vanishX, sy, scale, physics.encroachingHazardActive, ev.name);
        }
      }
    }

    // D. Upcoming or Current Station Platform, Architecture, Crowd, Hawkers, & Token Pointsman
    for (const st of physics.route.stations) {
      const distKm = st.km - d;
      if (distKm > -0.12 && distKm < 0.65) {
        const clampedDist = Math.max(0.02, distKm);
        const z = 1.0 - clampedDist / 0.65;
        const p = Math.pow(Math.max(0.05, z), 1.9);
        const sy = horizonY + p * (h - horizonY);
        const scale = 0.15 + p * 1.45;
        this._drawStationAndPlatformLife(ctx, vanishX, sy, scale, st, physics);
      }
    }
  }

  _drawBridgeTrussTunnel(ctx, w, h, vanishX, horizonY, physics) {
    const style = physics.onBridge.bridgeStyle || "steel_truss";
    const strutOffset = (physics.distanceKm * 1000 * 0.12) % 1.0;

    // Color by iconic Bangladeshi bridge:
    // Hardinge Bridge = Deep Crimson (#881337), Padma Bridge = Steel Grey (#64748b), Jamuna = Ochre/Steel (#475569)
    let trussColor = "#475569";
    let accentColor = "#94a3b8";
    if (style === "hardinge_crimson") {
      trussColor = "#7f1d1d";
      accentColor = "#b91c1c";
    } else if (style === "padma_double_deck") {
      trussColor = "#334155";
      accentColor = "#cbd5e1";
    }

    ctx.save();
    for (let i = 8; i >= 1; i--) {
      const z = (i - strutOffset) / 8;
      const p = Math.pow(z, 1.85);
      const by = horizonY + p * (h - horizonY);
      const topY = horizonY - (0.08 + p * 0.42) * h;
      const halfW = 14 + p * (w * 0.44);
      const beamThick = Math.max(2, p * 16);

      ctx.strokeStyle = i % 2 === 0 ? trussColor : accentColor;
      ctx.lineWidth = beamThick;

      // Left & Right vertical steel truss columns
      ctx.beginPath();
      ctx.moveTo(vanishX - halfW, by);
      ctx.lineTo(vanishX - halfW, topY);
      ctx.lineTo(vanishX + halfW, topY);
      ctx.lineTo(vanishX + halfW, by);
      ctx.stroke();

      // Diagonal cross-bracing (Padma lower deck & Hardinge lattice)
      ctx.lineWidth = Math.max(1.5, beamThick * 0.55);
      ctx.beginPath();
      ctx.moveTo(vanishX - halfW, topY);
      ctx.lineTo(vanishX, topY + 25 * p);
      ctx.lineTo(vanishX + halfW, topY);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawBangladeshiTree(ctx, x, y, scale, seed) {
    ctx.save();
    // Trunk
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = Math.max(1.5, 5 * scale);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 48 * scale);
    ctx.stroke();

    // Palm fronds / lush tropical canopy
    ctx.fillStyle = seed % 3 === 0 ? "#15803d" : "#166534";
    ctx.beginPath();
    ctx.arc(x, y - 52 * scale, 22 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawKmPostAndSignal(ctx, x, y, scale, kmVal, physics) {
    ctx.save();
    // White KM stone post
    const pw = 14 * scale;
    const ph = 24 * scale;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x - pw, y - ph, pw, ph);
    if (scale > 0.45) {
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(9 * scale)}px sans-serif`;
      ctx.fillText(kmVal.toFixed(1), x - pw + 2, y - ph * 0.4);
    }

    // Signal Mast on left side of track
    const mastX = x - 18 * scale;
    const mastH = 85 * scale;
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = Math.max(1.5, 4 * scale);
    ctx.beginPath();
    ctx.moveTo(mastX, y);
    ctx.lineTo(mastX, y - mastH);
    ctx.stroke();

    // Signal Head Aspect (Green, Yellow, Double Yellow, Red)
    const aspect = physics.activeSignalAspect;
    let lightColor = "#22c55e";
    if (aspect === "RED") lightColor = "#ef4444";
    else if (aspect === "YELLOW" || aspect === "DOUBLE_YELLOW") lightColor = "#eab308";

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(mastX - 7 * scale, y - mastH - 12 * scale, 14 * scale, 24 * scale);

    ctx.beginPath();
    ctx.arc(mastX, y - mastH, 5.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = lightColor;
    ctx.fill();
    ctx.restore();
  }

  _drawLevelCrossingScene(ctx, vanishX, y, scale, hazardEncroaching, gateName) {
    ctx.save();
    const roadHalfW = 140 * scale;

    // Asphalt crossing road across the ballast
    ctx.fillStyle = "#334155";
    ctx.fillRect(vanishX - roadHalfW, y - 6 * scale, roadHalfW * 2, 12 * scale);

    // Red & White Rail Gate Barrier Poles
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = Math.max(2, 5 * scale);
    ctx.beginPath();
    ctx.moveTo(vanishX - roadHalfW * 0.75, y - 22 * scale);
    ctx.lineTo(vanishX + roadHalfW * 0.75, y - 22 * scale);
    ctx.stroke();

    // Green Bangladeshi CNG Auto-Rickshaw & Cycle-Rickshaw
    // If hazardEncroaching is true, they are right on the tracks until Horn [SPACE] is blown!
    const cngOffset = hazardEncroaching ? 8 * scale : roadHalfW * 0.68;
    const cngX = vanishX - cngOffset;
    const cngY = y - 16 * scale;

    // Green CNG Auto-Rickshaw body
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(cngX - 16 * scale, cngY - 14 * scale, 32 * scale, 18 * scale);
    ctx.fillStyle = "#1e293b"; // Canvas roof
    ctx.fillRect(cngX - 14 * scale, cngY - 22 * scale, 28 * scale, 8 * scale);

    // Colorful Cycle-Rickshaw on opposite side
    const rickX = vanishX + (hazardEncroaching ? 12 * scale : roadHalfW * 0.68);
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(rickX - 12 * scale, cngY - 18 * scale, 24 * scale, 18 * scale);
    ctx.fillStyle = "#fde047";
    ctx.fillRect(rickX - 10 * scale, cngY - 24 * scale, 20 * scale, 6 * scale);

    if (hazardEncroaching && scale > 0.35) {
      ctx.fillStyle = "#fef08a";
      ctx.font = `bold ${Math.max(11, Math.round(13 * scale))}px 'Segoe UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("⚠️ CNG & RICKSHAW ON TRACK! SOUND HORN [SPACE]!", vanishX, y - 48 * scale);
    }
    ctx.restore();
  }

  _drawStationAndPlatformLife(ctx, vanishX, y, scale, station, physics) {
    ctx.save();
    const isLeft = station.platformSide !== "right";
    const sideSign = isLeft ? -1 : 1;
    const platEdgeX = vanishX + sideSign * (42 * scale);
    const platWidth = 115 * scale;
    const platX = isLeft ? platEdgeX - platWidth : platEdgeX;

    // Concrete Station Platform with Yellow Safety Line
    ctx.fillStyle = "#64748b";
    ctx.fillRect(platX, y - 16 * scale, platWidth, 18 * scale);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(isLeft ? platEdgeX - 4 * scale : platEdgeX, y - 16 * scale, 4 * scale, 18 * scale);

    // Iconic Bangladeshi Station Roof Canopy (Kamalapur Parasol Arches or Oyster Dome)
    ctx.fillStyle = station.landmark === "coxsbazar_oyster" ? "#38bdf8" : "#cbd5e1";
    ctx.beginPath();
    for (let a = 0; a < 3; a++) {
      const archX = platX + (a + 0.5) * (platWidth / 3);
      ctx.arc(archX, y - 56 * scale, (platWidth / 5), Math.PI, 0);
    }
    ctx.fill();

    // Bilingual Green & White Bangladesh Railway Station Nameboard
    if (scale > 0.25) {
      const boardW = 110 * scale;
      const boardH = 26 * scale;
      const bx = platX + platWidth * 0.1;
      const by = y - 48 * scale;
      ctx.fillStyle = "#006a4e";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.fillRect(bx, by, boardW, boardH);
      ctx.strokeRect(bx, by, boardW, boardH);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(8, Math.round(10 * scale))}px 'Segoe UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(station.bn || station.name, bx + boardW * 0.5, by + boardH * 0.65);
    }

    // Platform Passengers, Red-Shirt Coolies, & Tea Stall Hawkers
    for (let p = 0; p < 5; p++) {
      const px = platX + (p + 1) * (platWidth / 6);
      const py = y - 16 * scale;
      ctx.fillStyle = p % 2 === 0 ? "#e11d48" : "#0284c7";
      ctx.fillRect(px - 3 * scale, py - 18 * scale, 6 * scale, 18 * scale);
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath();
      ctx.arc(px, py - 21 * scale, 3.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // If this is a Single-Line Token Exchange Station, draw the Pointsman holding out the Neale's Ball Token Hoop!
    if (station.tokenExchange && !physics.tokenExchangeDoneMap[station.id]) {
      const pmX = platEdgeX - sideSign * 6 * scale;
      const pmY = y - 16 * scale;

      // Pointsman uniform
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(pmX - 4 * scale, pmY - 22 * scale, 8 * scale, 22 * scale);

      // Extended arm holding the Golden Circular Token Hoop toward the locomotive cab!
      const hoopX = pmX - sideSign * 16 * scale;
      const hoopY = pmY - 24 * scale;
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = Math.max(2, 3.5 * scale);
      ctx.beginPath();
      ctx.arc(hoopX, hoopY, 9 * scale, 0, Math.PI * 2);
      ctx.stroke();

      if (scale > 0.35) {
        ctx.fillStyle = "#fde047";
        ctx.font = `bold ${Math.max(10, Math.round(12 * scale))}px 'Segoe UI', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("🟡 TOKEN HOOP READY! ALP PRESS [O] (15–30 km/h)", vanishX, y - 78 * scale);
      }
    }

    ctx.restore();
  }

  _drawWeatherEffects(ctx, w, h, horizonY, physics, dt) {
    // Winter River Fog (Kuasha)
    if (this.weatherMode === "winter_fog") {
      const fogGrad = ctx.createLinearGradient(0, horizonY - 80, 0, h * 0.78);
      fogGrad.addColorStop(0, "rgba(203, 213, 225, 0.88)");
      fogGrad.addColorStop(0.55, "rgba(203, 213, 225, 0.65)");
      fogGrad.addColorStop(1, "rgba(203, 213, 225, 0.08)");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Monsoon Rain Deluge (Barsha)
    if (this.weatherMode === "monsoon_rain") {
      ctx.strokeStyle = "rgba(186, 230, 253, 0.55)";
      ctx.lineWidth = 1.6;
      this.rainDrops.forEach((drop) => {
        drop.y += drop.speed * dt * 1.9;
        drop.x -= 0.15 * dt;
        if (drop.y > 1.0) {
          drop.y = 0;
          drop.x = Math.random();
        }
        if (drop.x < 0) drop.x = 1.0;

        const rx = drop.x * w;
        const ry = drop.y * h;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 6, ry + drop.len);
        ctx.stroke();
      });
    }
  }

  // --------------------------------------------------------------------------
  // 3. AUTHENTIC BANGLADESHI LOCOMOTIVE CAB INTERIOR & DUAL-DRIVER DESK
  // --------------------------------------------------------------------------
  _renderCabInteriorOverlay(ctx, w, h, physics, dt, swayX, swayY) {
    ctx.save();
    ctx.translate(swayX * 0.35, swayY * 0.35);

    const locoColor = physics.loco.liveryPrimary || "#006a4e";

    // 1. Windshield Wipers (Animated Left & Right Blades)
    [w * 0.28, w * 0.72].forEach((wx) => {
      const wy = h * 0.09;
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(this.wiperAngle * 0.55);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, h * 0.34);
      ctx.stroke();
      ctx.fillRect(-3, h * 0.18, 6, h * 0.22);
      ctx.restore();
    });

    // 2. Cab Structural Frame (Top Header, Center Pillar, Side Pillars)
    ctx.fillStyle = "#1e293b";
    // Top header
    ctx.fillRect(-20, -20, w + 40, h * 0.10);
    // Center windshield divider pillar
    ctx.fillRect(w * 0.485, h * 0.08, w * 0.03, h * 0.49);
    // Left & Right A-pillars
    ctx.fillRect(-20, 0, w * 0.055, h);
    ctx.fillRect(w * 0.945, 0, w * 0.075, h);

    // 3. Cultural Bangladeshi Cab Touches:
    // Marigold Flower Garland (Genda Phul) draped across top of windshields!
    for (let gx = w * 0.07; gx <= w * 0.93; gx += 22) {
      const sag = Math.sin(((gx - w * 0.07) / (w * 0.86)) * Math.PI * 2) * 8;
      ctx.beginPath();
      ctx.arc(gx, h * 0.095 + Math.abs(sag), 6.5, 0, Math.PI * 2);
      ctx.fillStyle = gx % 44 < 22 ? "#f97316" : "#facc15";
      ctx.fill();
    }

    // Overhead Spinning Metal Cab Fan on Center Header
    const fanX = w * 0.5;
    const fanY = h * 0.048;
    ctx.save();
    ctx.translate(fanX, fanY);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(this.fanAngle);
    for (let b = 0; b < 3; b++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(-3, 2, 6, 17);
    }
    ctx.restore();

    // Hanging Neale's Ball Token Brass Pouch on ALP Right Pillar (if carrying token)
    if (physics.hasCurrentSectionToken) {
      const tokX = w * 0.935;
      const tokY = h * 0.32;
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(tokX, tokY, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#b45309";
      ctx.beginPath();
      ctx.arc(tokX, tokY + 12, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Lower Dual-Driver Control Console Desk (Bottom 43% of Viewport)
    const deskTopY = h * 0.57;
    const deskGrad = ctx.createLinearGradient(0, deskTopY, 0, h);
    deskGrad.addColorStop(0, "#1e293b");
    deskGrad.addColorStop(0.12, "#0f172a");
    deskGrad.addColorStop(1, "#020617");
    ctx.fillStyle = deskGrad;
    ctx.fillRect(-20, deskTopY, w + 40, h - deskTopY + 20);

    // Locomotive Livery Accent Trim Strip along Desk Edge
    ctx.fillStyle = locoColor;
    ctx.fillRect(0, deskTopY, w, 6);
    ctx.fillStyle = physics.loco.liverySecondary || "#f42a41";
    ctx.fillRect(0, deskTopY + 6, w, 3);

    // 5. Analog Cab Gauges with Real-Time Animated Needles
    const gaugeY = deskTopY + 68;
    // Gauge 1: Speedometer (km/h)
    this._drawAnalogGauge(ctx, w * 0.16, gaugeY, 46, physics.speedKmh, 0, 120, "SPEED", "km/h", physics.currentSpeedLimitKmh);
    // Gauge 2: Traction Ammeter (Amps)
    this._drawAnalogGauge(ctx, w * 0.30, gaugeY, 42, physics.amps, 0, 1200, "LOAD", "AMPS", 950);
    // Gauge 3: Duplex Air Brake Gauge (BP = Green needle, BC = Red needle)
    this._drawBrakeDuplexGauge(ctx, w * 0.44, gaugeY, 44, physics.brakePipePressure, physics.brakeCylinderPressure);
    // Gauge 4: Prime Mover RPM & Water Temp (ALP Side)
    this._drawAnalogGauge(ctx, w * 0.72, gaugeY, 42, physics.rpm, 0, 1000, "ENGINE", "RPM", 910);
    this._drawAnalogGauge(ctx, w * 0.85, gaugeY, 42, physics.waterTempC, 40, 110, "COOLANT", "°C", 92);

    // 6. Central In-Cab Signal & Co-Op Status Display Unit (EM2000 / BR Cab Aspect Box)
    this._drawCabSignalBox(ctx, w * 0.575, deskTopY + 24, 128, 92, physics);

    // 7. Thermos Tea Cup ("Cha") on Dashboard Ledge
    const cupX = w * 0.655;
    const cupY = deskTopY - 8;
    ctx.fillStyle = "#d97706";
    ctx.fillRect(cupX, cupY - 18, 16, 18);
    ctx.strokeStyle = "#fef3c7";
    ctx.lineWidth = 2;
    ctx.strokeRect(cupX, cupY - 18, 16, 18);

    ctx.restore();
  }

  _drawAnalogGauge(ctx, cx, cy, r, value, minVal, maxVal, title, unit, redlineVal) {
    ctx.save();
    // Brass/Steel Bezel
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = "#475569";
    ctx.fill();

    // Dial face
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#090d16";
    ctx.fill();

    const startAng = Math.PI * 0.75;
    const endAng = Math.PI * 2.25;
    const totalSpan = endAng - startAng;

    // Ticks
    for (let i = 0; i <= 10; i++) {
      const frac = i / 10;
      const ang = startAng + frac * totalSpan;
      const tickVal = minVal + frac * (maxVal - minVal);
      const isDanger = redlineVal && tickVal >= redlineVal;

      ctx.strokeStyle = isDanger ? "#ef4444" : "#94a3b8";
      ctx.lineWidth = i % 2 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * (r - 8), cy + Math.sin(ang) * (r - 8));
      ctx.lineTo(cx + Math.cos(ang) * (r - 2), cy + Math.sin(ang) * (r - 2));
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 9px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, cx, cy - r * 0.32);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`${Math.round(value)}`, cx, cy + r * 0.52);
    ctx.fillStyle = "#64748b";
    ctx.font = "8px sans-serif";
    ctx.fillText(unit, cx, cy + r * 0.74);

    // Needle
    const clamped = Math.max(minVal, Math.min(maxVal, value));
    const needleAng = startAng + ((clamped - minVal) / (maxVal - minVal)) * totalSpan;
    ctx.strokeStyle = redlineVal && value >= redlineVal ? "#ef4444" : "#f59e0b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleAng) * (r - 9), cy + Math.sin(needleAng) * (r - 9));
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#e2e8f0";
    ctx.fill();
    ctx.restore();
  }

  _drawBrakeDuplexGauge(ctx, cx, cy, r, bp, bc) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = "#475569";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#090d16";
    ctx.fill();

    const startAng = Math.PI * 0.75;
    const totalSpan = Math.PI * 1.5;

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("AIR BRAKE (kg/cm²)", cx, cy - r * 0.32);
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 10px monospace";
    ctx.fillText(`BP:${bp.toFixed(1)}`, cx - 14, cy + r * 0.55);
    ctx.fillStyle = "#ef4444";
    ctx.fillText(`BC:${bc.toFixed(1)}`, cx + 15, cy + r * 0.55);

    // BP Needle (Green)
    const bpAng = startAng + (Math.min(6, Math.max(0, bp)) / 6) * totalSpan;
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(bpAng) * (r - 8), cy + Math.sin(bpAng) * (r - 8));
    ctx.stroke();

    // BC Needle (Red)
    const bcAng = startAng + (Math.min(6, Math.max(0, bc)) / 6) * totalSpan;
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(bcAng) * (r - 11), cy + Math.sin(bcAng) * (r - 11));
    ctx.stroke();

    ctx.restore();
  }

  _drawCabSignalBox(ctx, x, y, bw, bh, physics) {
    ctx.save();
    ctx.fillStyle = "#090d16";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.fillRect(x - bw / 2, y, bw, bh);
    ctx.strokeRect(x - bw / 2, y, bw, bh);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CAB ASPECT & LIMIT", x, y + 14);

    // 3 Aspect Lamps
    const aspect = physics.activeSignalAspect;
    const lamps = [
      { id: "GREEN", c: "#22c55e", active: aspect === "GREEN", lx: x - 34 },
      { id: "YELLOW", c: "#eab308", active: aspect === "YELLOW" || aspect === "DOUBLE_YELLOW", lx: x },
      { id: "RED", c: "#ef4444", active: aspect === "RED", lx: x + 34 }
    ];

    lamps.forEach((l) => {
      ctx.beginPath();
      ctx.arc(l.lx, y + 36, 11, 0, Math.PI * 2);
      ctx.fillStyle = l.active ? l.c : "rgba(51, 65, 85, 0.4)";
      ctx.fill();
    });

    ctx.fillStyle = physics.speedKmh > physics.currentSpeedLimitKmh ? "#ef4444" : "#38bdf8";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`LIMIT: ${physics.currentSpeedLimitKmh} km/h`, x, y + 66);

    ctx.fillStyle = physics.wheelSlip ? "#ef4444" : (physics.alarmChainPulled ? "#f97316" : "#10b981");
    ctx.font = "bold 9px sans-serif";
    const statusText = physics.wheelSlip
      ? "⚠️ WHEEL SLIP! [X] SAND"
      : physics.alarmChainPulled
      ? "🚨 ACP PULLED! [P] RESET"
      : physics.groundRelayTripped
      ? "⚡ GR TRIP! [K] RESET"
      : "SYSTEMS NORMAL";
    ctx.fillText(statusText, x, y + 83);
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 4. ALP SIDE DOORWAY LEAN-OUT VIEW (TOKEN SNATCH & GUARD FLAG CHECK)
  // --------------------------------------------------------------------------
  _renderAlpWindowView(ctx, w, h, physics, dt, swayX, swayY) {
    this._render3DWorldOutWindow(ctx, w, h, physics, dt, swayX, swayY);

    // Draw Locomotive Side Hood & trailing PT INKA Red-Green Coaches curving behind
    ctx.save();
    ctx.fillStyle = physics.loco.liveryPrimary || "#006a4e";
    ctx.fillRect(0, h * 0.12, w * 0.22, h * 0.88);
    ctx.fillStyle = physics.loco.liverySecondary || "#f42a41";
    ctx.fillRect(0, h * 0.52, w * 0.22, 26);

    // ALP Extended Arm & Token Hoop Catch Target Zone
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(w * 0.26, h * 0.35, w * 0.48, h * 0.36);

    ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
    ctx.fillRect(w * 0.26, h * 0.73, w * 0.48, 54);
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 13px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ALP SIDE DOORWAY VIEW — Press [O] to Snatch Token Hoop (15–30 km/h) | [L] Check Guard Flag", w * 0.5, h * 0.77);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px sans-serif";
    ctx.fillText(
      physics.nearTokenStation
        ? `Approaching ${physics.nearTokenStation.name} Pointsman! Current Speed: ${Math.round(physics.speedKmh)} km/h`
        : "Clear side look-back along the 16-coach rake. Guard Brake Van visible at rear.",
      w * 0.5,
      h * 0.81
    );
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 5. EXTERIOR CHASE / BRIDGE FLYBY CAMERA VIEW
  // --------------------------------------------------------------------------
  _renderExteriorChaseView(ctx, w, h, physics, dt) {
    const horizonY = h * 0.52;
    this._drawSkyAndSun(ctx, w, h, horizonY);
    this._drawDistantHorizon(ctx, w, horizonY, physics);
    this._drawGroundBiome(ctx, w, h, horizonY, physics);

    // Side-profile Viaduct / Steel Truss Bridge or Embankment
    const bridgeY = h * 0.68;
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, bridgeY, w, 26);

    // Bridge piers
    const pierOffset = (physics.distanceKm * 1000 * 1.8) % 180;
    ctx.fillStyle = "#475569";
    for (let px = -pierOffset; px < w + 180; px += 180) {
      ctx.fillRect(px, bridgeY + 26, 28, h - bridgeY);
    }

    // Draw Trailing PT INKA / LHB Passenger Coaches in Red & Green Flag Livery
    for (let c = 0; c < 4; c++) {
      const cx = w * 0.04 + c * 155;
      const cy = bridgeY - 52;
      ctx.fillStyle = "#006a4e";
      ctx.fillRect(cx, cy, 145, 44);
      ctx.fillStyle = "#f42a41";
      ctx.fillRect(cx, cy + 16, 145, 14);
      // Coach windows
      ctx.fillStyle = "#fef08a";
      for (let win = 0; win < 6; win++) {
        ctx.fillRect(cx + 10 + win * 22, cy + 6, 14, 9);
      }
    }

    // Draw Lead Bangladesh Railway Locomotive
    const lx = w * 0.64;
    const ly = bridgeY - 62;
    ctx.fillStyle = physics.loco.liveryPrimary || "#006a4e";
    ctx.fillRect(lx, ly, 175, 54);
    ctx.fillStyle = physics.loco.liverySecondary || "#f42a41";
    ctx.fillRect(lx, ly + 24, 175, 14);

    // Cab window & BR Logo
    ctx.fillStyle = "#bae6fd";
    ctx.fillRect(lx + 132, ly + 8, 30, 16);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(`BR ${physics.loco.code}`, lx + 18, ly + 20);

    // Diesel Exhaust Smoke Plume proportional to Throttle Notch
    const smokeCount = 3 + physics.notch;
    for (let s = 0; s < smokeCount; s++) {
      const sx = lx + 65 - s * 18 - ((Date.now() * 0.08) % 20);
      const sy = ly - 10 - s * 9;
      ctx.beginPath();
      ctx.arc(sx, sy, 8 + s * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(30, 41, 59, ${Math.max(0.08, 0.45 - s * 0.04)})`;
      ctx.fill();
    }

    // Overhead Steel Bridge Truss if currently crossing Hardinge / Padma / Jamuna / Bhairab Bridge
    if (physics.onBridge) {
      ctx.strokeStyle = physics.onBridge.bridgeStyle === "hardinge_crimson" ? "#991b1b" : "#94a3b8";
      ctx.lineWidth = 6;
      const trussShift = (physics.distanceKm * 1000 * 2.5) % 120;
      for (let tx = -trussShift; tx < w + 120; tx += 120) {
        ctx.beginPath();
        ctx.moveTo(tx, bridgeY);
        ctx.lineTo(tx + 60, bridgeY - 115);
        ctx.lineTo(tx + 120, bridgeY);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, bridgeY - 115);
      ctx.lineTo(w, bridgeY - 115);
      ctx.stroke();
    }
  }
}

window.BRSim.Renderer3D = new BangladeshRailway3DRenderer();

