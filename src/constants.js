export const NORTH = 'NORTH';
export const SOUTH = 'SOUTH';
export const EAST = 'EAST';
export const WEST = 'WEST';

export const HORIZONTAL = 'HORIZONTAL';
export const VERTICAL = 'VERTICAL';

export const IS_MAC = navigator.platform === 'MacIntel';
export const KEYCODE = IS_MAC ? 91 : 17; // Cmd : Ctrl