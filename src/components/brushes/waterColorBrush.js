export const watercolorBrush = (ctx, { start, end, color, size }) => {
    ctx.save();
    ctx.lineCap = 'round';
  
    // Base stroke with slight transparency
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  
    // Feather edges to mimic watercolor bleed
    const steps = 10;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    for (let i = 0; i < steps; i++) {
      ctx.beginPath();
      ctx.lineWidth = size * (0.5 + Math.random() * 0.5);
      ctx.globalAlpha = 0.1 + Math.random() * 0.3;
      ctx.moveTo(
        start.x + (dx * i) / steps,
        start.y + (dy * i) / steps
      );
      ctx.lineTo(
        start.x + (dx * (i + 1)) / steps + (Math.random() - 0.5) * size,
        start.y + (dy * (i + 1)) / steps + (Math.random() - 0.5) * size
      );
      ctx.stroke();
    }   
  
    ctx.restore();
  };