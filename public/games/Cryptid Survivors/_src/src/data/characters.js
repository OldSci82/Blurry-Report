/**
 * Starter characters (guest-based)
 * A-Tier (hosts) and S-Tier (cryptids) will be added later.
 */

export const CHARACTERS = {
  tim_alberino: {
    id: 'tim_alberino',
    name: 'Tim Alberino',
    title: 'The Explorer',
    tier: 'starter',
    description: 'High mobility field operative. Excels at discovery and survival.',
    baseStats: {
      maxHp: 100,
      moveSpeed: 180,
      pickupRange: 80,
      armor: 0
    },
    startingWeapon: 'machete',
    startingPassive: 'trailblazer' // extra move speed + pickup range
  },

  judd_burton: {
    id: 'judd_burton',
    name: 'Dr. Judd Burton',
    title: 'The Forbidden Historian',
    tier: 'starter',
    description: 'Master of ancient knowledge and area control.',
    baseStats: {
      maxHp: 90,
      moveSpeed: 150,
      pickupRange: 60,
      armor: 5
    },
    startingWeapon: 'ancient_tome',
    startingPassive: 'forbidden_knowledge' // larger area + longer duration
  },

  laura_sanger: {
    id: 'laura_sanger',
    name: 'Dr. Laura Sanger',
    title: 'The Spiritual Psychologist',
    tier: 'starter',
    description: 'Healer and sustain specialist. Reveals and weakens the anomalous.',
    baseStats: {
      maxHp: 112,
      moveSpeed: 140,
      pickupRange: 70,
      armor: 4
    },
    startingWeapon: 'truth_light',
    startingPassive: 'restoration' // +1 HP every 2s
  },

  joel_muddamalle: {
    id: 'joel_muddamalle',
    name: 'Dr. Joel Muddamalle',
    title: 'The Divine Council Theologian',
    tier: 'starter',
    description: 'Authority and cooldown mastery. Declares power against the swarm.',
    baseStats: {
      maxHp: 100,
      moveSpeed: 170,
      pickupRange: 70,
      armor: 4
    },
    startingWeapon: 'word_of_power',
    startingPassive: 'echo_of_authority'
  },

  doug_van_dorn: {
    id: 'doug_van_dorn',
    name: 'Doug Van Dorn',
    title: 'The Biblical Researcher',
    tier: 'starter',
    description: 'Precision and critical insight. Strikes with researched accuracy.',
    baseStats: {
      maxHp: 85,
      moveSpeed: 160,
      pickupRange: 70,
      armor: 2
    },
    startingWeapon: 'research_notes',
    startingPassive: 'critical_insight' // higher crit chance
  },

  gary_wayne: {
    id: 'gary_wayne',
    name: 'Gary Wayne',
    title: 'The Giant Specialist',
    tier: 'starter',
    description: 'Heavy hitter built for crowd control and giant-slaying.',
    baseStats: {
      maxHp: 130,
      moveSpeed: 130,
      pickupRange: 55,
      armor: 12
    },
    startingWeapon: 'giant_slayer',
    startingPassive: 'heavy_presence' // knockback + base damage
  }
};

export const STARTER_CHARACTER_IDS = [
  'tim_alberino',
  'judd_burton',
  'laura_sanger',
  'joel_muddamalle',
  'doug_van_dorn',
  'gary_wayne'
];
