import * as THREE from "three";

/**
 * Per-frame lighting state shared across the scene without React re-renders.
 * `house` eases between 0 (movie playing, lights down) and 1 (house lights up).
 * `screen` is the current average colour the screen throws into the room.
 */
export const lighting = {
  house: 0,
  screen: new THREE.Color(0.4, 0.4, 0.5),
  screenLevel: 0.6,
};
