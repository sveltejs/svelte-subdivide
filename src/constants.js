export const NORTH = 'NORTH';
export const SOUTH = 'SOUTH';
export const EAST = 'EAST';
export const WEST = 'WEST';

export const IS_MAC = typeof navigator === 'undefined' ? false : navigator.platform === 'MacIntel';
export const KEYCODE = IS_MAC ? 91 : 17; // Cmd : Ctrl
