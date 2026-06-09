export const calligraphyBrush = (
  ctx,
  {
    start,
    end,
    color,
    size,
    lastTime,
    lastSpeed = 0,
    lastAngle = 0,
    lastSize = size,
    // Increase this so new data is considered more quickly
    smoothingFactor = 0.2,
  }
) => {
  const now = performance.now();
  const dt = now - (lastTime ?? now);

  // Calculate raw speed (distance / time)
  const dist = Math.hypot(end.x - start.x, end.y - start.y);
  const rawSpeed = dt > 0 ? dist / dt : 0;

  // Smooth the speed
  const speed = lastSpeed * (1 - smoothingFactor) + rawSpeed * smoothingFactor;

  // Calculate and smooth the angle
  const rawAngle = Math.atan2(end.y - start.y, end.x - start.x);
  const angle = lastAngle * (1 - smoothingFactor) + rawAngle * smoothingFactor;

  // Calculate a base size affected by speed, then smooth it
  // (smaller multiplier = less drastic size changes)
  const rawSize = Math.max(2, size - speed * 25);
  const dynamicSize =
    lastSize * (1 - smoothingFactor) + rawSize * smoothingFactor;

 
  ctx.save();
  ctx.translate(end.x, end.y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.fillRect(-dynamicSize / 2, -dynamicSize / 2, dynamicSize, dynamicSize * 2);
  ctx.restore();

  return {
    lastTime: now,
    lastSpeed: speed,
    lastAngle: angle,
    lastSize: dynamicSize,
  };
};
