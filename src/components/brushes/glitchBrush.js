export const glitchBrush = (ctx, { start, end, color, size }) => {
    ctx.save();
    ctx.lineWidth = size;
    ctx.lineCap = 'square';
  
    const segments = 10;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const stepX = dx / segments;
    const stepY = dy / segments;
  
    let prevX = start.x;
    let prevY = start.y;
    for (let i = 1; i <= segments; i++) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      // Offset some segments randomly to create glitch
      const offsetX = (Math.random() - 0.5) * size * 4;
      const offsetY = (Math.random() - 0.5) * size * 4;
  
      const x = start.x + stepX * i + offsetX;
      const y = start.y + stepY * i + offsetY;
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
  
      prevX = x;
      prevY = y;
    }
  
    ctx.restore();
  };