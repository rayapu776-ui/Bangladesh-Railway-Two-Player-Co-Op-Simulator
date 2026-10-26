// ============================================================================
// TRACKS OF BENGAL: BANGLADESH RAILWAY CO-OP SIMULATOR
// Module: mapEngine.js — Complete Bangladesh Railway Interactive Network Map
// ============================================================================

window.BRSim = window.BRSim || {};

class BangladeshRailwayMapRenderer {
  constructor() {
    this.nodesById = {};
    window.BRSim.DATA.networkNodes.forEach((n) => {
      this.nodesById[n.id] = n;
    });
    this.hoveredNode = null;
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
  }

  // Computes exact (x, y) map coordinates of the train based on distanceKm
  getTrainMapPosition(route, distanceKm) {
    const seq = route.nodeSequence || [];
    if (seq.length === 0) return { x: 525, y: 515 };
    const ratio = Math.max(0, Math.min(1, distanceKm / Math.max(0.1, route.totalDistanceKm)));
    const scaledIdx = ratio * (seq.length - 1);
    const i0 = Math.floor(scaledIdx);
    const i1 = Math.min(seq.length - 1, i0 + 1);
    const frac = scaledIdx - i0;

    const n0 = this.nodesById[seq[i0]] || { x: 525, y: 515 };
    const n1 = this.nodesById[seq[i1]] || n0;

    return {
      x: n0.x + (n1.x - n0.x) * frac,
      y: n0.y + (n1.y - n0.y) * frac
    };
  }

  // Renders either the HUD radar mini-map or the Full-Screen Interactive Network Map
  renderMap(canvas, physics, isFullModal = false) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Background delta terrain & Bay of Bengal
    const bgGrad = ctx.createRadialGradient(w * 0.48, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.75);
    bgGrad.addColorStop(0, "#0b241c");
    bgGrad.addColorStop(0.7, "#071712");
    bgGrad.addColorStop(1, "#040d14");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle topographic grid
    ctx.strokeStyle = "rgba(16, 185, 129, 0.08)";
    ctx.lineWidth = 1;
    const step = isFullModal ? 45 : 28;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const scaleX = w / 1000;
    const scaleY = h / 1000;

    // 1. Draw Major River Systems of Bangladesh (Jamuna, Padma, Meghna, Karnaphuli)
    this._drawMajorRivers(ctx, scaleX, scaleY, isFullModal);

    // 2. Draw All Network Edges Color-Coded by Gauge (MG, BG, DG)
    const activeNodeSet = new Set(physics.route.nodeSequence || []);
    window.BRSim.DATA.networkEdges.forEach(([idA, idB, gauge]) => {
      const a = this.nodesById[idA];
      const b = this.nodesById[idB];
      if (!a || !b) return;

      const isActiveEdge = activeNodeSet.has(idA) && activeNodeSet.has(idB);
      ctx.beginPath();
      ctx.moveTo(a.x * scaleX, a.y * scaleY);
      ctx.lineTo(b.x * scaleX, b.y * scaleY);

      if (gauge === "MG") ctx.strokeStyle = isActiveEdge ? "#38bdf8" : "rgba(56, 189, 248, 0.35)";
      else if (gauge === "BG") ctx.strokeStyle = isActiveEdge ? "#fb7185" : "rgba(251, 113, 133, 0.35)";
      else ctx.strokeStyle = isActiveEdge ? "#fbbf24" : "rgba(251, 191, 36, 0.42)";

      ctx.lineWidth = isActiveEdge ? (isFullModal ? 4.2 : 2.8) : (isFullModal ? 2.0 : 1.2);
      ctx.stroke();
    });

