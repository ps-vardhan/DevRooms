export const splatterBrush = (
    ctx,
    {
      start,
      end,
      color,
      size,
      density = 10, // Number of splatter particles
      scatterRange = size * 2, // Maximum distance of splatter particles
    }
  ) => {
    
  
    // Calculate the midpoint of the stroke for scattering the splatter
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
  
    for (let i = 0; i < density; i++) {
      // Generate random offset for splatter particles
      const offsetX = (Math.random() - 0.5) * scatterRange;
      const offsetY = (Math.random() - 0.5) * scatterRange;
  
      // Randomize the size of each splatter dot
      const splatterSize = Math.random() * (size / 2);
  
      // Draw the splatter dot
      ctx.save();
      ctx.beginPath();
      ctx.arc(midX + offsetX, midY + offsetY, splatterSize, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }
  
  };
  