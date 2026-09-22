/**
 * Character unique ability effects
 * Called from GameScene.activatePlayerAbility
 */

import Phaser from 'phaser';

export function activateAbility(scene, player) {
  if (!player.ability || player.abilityCooldown > 0 || player.isDowned) return false;

  const id = player.ability.id;
  switch (id) {
    case 'trailblazer_surge': trailblazerSurge(scene, player); break;
    case 'forbidden_codex': forbiddenCodex(scene, player); break;
    case 'proximity_heal': proximityHeal(scene, player); break;
    case 'protection_barrier': protectionBarrier(scene, player); break;
    case 'critical_revelation': criticalRevelation(scene, player); break;
    case 'titan_slam': titanSlam(scene, player); break;
    default: return false;
  }

  player.startAbilityCooldown();
  return true;
}

/** Tim — origin blast + high-damage dash trail */
function trailblazerSurge(scene, player) {
  const angle = player.facingAngle || 0;
  const dashDist = 170;
  const startX = player.x;
  const startY = player.y;
  const targetX = Phaser.Math.Clamp(startX + Math.cos(angle) * dashDist, 40, scene.gameWidth - 40);
  const targetY = Phaser.Math.Clamp(startY + Math.sin(angle) * dashDist, 40, scene.gameHeight - 40);

  player.invulnerableUntil = scene.time.now + 400;

  // Origin explosion at dash start — high damage
  const originBlast = scene.add.circle(startX, startY, 55, 0xa78bfa, 0.4)
    .setStrokeStyle(2, 0xc4b5fd).setDepth(6);
  scene.tweens.add({
    targets: originBlast, alpha: 0, scale: 1.5, duration: 280,
    onComplete: () => originBlast.destroy()
  });
  scene.enemies.forEach(e => {
    if (!e.active || e.isDead) return;
    if (Phaser.Math.Distance.Between(startX, startY, e.x, e.y) < 72) {
      e.takeDamage(42);
      if (e.body) {
        const a = Phaser.Math.Angle.Between(startX, startY, e.x, e.y);
        e.body.velocity.x += Math.cos(a) * 220;
        e.body.velocity.y += Math.sin(a) * 220;
      }
    }
  });

  scene.tweens.add({
    targets: player,
    x: targetX,
    y: targetY,
    duration: 180,
    ease: 'Cubic.easeOut'
  });

  // High-damage trail along dash path
  const steps = 10;
  const hitSet = new Set();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = Phaser.Math.Linear(startX, targetX, t);
    const py = Phaser.Math.Linear(startY, targetY, t);

    const dot = scene.add.circle(px, py, 12, 0xa78bfa, 0.75).setDepth(5);
    scene.tweens.add({
      targets: dot, alpha: 0, scale: 0.3, duration: 420,
      onComplete: () => dot.destroy()
    });

    scene.enemies.forEach(e => {
      if (!e.active || e.isDead || hitSet.has(e)) return;
      if (Phaser.Math.Distance.Between(px, py, e.x, e.y) < 42) {
        hitSet.add(e);
        e.takeDamage(40);
        if (e.body) {
          e.body.velocity.x += Math.cos(angle) * 170;
          e.body.velocity.y += Math.sin(angle) * 170;
        }
      }
    });
  }
}

/** Judd — expanding ring (slightly toned down) */
function forbiddenCodex(scene, player) {
  const maxRadius = 165;
  const ring = scene.add.circle(player.x, player.y, 20, 0xf97316, 0.25)
    .setStrokeStyle(3, 0xfbbf24).setDepth(6);
  const hitSet = new Set();

  scene.tweens.add({
    targets: ring,
    scale: maxRadius / 20,
    alpha: 0,
    duration: 700,
    ease: 'Cubic.easeOut',
    onUpdate: () => {
      const currentR = 20 * ring.scaleX;
      scene.enemies.forEach(e => {
        if (!e.active || e.isDead || hitSet.has(e)) return;
        const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
        if (d <= currentR) {
          hitSet.add(e);
          e.takeDamage(22); // was 28
        }
      });
    },
    onComplete: () => ring.destroy()
  });
}