    // 3. Highlight Active Route Path with Animated Dash
    const seq = physics.route.nodeSequence || [];
    if (seq.length > 1) {
      ctx.save();
      ctx.beginPath();
      seq.forEach((nodeId, idx) => {
        const n = this.nodesById[nodeId];
        if (!n) return;
        if (idx === 0) ctx.moveTo(n.x * scaleX, n.y * scaleY);
        else ctx.lineTo(n.x * scaleX, n.y * scaleY);
      });
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = isFullModal ? 3.0 : 2.0;
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -(Date.now() * 0.025) % 20;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw All Railway Stations & Junctions
    window.BRSim.DATA.networkNodes.forEach((node) => {
      const nx = node.x * scaleX;
      const ny = node.y * scaleY;
      const onRoute = activeNodeSet.has(node.id);

      ctx.beginPath();
      const radius = onRoute ? (isFullModal ? 5.5 : 3.5) : (node.major ? (isFullModal ? 4.0 : 2.4) : (isFullModal ? 2.6 : 1.5));
      ctx.arc(nx, ny, radius, 0, Math.PI * 2);

      if (onRoute) {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = node.major ? "#94a3b8" : "rgba(148, 163, 184, 0.55)";
        ctx.fill();
      }

      // Labels on full modal or major active stations on mini-map
      if (isFullModal || (onRoute && node.major)) {
        ctx.font = isFullModal
          ? (onRoute || node.major ? "bold 11px 'Segoe UI', sans-serif" : "10px 'Segoe UI', sans-serif")
          : "bold 9px 'Segoe UI', sans-serif";
        ctx.fillStyle = onRoute ? "#ecfdf5" : (node.major ? "#cbd5e1" : "rgba(203, 213, 225, 0.7)");
        ctx.fillText(isFullModal ? node.name : node.name.split(" ")[0], nx + 7, ny + 3);
      }
    });

    // 5. Draw Live Train Position Beacon
    const trainPos = this.getTrainMapPosition(physics.route, physics.distanceKm);
    const tx = trainPos.x * scaleX;
    const ty = trainPos.y * scaleY;
    const pulse = 5 + Math.sin(Date.now() * 0.008) * 3;

    ctx.beginPath();
    ctx.arc(tx, ty, pulse * (isFullModal ? 1.6 : 1.1), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(244, 42, 65, 0.35)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tx, ty, isFullModal ? 6.5 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#f42a41";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    if (isFullModal) {
      ctx.fillStyle = "#fde047";
      ctx.font = "bold 12px 'Segoe UI', sans-serif";
      ctx.fillText(`🚂 ${physics.route.trainNo} (${Math.round(physics.speedKmh)} km/h)`, tx + 10, ty - 8);
    }

    ctx.restore();
  }

  _drawMajorRivers(ctx, scaleX, scaleY, isFullModal) {
    ctx.save();
    ctx.strokeStyle = "rgba(14, 116, 144, 0.38)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Jamuna-Brahmaputra River Spine
    ctx.lineWidth = isFullModal ? 16 : 9;
    ctx.beginPath();
    ctx.moveTo(415 * scaleX, 80 * scaleY);
    ctx.quadraticCurveTo(405 * scaleX, 260 * scaleY, 402 * scaleX, 395 * scaleY);
    ctx.quadraticCurveTo(408 * scaleX, 480 * scaleY, 485 * scaleX, 550 * scaleY);
    ctx.stroke();

    // Padma River (Hardinge Bridge to Mawa to Chandpur)
    ctx.lineWidth = isFullModal ? 15 : 8;
    ctx.beginPath();
    ctx.moveTo(160 * scaleX, 445 * scaleY);
    ctx.quadraticCurveTo(283 * scaleX, 470 * scaleY, 485 * scaleX, 550 * scaleY);
    ctx.quadraticCurveTo(535 * scaleX, 585 * scaleY, 560 * scaleX, 740 * scaleY);
    ctx.stroke();

    // Upper Meghna River (Bhairab to Chandpur)
    ctx.lineWidth = isFullModal ? 11 : 6;
    ctx.beginPath();
    ctx.moveTo(690 * scaleX, 310 * scaleY);
    ctx.quadraticCurveTo(605 * scaleX, 445 * scaleY, 550 * scaleX, 595 * scaleY);
    ctx.stroke();

    if (isFullModal) {
      ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
      ctx.font = "italic bold 12px 'Segoe UI', sans-serif";
      ctx.fillText("JAMUNA RIVER (যমুনা নদী)", 392 * scaleX, 345 * scaleY);
      ctx.fillText("PADMA RIVER (পদ্মা নদী)", 340 * scaleX, 520 * scaleY);
      ctx.fillText("MEGHNA RIVER (মেঘনা নদী)", 590 * scaleX, 495 * scaleY);
      ctx.fillText("BAY OF BENGAL (বঙ্গোপসাগর)", 570 * scaleX, 885 * scaleY);
    }

    ctx.restore();
  }
}

window.BRSim.MapRenderer = new BangladeshRailwayMapRenderer();

