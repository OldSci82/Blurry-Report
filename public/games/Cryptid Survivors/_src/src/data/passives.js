/**
 * Character passive abilities (always on)
 */

export const PASSIVES = {
  field_instinct: {
    id: 'field_instinct',
    name: 'Field Instinct',
    description: 'Bonus damage while moving',
    // Tim
  },
  forbidden_margins: {
    id: 'forbidden_margins',
    name: 'Forbidden Margins',
    description: 'Bonus damage to enemies near screen edges',
    // Judd
  },
  restoration: {
    id: 'restoration',
    name: 'Restoration',
    description: 'Passive HP regeneration',
    // Laura
  },
  echo_of_authority: {
    id: 'echo_of_authority',
    name: 'Echo of Authority',
    description: 'Projectiles fragment on hit',
    // Joel
  },
  revealed_weakness: {
    id: 'revealed_weakness',
    name: 'Revealed Weakness',
    description: 'Chance for bonus critical damage',
    // Doug
  },
  titans_due: {
    id: 'titans_due',
    name: "Titan's Due",
    description: 'Bonus damage vs high-HP targets',
    // Gary
  }
};

export const CHARACTER_PASSIVE = {
  tim_alberino: 'field_instinct',
  judd_burton: 'forbidden_margins',
  laura_sanger: 'restoration',
  joel_muddamalle: 'echo_of_authority',
  doug_van_dorn: 'revealed_weakness',
  gary_wayne: 'titans_due'
};
