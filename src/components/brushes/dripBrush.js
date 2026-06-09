export const dripBrush = (ctx, { start, end, color, size }) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
  
    // Paint a standard line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  
    // Add random drips at the end
    const drips = 6;
    for (let i = 0; i < drips; i++) {
      ctx.beginPath();
      const dripSize = Math.random() * size;
      const dripX = end.x + (Math.random() - 0.5) * size * 2;
      const dripY = end.y + Math.random() * size * 3;
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(dripX, dripY);
      ctx.stroke();
      
      // A small droplet at the tip
      ctx.beginPath();
      ctx.arc(dripX, dripY, dripSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  
    ctx.restore();
  };