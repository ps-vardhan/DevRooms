export const scribbleBrush = (ctx, { start, end, color, size }) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    const segments = 8;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    let prevX = start.x;
    let prevY = start.y;
  
    ctx.moveTo(prevX, prevY);
  
    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      const x = start.x + dx * t + (Math.random() - 0.5) * size * 2;
      const y = start.y + dy * t + (Math.random() - 0.5) * size * 2;
      ctx.lineTo(x, y);
      prevX = x;
      prevY = y;
    }
  
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };