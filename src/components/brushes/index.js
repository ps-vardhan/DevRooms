import { calligraphyBrush } from "./calligraphyBrush";
import { defaultBrush } from "./defaultBrush";
import { dripBrush } from "./dripBrush";
import { featherBrush } from "./featherBrush";
import { fireBrush } from "./fireBrush";
import { foamBrush } from "./foamBrush";
import { glitchBrush } from "./glitchBrush";
import { scribbleBrush } from "./scribbleBrush";
import { splatterBrush } from "./splatterBrush";
import { swirlBrush } from "./swirlBrush"; // Note: Fixed import spelling if needed, assuming file is swirlBrush.js
import { watercolorBrush } from "./waterColorBrush";
import { neonBrush } from "./neonBrush";

export const brushHandlers = {
  default: defaultBrush,
  calligraphy: calligraphyBrush,
  splatter: splatterBrush,
  swirl: swirlBrush,
  scribble: scribbleBrush,
  fire: fireBrush,
  feather: featherBrush,
  drip: dripBrush,
  glitch: glitchBrush,
  foam: foamBrush,
  watercolor: watercolorBrush,
  neon: neonBrush,
};
