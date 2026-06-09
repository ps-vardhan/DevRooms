export const foamBrush = (ctx, { start, end, color, size }) => {
    ctx.save();
  
    // Draw an initial arc-y stroke
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.7;
    const steps = 20;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
  
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = start.x + dx * t;
      const y =
        start.y +
        dy * t +
        Math.sin(t * Math.PI * 2) * (size * 0.8) * (1 - t);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  
    // Speckled foam effect near the end
    const foamParticles = 10;
    for (let i = 0; i < foamParticles; i++) {
      ctx.beginPath();
      const x = end.x + (Math.random() - 0.5) * size * 2;
      const y = end.y + (Math.random() - 0.5) * size * 2;
      const radius = Math.random() * (size * 0.5);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = color;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  
    ctx.restore();
  };