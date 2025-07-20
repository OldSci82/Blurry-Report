// scripts/utils/inputManager.js

// Centralized input state
export const playerInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  punch: false, // For single press actions
  kick: false, // For single press actions
  pause: false, // For single press actions
};

// Function to set up keyboard listeners
export function setupKeyboard(scene) {
  const cursors = scene.input.keyboard.createCursorKeys();
  const keys = {
    cursors: cursors,
    keyA: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    keyS: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    keyD: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    keyW: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    keyZ: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z), // Punch
    keyX: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X), // Kick
    keyESC: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC), // Pause
  };

  keys.keyZ.on("down", () => (playerInput.punch = true));
  keys.keyZ.on("up", () => (playerInput.punch = false));

  keys.keyX.on("down", () => (playerInput.kick = true));
  keys.keyX.on("up", () => (playerInput.kick = false));

  keys.keyESC.on("down", () => (playerInput.pause = true));
  keys.keyESC.on("up", () => (playerInput.pause = false));

  return keys;
}

export function resetMovementInput() {
  playerInput.left = false;
  playerInput.right = false;
  playerInput.up = false;
  playerInput.down = false;
}

export function setupTouchControls(scene, buttonConfig, debug = false) {
  console.log("[inputManager] setupTouchControls called.");
  const {
    buttonSize,
    padding,
    dPadCenterOffsetX,
    dPadBaseY,
    actionBaseX,
    actionBaseY,
    screenWidth,
    screenHeight,
  } = buttonConfig;

  const TOUCH_UI_DEPTH = 1000;

  // Helper to optionally draw debug outlines
  const drawDebugOutline = (x, y, width, height, shape = "rect") => {
    if (!debug) return;
    const graphics = scene.add.graphics().setDepth(TOUCH_UI_DEPTH + 2);
    graphics.lineStyle(2, 0x00ff00, 1);
    if (shape === "rect") {
      graphics.strokeRect(x - width / 2, y - height / 2, width, height);
    } else if (shape === "circle") {
      graphics.strokeCircle(x, y, width); // width = radius
    }
  };

  const createDpadButton = (x, y, label, inputProperty) => {
    const hitArea = new Phaser.Geom.Rectangle(
      -buttonSize / 2,
      -buttonSize / 2,
      buttonSize,
      buttonSize
    );

    const button = scene.add
      .rectangle(x, y, buttonSize, buttonSize, 0x0000ff, 0.5)
      .setOrigin(0.5)
      .setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
      .setDepth(TOUCH_UI_DEPTH)
      .setScrollFactor(0);

    drawDebugOutline(x, y, buttonSize, buttonSize, "rect");

    scene.add
      .text(x, y, label, {
        fontSize: "16px",
        fill: "#fff",
        fontFamily: "Press Start 2P",
      })
      .setOrigin(0.5)
      .setDepth(TOUCH_UI_DEPTH + 1)
      .setScrollFactor(0);

    button.on("pointerdown", () => {
      console.log(`[inputManager] D-Pad Button Pointerdown: ${label}`);
      resetMovementInput();
      playerInput[inputProperty] = true;
    });

    return button;
  };

  const touchDown = createDpadButton(
    dPadCenterOffsetX,
    dPadBaseY,
    "DOWN",
    "down"
  );
  const touchLeft = createDpadButton(
    dPadCenterOffsetX - (buttonSize + padding / 2),
    dPadBaseY - buttonSize - padding / 2,
    "LEFT",
    "left"
  );
  const touchRight = createDpadButton(
    dPadCenterOffsetX + (buttonSize + padding / 2),
    dPadBaseY - buttonSize - padding / 2,
    "RIGHT",
    "right"
  );
  const touchUp = createDpadButton(
    dPadCenterOffsetX,
    dPadBaseY - (buttonSize + padding / 2) * 2,
    "UP",
    "up"
  );

  const createActionButton = (x, y, radius, color, label, inputProperty) => {
    const hitArea = new Phaser.Geom.Circle(0, 0, radius);

    const button = scene.add
      .circle(x, y, radius, color, 0.5)
      .setOrigin(0.5)
      .setInteractive(hitArea, Phaser.Geom.Circle.Contains)
      .setDepth(TOUCH_UI_DEPTH)
      .setScrollFactor(0);

    drawDebugOutline(x, y, radius, null, "circle");

    scene.add
      .text(x, y, label, {
        fontSize: "16px",
        fill: "#fff",
        fontFamily: "Press Start 2P",
      })
      .setOrigin(0.5)
      .setDepth(TOUCH_UI_DEPTH + 1)
      .setScrollFactor(0);

    button.on("pointerdown", () => {
      console.log(`[inputManager] Action Button Pointerdown: ${label}`);
      playerInput[inputProperty] = true;
    });

    return button;
  };

  const touchKick = createActionButton(
    actionBaseX,
    actionBaseY,
    buttonSize / 2,
    0x00ff00,
    "KICK",
    "kick"
  );
  const touchPunch = createActionButton(
    actionBaseX - buttonSize - padding / 2,
    actionBaseY,
    buttonSize / 2,
    0xff0000,
    "PUNCH",
    "punch"
  );

  const touchPause = scene.add
    .rectangle(screenWidth - padding - 40, padding + 20, 80, 40, 0xffff00, 0.5)
    .setOrigin(0.5)
    .setInteractive(
      new Phaser.Geom.Rectangle(-40, -20, 80, 40),
      Phaser.Geom.Rectangle.Contains
    )
    .setDepth(TOUCH_UI_DEPTH)
    .setScrollFactor(0);

  drawDebugOutline(screenWidth - padding - 40, padding + 20, 80, 40, "rect");

  scene.add
    .text(touchPause.x, touchPause.y, "PAUSE", {
      fontSize: "14px",
      fill: "#000",
      fontFamily: "Press Start 2P",
    })
    .setOrigin(0.5)
    .setDepth(TOUCH_UI_DEPTH + 1)
    .setScrollFactor(0);

  touchPause.on("pointerdown", () => {
    console.log(`[inputManager] Pause Button Pointerdown`);
    playerInput.pause = true;
  });

  scene.input.on("pointerup", () => {
    console.log("[inputManager] Global pointerup detected.");
    resetMovementInput();
    playerInput.punch = false;
    playerInput.kick = false;
    playerInput.pause = false;
  });

  return {
    touchDown,
    touchLeft,
    touchRight,
    touchUp,
    touchKick,
    touchPunch,
    touchPause,
  };
}