/** Laura — proximity heal (toned down) */
function proximityHeal(scene, player) {
  const radius = 110;
  const ring = scene.add.circle(player.x, player.y, radius, 0x86efac, 0.2)
    .setStrokeStyle(2, 0x22c55e).setDepth(6);

  scene.tweens.add({
    targets: ring, alpha: 0, scale: 1.25, duration: 500,
    onComplete: () => ring.destroy()
  });

  player.heal(18); // sustain tool, not a full reset
  player.setTint(0x86efac);
  scene.time.delayedCall(250, () => {
    if (player.active && !player.isDowned) player.clearTint();
  });
}

/** Joel — protection barrier */
function protectionBarrier(scene, player) {
  const radius = 100;
  const duration = 3500;
  const barrier = scene.add.circle(player.x, player.y, radius, 0x38bdf8, 0.15)
    .setStrokeStyle(3, 0x7dd3fc).setDepth(6);

  scene.activeBarrier = {
    x: player.x,
    y: player.y,
    radius,
    until: scene.time.now + duration,
    visual: barrier
  };

  scene.time.delayedCall(duration, () => {
    if (barrier.active) barrier.destroy();
    if (scene.activeBarrier && scene.activeBarrier.visual === barrier) {
      scene.activeBarrier = null;
    }
  });
}

/** Doug — single target nuke (toned down) */
function criticalRevelation(scene, player) {
  let target = null;
  let bestScore = -1;

  scene.enemies.forEach(e => {
    if (!e.active || e.isDead) return;
    const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
    if (d > 300) return;
    const score = (e.isBoss || e.isLevelBoss ? 10000 : 0) + e.hp - d * 0.1;
    if (score > bestScore) {
      bestScore = score;
      target = e;
    }
  });

  if (!target) return;

  const line = scene.add.line(0, 0, player.x, player.y, target.x, target.y, 0xfbbf24, 0.9)
    .setDepth(7).setOrigin(0);
  scene.tweens.add({ targets: line, alpha: 0, duration: 300, onComplete: () => line.destroy() });

  const flash = scene.add.circle(target.x, target.y, 28, 0xfbbf24, 0.55).setDepth(7);
  scene.tweens.add({
    targets: flash, alpha: 0, scale: 1.8, duration: 320,
    onComplete: () => flash.destroy()
  });

  target.takeDamage(70); // was 95 + 25 follow-up
  scene.time.delayedCall(200, () => {
    if (target.active && !target.isDead) target.takeDamage(18);
  });
}

/** Gary — 360 shockwave (slightly toned down) */
function titanSlam(scene, player) {
  const radius = 140;
  const ring = scene.add.circle(player.x, player.y, 30, 0xef4444, 0.3)
    .setStrokeStyle(4, 0xf87171).setDepth(6);

  scene.tweens.add({
    targets: ring,
    scale: radius / 30,
    alpha: 0,
    duration: 400,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy()
  });

  scene.enemies.forEach(e => {
    if (!e.active || e.isDead) return;
    const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
    if (d <= radius) {
      e.takeDamage(32); // was 40
      if (e.body) {
        const angle = Phaser.Math.Angle.Between(player.x, player.y, e.x, e.y);
        e.body.setVelocity(Math.cos(angle) * 380, Math.sin(angle) * 380);
        e.isBursting = true;
        scene.time.delayedCall(380, () => {
          if (e.active) e.isBursting = false;
        });
      }
    }
  });
}

export function updateActiveBarrier(scene) {
  if (!scene.activeBarrier) return;
  const b = scene.activeBarrier;

  if (scene.time.now > b.until) {
    if (b.visual?.active) b.visual.destroy();
    scene.activeBarrier = null;
    return;
  }

  b.x = scene.player.x;
  b.y = scene.player.y;
  if (b.visual?.active) b.visual.setPosition(b.x, b.y);

  scene.enemies.forEach(e => {
    if (!e.active || e.isDead) return;
    const d = Phaser.Math.Distance.Between(b.x, b.y, e.x, e.y);
    if (d < b.radius) {
      const angle = Phaser.Math.Angle.Between(b.x, b.y, e.x, e.y);
      const push = (b.radius - d) + 8;
      e.x += Math.cos(angle) * push * 0.35;
      e.y += Math.sin(angle) * push * 0.35;
      if (e.body) {
        e.body.velocity.x += Math.cos(angle) * 80;
        e.body.velocity.y += Math.sin(angle) * 80;
      }
    }
  });
}
