/**
 * Weapon definitions.
 * All weapons auto-fire. Player only moves.
 */

export const WEAPONS = {
  machete: {
    id: 'machete',
    name: 'Machete',
    description: 'Close-range slashing weapon. Fires in movement direction.',
    damage: 12,
    cooldown: 450,        // ms
    projectileSpeed: 320,
    projectileLifetime: 18,
    projectileColor: 0x94a3b8,
    count: 1,             // projectiles per shot
    spread: 0
  },

  ancient_tome: {
    id: 'ancient_tome',
    name: 'Ancient Tome',
    description: 'Releases arcs of forbidden knowledge.',
    damage: 8,
    cooldown: 700,
    projectileSpeed: 260,
    projectileLifetime: 22,
    projectileColor: 0xa78bfa,
    count: 3,
    spread: 25            // degrees between projectiles
  },

  truth_light: {
    id: 'truth_light',
    name: 'Truth Light',
    description: 'A purifying beam that reveals and damages.',
    damage: 6,
    cooldown: 380,
    projectileSpeed: 400,
    projectileLifetime: 14,
    projectileColor: 0xfbbf24,
    count: 1,
    spread: 0
  },

  word_of_power: {
    id: 'word_of_power',
    name: 'Word of Power',
    description: 'Declarative force that pulses outward.',
    damage: 12,
    cooldown: 700,
    projectileSpeed: 280,
    projectileLifetime: 28,
    projectileColor: 0x38bdf8,
    count: 1,
    spread: 0
  },

  research_notes: {
    id: 'research_notes',
    name: 'Research Notes',
    description: 'Precise, high-velocity pages of research.',
    damage: 9,
    cooldown: 520,
    projectileSpeed: 450,
    projectileLifetime: 12,
    projectileColor: 0xe2e8f0,
    count: 2,
    spread: 12
  },

  giant_slayer: {
    id: 'giant_slayer',
    name: 'Giant Slayer',
    description: 'Heavy, slow, high-damage strikes.',
    damage: 22,
    cooldown: 1100,
    projectileSpeed: 240,
    projectileLifetime: 26,
    projectileColor: 0xf87171,
    count: 1,
    spread: 0
  }
};
