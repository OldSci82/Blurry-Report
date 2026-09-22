/**
 * Mid-run level-up options
 * - Normal levels: simple stat bumps (3 shown)
 * - Milestone levels (every 7): heavy-hitting upgrades only
 */

export const NORMAL_UPGRADES = [
  {
    id: 'damage',
    name: 'Power',
    description: '+18% Weapon Damage',
    apply(player) {
      if (player.weapon) player.weapon.damage = Math.round(player.weapon.damage * 1.18);
    }
  },
  {
    id: 'fire_rate',
    name: 'Rapid Fire',
    description: '-12% Weapon Cooldown',
    apply(player) {
      if (player.weapon) player.weapon.cooldown = Math.max(120, Math.round(player.weapon.cooldown * 0.88));
    }
  },
  {
    id: 'move_speed',
    name: 'Swift',
    description: '+12 Move Speed',
    apply(player) {
      player.moveSpeed += 12;
    }
  },
  {
    id: 'max_hp',
    name: 'Fortify',
    description: '+20 Max HP and heal 15',
    apply(player) {
      player.maxHp += 20;
      player.hp = Math.min(player.maxHp, player.hp + 15);
    }
  },
  {
    id: 'armor',
    name: 'Harden',
    description: '+3 Armor',
    apply(player) {
      player.armor = (player.armor || 0) + 3;
    }
  },
  {
    id: 'pickup',
    name: 'Magnet',
    description: '+25 Pickup Range',
    apply(player) {
      player.pickupRange = (player.pickupRange || 60) + 25;
    }
  }
];

export const MILESTONE_UPGRADES = [
  {
    id: 'multishot',
    name: 'Split Fire',
    description: '+1 Projectile per shot',
    apply(player) {
      if (!player.weapon) return;
      player.weapon.count = (player.weapon.count || 1) + 1;
      // Weapons with 0 spread would stack projectiles on top of each other — give a readable fan
      if (!player.weapon.spread || player.weapon.spread < 10) {
        player.weapon.spread = 12;
      }
    }
  },
  {
    id: 'heavy_damage',
    name: 'Annihilation',
    description: '+40% Weapon Damage',
    apply(player) {
      if (player.weapon) player.weapon.damage = Math.round(player.weapon.damage * 1.40);
    }
  },
  {
    id: 'overclock',
    name: 'Overclock',
    description: '-25% Weapon Cooldown',
    apply(player) {
      if (player.weapon) player.weapon.cooldown = Math.max(100, Math.round(player.weapon.cooldown * 0.75));
    }
  },
  {
    id: 'vitality',
    name: 'Second Wind',
    description: '+45 Max HP and full heal',
    apply(player) {
      player.maxHp += 45;
      player.hp = player.maxHp;
    }
  },
  {
    id: 'spread',
    name: 'Wide Pattern',
    description: 'Projectiles gain more spread & +1 count',
    apply(player) {
      if (player.weapon) {
        player.weapon.count = (player.weapon.count || 1) + 1;
        player.weapon.spread = (player.weapon.spread || 0) + 14;
      }
    }
  },
  {
    id: 'bulwark',
    name: 'Bulwark',
    description: '+8 Armor and +15 Max HP',
    apply(player) {
      player.armor = (player.armor || 0) + 8;
      player.maxHp += 15;
      player.hp = Math.min(player.maxHp, player.hp + 15);
    }
  }
];

/**
 * End-of-level upgrades (after Level Boss)
 * Bigger, more meaningful picks — one choice for solo (pool shown, pick one)
 */
export const END_LEVEL_UPGRADES = [
  {
    id: 'end_vitality',
    name: 'Vital Core',
    description: '+60 Max HP and full heal',
    apply(player) {
      player.maxHp += 60;
      player.hp = player.maxHp;
    }
  },
  {
    id: 'end_power',
    name: 'Amplified Arsenal',
    description: '+35% Weapon Damage',
    apply(player) {
      if (player.weapon) player.weapon.damage = Math.round(player.weapon.damage * 1.35);
    }
  },
  {
    id: 'end_multishot',
    name: 'Barrage Protocol',
    description: '+2 Projectiles and added spread',
    apply(player) {
      if (!player.weapon) return;
      player.weapon.count = (player.weapon.count || 1) + 2;
      player.weapon.spread = Math.max(player.weapon.spread || 0, 10) + 10;
    }
  },
  {
    id: 'end_overclock',
    name: 'Relentless Fire',
    description: '-30% Weapon Cooldown',
    apply(player) {
      if (player.weapon) player.weapon.cooldown = Math.max(90, Math.round(player.weapon.cooldown * 0.70));
    }
  },
  {
    id: 'end_bulwark',
    name: 'Iron Ward',
    description: '+12 Armor and +25 Max HP',
    apply(player) {
      player.armor = (player.armor || 0) + 12;
      player.maxHp += 25;
      player.hp = Math.min(player.maxHp, player.hp + 25);
    }
  },
  {
    id: 'end_spark',
    name: 'Second Spark',
    description: 'Gain +1 Spark of Dawn',
    apply(player) {
      player.sparksOfDawn = (player.sparksOfDawn || 0) + 1;
    }
  },
  {
    id: 'end_swift',
    name: 'Anomaly Stride',
    description: '+25 Move Speed and +40 Pickup Range',
    apply(player) {
      player.moveSpeed += 25;
      player.pickupRange = (player.pickupRange || 60) + 40;
    }
  }
];

/**
 * Returns N random unique upgrades from the given pool
 */
export function rollUpgrades(pool, count = 3) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function isMilestoneLevel(level) {
  return level > 0 && level % 7 === 0;
}
