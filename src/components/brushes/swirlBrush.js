export const swirlBrush = (ctx, { start, end, color, size }) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.beginPath();
  
    const steps = 20;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const stepX = dx / steps;
    const stepY = dy / steps;
    const amplitude = size * 2;
  
    ctx.moveTo(start.x, start.y);
  
    for (let i = 1; i <= steps; i++) {
      const x = start.x + stepX * i;
      const y = start.y + stepY * i + Math.sin(i * 0.7) * amplitude;
      ctx.lineTo(x, y);
    }
  
    ctx.stroke();
  };
  