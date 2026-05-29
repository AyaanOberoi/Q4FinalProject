(function () {
  const canvas = document.getElementById("studioHeroCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function roundedRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function line3d(x1, y1, x2, y2, color, alpha, widthValue) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = widthValue;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPresenter(cx, floorY, scale, t) {
    const bob = Math.sin(t * 1.6) * 3;
    const headY = floorY - 154 * scale + bob;
    const torsoY = floorY - 96 * scale + bob;
    const armSwing = Math.sin(t * 2.1) * 0.06;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 26;
    ctx.fillStyle = "#05080c";

    ctx.beginPath();
    ctx.ellipse(cx, headY, 20 * scale, 24 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    roundedRect(cx - 28 * scale, torsoY - 44 * scale, 56 * scale, 96 * scale, 24 * scale);
    ctx.fill();

    ctx.save();
    ctx.translate(cx + 24 * scale, torsoY - 22 * scale);
    ctx.rotate(-0.42 + armSwing);
    roundedRect(0, -5 * scale, 122 * scale, 10 * scale, 6 * scale);
    ctx.fill();
    ctx.fillStyle = "#f4b942";
    roundedRect(104 * scale, -3 * scale, 62 * scale, 6 * scale, 4 * scale);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(61, 214, 200, 0.12)";
    ctx.beginPath();
    ctx.ellipse(cx, floorY + 8 * scale, 66 * scale, 15 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawScreen(x, y, w, h, t) {
    const pulse = 0.5 + Math.sin(t * 1.8) * 0.5;

    ctx.save();
    ctx.shadowColor = "rgba(61, 214, 200, 0.32)";
    ctx.shadowBlur = 34 + pulse * 18;
    roundedRect(x - 14, y - 14, w + 28, h + 28, 30);
    ctx.fillStyle = "rgba(61, 214, 200, 0.07)";
    ctx.fill();
    ctx.shadowBlur = 0;

    roundedRect(x - 10, y - 10, w + 20, h + 20, 26);
    ctx.fillStyle = "#111923";
    ctx.fill();

    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, "#0e3840");
    gradient.addColorStop(0.55, "#071016");
    gradient.addColorStop(1, "#261b07");
    roundedRect(x, y, w, h, 18);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.save();
    roundedRect(x, y, w, h, 18);
    ctx.clip();

    for (let i = 0; i < 10; i += 1) {
      const sx = x + ((i * 112 + t * 16) % (w + 160)) - 100;
      line3d(sx, y + 26, sx + 170, y + h - 26, "#3dd6c8", 0.12, 1.5);
    }

    ctx.fillStyle = "#f4b942";
    ctx.font = "900 " + Math.max(42, w * 0.09) + "px Inter, Arial, sans-serif";
    ctx.fillText("CBN", x + w * 0.08, y + h * 0.23);
    ctx.fillStyle = "#f2f6fa";
    ctx.font = "900 " + Math.max(32, w * 0.065) + "px Inter, Arial, sans-serif";
    ctx.fillText("LIVE BRIEF", x + w * 0.08, y + h * 0.36);
    ctx.fillStyle = "rgba(242, 246, 250, 0.7)";
    ctx.font = "700 " + Math.max(15, w * 0.026) + "px Inter, Arial, sans-serif";
    ctx.fillText("story  /  business angle  /  class connection", x + w * 0.08, y + h * 0.45);

    const bars = [
      ["Revenue", 0.8, "#3dd6c8"],
      ["Audience", 0.56, "#f4b942"],
      ["Market", 0.68, "#3dd6c8"]
    ];
    bars.forEach(function (bar, index) {
      const by = y + h * 0.58 + index * h * 0.105;
      const bw = w * 0.42;
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      roundedRect(x + w * 0.09, by, bw, 15, 8);
      ctx.fill();
      ctx.fillStyle = bar[2];
      roundedRect(x + w * 0.09, by, bw * (bar[1] + Math.sin(t * 1.4 + index) * 0.035), 15, 8);
      ctx.fill();
      ctx.fillStyle = "#f2f6fa";
      ctx.font = "800 " + Math.max(14, w * 0.022) + "px Inter, Arial, sans-serif";
      ctx.fillText(bar[0], x + w * 0.56, by + 14);
    });

    roundedRect(x + w * 0.68, y + h * 0.58, w * 0.2, h * 0.18, 18);
    ctx.fillStyle = "rgba(244, 185, 66, 0.95)";
    ctx.fill();
    ctx.fillStyle = "#071016";
    ctx.font = "900 " + Math.max(18, w * 0.032) + "px Inter, Arial, sans-serif";
    ctx.fillText("READY", x + w * 0.715, y + h * 0.66);
    ctx.font = "800 " + Math.max(12, w * 0.018) + "px Inter, Arial, sans-serif";
    ctx.fillText("TO PRESENT", x + w * 0.715, y + h * 0.715);
    ctx.restore();
    ctx.restore();
  }

  function draw(time) {
    window.CBNHeroReady = true;
    window.CBNHeroFrame = (window.CBNHeroFrame || 0) + 1;
    const t = time * 0.001;
    ctx.clearRect(0, 0, width, height);

    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#07090d");
    background.addColorStop(0.55, "#0b1118");
    background.addColorStop(1, "#080a0d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const glowX = width * (0.58 + Math.sin(t * 0.4) * 0.03);
    const glow = ctx.createRadialGradient(glowX, height * 0.36, 0, glowX, height * 0.36, Math.max(width, height) * 0.7);
    glow.addColorStop(0, "rgba(61, 214, 200, 0.24)");
    glow.addColorStop(0.34, "rgba(61, 214, 200, 0.08)");
    glow.addColorStop(1, "rgba(61, 214, 200, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const floorY = height * 0.78;
    ctx.save();
    ctx.strokeStyle = "rgba(61, 214, 200, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i += 1) {
      const y = floorY + i * 22;
      ctx.beginPath();
      ctx.moveTo(width * 0.08, y);
      ctx.lineTo(width * 0.94, y + i * 8);
      ctx.stroke();
    }
    for (let i = -8; i <= 8; i += 1) {
      ctx.beginPath();
      ctx.moveTo(width * 0.5, floorY);
      ctx.lineTo(width * 0.5 + i * width * 0.08, height + 70);
      ctx.stroke();
    }
    ctx.restore();

    const screenW = Math.min(width * 0.54, 700);
    const screenH = screenW * 0.56;
    const screenX = width * 0.47;
    const screenY = Math.max(58, height * 0.13);
    drawScreen(screenX, screenY, screenW, screenH, t);

    const presenterScale = Math.max(0.86, Math.min(1.2, width / 1100));
    drawPresenter(width * 0.42, floorY + 8, presenterScale, t);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pointerStartX = width * 0.42 + 122 * presenterScale;
    const pointerStartY = floorY - 90 * presenterScale;
    const pointerEndX = screenX + screenW * (0.7 + Math.sin(t * 1.3) * 0.08);
    const pointerEndY = screenY + screenH * (0.38 + Math.cos(t * 1.1) * 0.08);
    const laserGradient = ctx.createLinearGradient(pointerStartX, pointerStartY, pointerEndX, pointerEndY);
    laserGradient.addColorStop(0, "rgba(244, 185, 66, 0.15)");
    laserGradient.addColorStop(1, "rgba(244, 185, 66, 0.85)");
    ctx.strokeStyle = laserGradient;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pointerStartX, pointerStartY);
    ctx.lineTo(pointerEndX, pointerEndY);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < 7; i += 1) {
      const cardX = width * 0.58 + i * 58 + Math.sin(t + i) * 8;
      const cardY = height * 0.72 + Math.cos(t * 1.2 + i) * 10;
      roundedRect(cardX, cardY, 46, 28, 6);
      ctx.fillStyle = i % 2 ? "rgba(244, 185, 66, 0.22)" : "rgba(61, 214, 200, 0.18)";
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
})();
