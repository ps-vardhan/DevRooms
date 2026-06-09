export const fireBrush = (ctx, { start, end, color, size }) => {
    ctx.save();
    ctx.lineCap = 'round';
  
    // Base stroke
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  
    // Flame effect: additional strokes in varying colors/alphas
    const flameColors = [
      'rgba(255, 100, 0, 0.6)',
      'rgba(255, 150, 0, 0.4)',
      'rgba(255, 200, 0, 0.3)',
    ];
    flameColors.forEach((flameColor) => {
      ctx.beginPath();
      ctx.strokeStyle = flameColor;
      ctx.lineWidth = size * (0.5 + Math.random() * 0.5);
      ctx.moveTo(start.x, start.y);
  
      // Wavy path
      const steps = 20;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      for (let i = 1; i <= steps; i++) {
        const x = start.x + (dx * i) / steps + (Math.random() - 0.5) * size;
        const y = start.y + (dy * i) / steps + (Math.random() - 0.5) * size;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  
    ctx.restore();
  };
  