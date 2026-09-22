/**
 * Character unique abilities
 * Activated with SPACE
 */

export const ABILITIES = {
  trailblazer_surge: {
    id: 'trailblazer_surge',
    name: 'Trailblazer Surge',
    description: 'Dash forward and leave a damaging trail',
    cooldown: 8000,
    // Tim
  },
  forbidden_codex: {
    id: 'forbidden_codex',
    name: 'Forbidden Codex',
    description: 'Expanding ring of knowledge damage',
    cooldown: 10000,
    // Judd
  },
  proximity_heal: {
    id: 'proximity_heal',
    name: 'Proximity Heal',
    description: 'Large heal pulse around you',
    cooldown: 14000,
    // Laura
  },
  protection_barrier: {
    id: 'protection_barrier',
    name: 'Protection Barrier',
    description: 'Zone enemies cannot enter for a short time',
    cooldown: 11000,
    // Joel
  },
  critical_revelation: {
    id: 'critical_revelation',
    name: 'Critical Revelation',
    description: 'Massive damage to the strongest nearby enemy',
    cooldown: 11000,
    // Doug
  },
  titan_slam: {
    id: 'titan_slam',
    name: 'Titan Slam',
    description: '360° shockwave — damage and knockback',
    cooldown: 10000,
    // Gary
  }
};

/** Map character id → ability id */
export const CHARACTER_ABILITY = {
  tim_alberino: 'trailblazer_surge',
  judd_burton: 'forbidden_codex',
  laura_sanger: 'proximity_heal',
  joel_muddamalle: 'protection_barrier',
  doug_van_dorn: 'critical_revelation',
  gary_wayne: 'titan_slam'
};
