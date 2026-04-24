// Copy this file and rename it to create your own bot.
// Implement update() to control your bot each tick.
// Optionally implement draw() to give your bot a custom look.

// Declare loadout plugins (max 2). These must be registered in the engine.
// Built-in: 'dash', 'shield', 'gun'. Custom plugins can be loaded via the UI.
// export const plugins = ['dash', 'shield'];

// Allocate stat points (24 total budget). Unspent points are wasted.
// If not exported, defaults to: { hp: 4, mass: 3, speed: 4, thrust: 4, turnRate: 4, pluginPower: 0 }
//
// Stat        | Base (0 pts) | Per point | What it does
// ------------|-------------|-----------|-------------
// hp          | 40          | +15       | Hit points — low HP = easier to knock out
// mass        | 0.5         | +0.15     | Heavier = harder to push. Does not affect own movement.
// speed       | 1.0         | +0.25     | Max movement speed
// thrust      | 0.1         | +0.05     | Acceleration force
// turnRate    | 4            | +1.5      | Max degrees rotation per tick
// pluginPower | 0% CDR      | +5% CDR   | Cooldown reduction on plugins (caps at 50%)
//
// export const stats = { hp: 4, mass: 3, speed: 4, thrust: 4, turnRate: 4, pluginPower: 0 };

export default class MyBot {
  // REQUIRED: a stable id unique to your bot. Set this ONCE at the start of the project
  // and never change it — scores across rounds/sessions are tracked by this id.
  // Convention: "team-botname" (lowercase, kebab-case). Example: 'team-alpha-ironclad'.
  static botId = 'team-hackerbot-8d4f2a6e4565656';

  // Display name shown in the UI. Safe to rename between rounds — scores stay linked via botId.
  static botName = 'Template Bot';

  constructor() {}

  /**
   * Called every tick. Return an action object to control your bot.
   *
   * @param {object} gameState
   * @param {object} gameState.self - Your bot: { id, x, y, vx, vy, angle, radius, hp, maxHp, stunTicks, alive }
   * @param {object[]} gameState.enemies - Other alive bots (same as self + shielding, dashing)
   * @param {object} gameState.arena - { radius, center: { x: 0, y: 0 } }
   * @param {object[]} gameState.plugins - Your plugins: [{ id, description, cooldown, active }]
   * @param {object[]} gameState.pickups - Arena pickups: [{ id, pluginId, x, y, radius, description }]
   * @param {object[]} gameState.projectiles - Active projectiles: [{ id, x, y, vx, vy, radius, ownerId }]
   * @param {object[]} gameState.arenaEvents - Active arena events: [{ type, x, y, radius, ticksRemaining }]
   * @param {number} gameState.tick - Current tick number
   *
   * @returns {{ rotate: number, thrust: number, usePlugin: string|null }}
   *   rotate: degrees/tick to turn (clamped by your turnRate stat). Negative = left, positive = right.
   *   thrust: -1.0 (full reverse) to 1.0 (full forward). Disabled during stun and dash.
   *   usePlugin: plugin id string to activate, or null. Check cooldown === 0 first.
   */
  update(gameState) {
    // Example: use dash when an enemy is close
    // const dash = gameState.plugins.find(p => p.id === 'dash');
    // if (dash && dash.cooldown === 0) return { rotate: 0, thrust: 1, usePlugin: 'dash' };

    return {
      rotate: 0,
      thrust: 0,
      usePlugin: null,
    };
  }

  // Optional: static avatar drawn once for the sidebar and used in-game if drawLive is not defined.
  // draw(ctx, size) { ... }

  // Optional: per-frame dynamic drawing (e.g. eyes that track enemies)
  // Draws on an offscreen canvas — center at (size/2, size/2), same as draw()
  // WARNING: If you define drawLive, it REPLACES draw() in-game. A no-op drawLive makes your bot invisible!
  // Only define drawLive if you actually draw something in it.
  // drawLive(ctx, size, { self: { x, y, angle }, enemies: [{ x, y }] }) { ... }
}
