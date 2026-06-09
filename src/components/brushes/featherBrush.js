export const featherBrush = (ctx, { start, end, color, size }) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
  
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const segments = Math.max(5, Math.floor(length / (size * 2)));
  
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
  
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = start.x + dx * t;
      const y = start.y + dy * t;
      ctx.lineTo(x, y);
  
      // "Feather" arcs going out to each side
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const arcSize = size * 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, arcSize, 0.4 * Math.PI, 0.6 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
    ctx.stroke();
  ctx.restore();
};