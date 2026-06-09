export const neonBrush = (ctx, { start, end, color, size }) => {
    // Outer glow
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.restore();
  
    // Inner stroke
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = size / 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.restore();
  };