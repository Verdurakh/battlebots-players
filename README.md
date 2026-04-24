# Bot Battle Arena

Write a JavaScript bot that fights in a sumo-style arena. Push your opponents off the platform. Last bot standing wins.

## The Goal

Your bot is a circle on a circular platform. Each tick (60 times per second), the engine calls your bot's `update()` function. You decide how to rotate, thrust, and when to use plugins. If you leave the arena boundary, you're eliminated.

**HP is not lives.** You are *only* eliminated by leaving the arena. HP is a resilience meter — at full HP you shrug off hits, but as it drops you get shoved further and stunned longer with each hit, making you easy to ring out. Think Smash Bros. damage %, not traditional hit points.

The arena shrinks over time. Matches last up to 3 minutes. Crate pickups spawn periodically with powerful effects. It gets chaotic.

## Getting Started

1. Copy `template.js` and rename it (e.g. `my_bot.js`)
2. Set `static botId` to a stable, unique id for your bot (convention: `team-botname`, lowercase kebab-case)
3. Set `static botName` to your bot's display name
4. Implement the `update(gameState)` method — this is your bot's brain
5. Load your bot file in the game UI using the "Load Bot" button

> **Lock your `botId` before round 1.** Scores across rounds and sessions are tracked by `botId`, **not** by `botName`. Pick your `botId` once and never change it — if you do, the engine treats your bot as a new entry and you lose your running score. `botName` is just the display label and is safe to rename between rounds.

## Writing Your Bot

Your bot is a class with an `update` method that receives the full game state and returns an action:

```js
export const plugins = ['dash'];
export const stats = { hp: 4, mass: 3, speed: 5, thrust: 5, turnRate: 4, pluginPower: 3 };

export default class MyBot {
  static botId = 'team-mybot-7f3a9c1e';   // stable unique id — set ONCE, never change
  static botName = 'My Bot';              // display name — safe to rename between rounds

  update(gameState) {
    const { self, enemies, arena, plugins, tick } = gameState;

    // Your logic here — decide how to move and when to use plugins

    return {
      rotate: 0,           // degrees to turn this tick
      thrust: 0,           // -1.0 to 1.0
      usePlugin: null,     // plugin id or null
    };
  }
}
```

## Game State Reference

Every tick, `update(gameState)` receives:

| Field | Type | Description |
|-------|------|-------------|
| `self` | object | Your bot's state (see below) |
| `enemies` | array | All other alive bots (same as `self` + `shielding`, `dashing`) |
| `arena` | object | `{ radius, center: { x: 0, y: 0 }, obstacles }` — radius shrinks over time! |
| `plugins` | array | Your equipped plugins: `[{ id, description, cooldown, active }]` |
| `pickups` | array | Crates on the field: `[{ id, pluginId, x, y, radius, description }]` |
| `projectiles` | array | Active bullets: `[{ id, x, y, vx, vy, radius, ownerId }]` |
| `arenaEvents` | array | Active effects like artillery: `[{ type, x, y, radius, ticksRemaining }]` |
| `tick` | number | Current tick count since match start |

### Bot State (`self` and each enemy)

| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `x`, `y` | Position — (0,0) is arena center |
| `vx`, `vy` | Current velocity |
| `angle` | Facing direction in degrees (0 = right, 90 = down) |
| `radius` | Collision radius |
| `hp` | Current hit points |
| `maxHp` | Maximum hit points |
| `stunTicks` | Ticks of stun remaining (can rotate but can't thrust) |
| `alive` | Whether the bot is still in the match |
| `shielding` | *(enemies only)* Whether the bot has an active shield |
| `dashing` | *(enemies only)* Whether the bot is mid-dash |

### Action Object (what you return)

| Field | Range | Description |
|-------|-------|-------------|
| `rotate` | any (clamped by turnRate) | Degrees to turn this tick. Negative = left, positive = right. |
| `thrust` | -1.0 to 1.0 | Forward/reverse thrust. Disabled during stun and dash. |
| `usePlugin` | string or null | Plugin id to activate (e.g. `'dash'`). Check `cooldown === 0` first. |

## Stat Allocation

You have **24 points** to distribute across 6 stats. Export a `stats` object:

```js
export const stats = { hp: 4, mass: 3, speed: 5, thrust: 4, turnRate: 4, pluginPower: 4 };
```

| Stat | Base (0 pts) | Per point | What it does |
|------|-------------|-----------|-------------|
| `hp` | 40 | +15 | Knockback resistance. You don't die at 0 — but low HP means huge knockback and long stuns, making you trivial to ring out. |
| `mass` | 0.5 | +0.15 | Heavier = harder to push. Does NOT affect your own movement. |
| `speed` | 1.0 | +0.25 | Max movement speed |
| `thrust` | 0.1 | +0.05 | Acceleration force |
| `turnRate` | 4 | +1.5 | Max degrees rotation per tick |
| `pluginPower` | 0% CDR | +5% CDR | Cooldown reduction on plugins (caps at 50%) |

If you don't export `stats`, you get a balanced default (20 pts used). Going over budget rejects your bot on load.

## Plugins

Equip up to 2 loadout plugins by exporting a `plugins` array:

```js
export const plugins = ['dash', 'gun'];
```

Activate a plugin by returning `usePlugin: 'plugin_id'` from `update()`. Always check that `cooldown === 0` first.

**Dual plugin penalty:** Equipping 2 plugins multiplies all your cooldowns by 1.5x (applied after CDR). One plugin = faster ability usage. Two = versatility at a cost.

### Built-in Plugins

| Plugin | Effect | Duration | Cooldown |
|--------|--------|----------|----------|
| `dash` | Fixed-speed charge forward. Plows through enemies. Takes bullet damage but ignores knockback/stun while dashing. | 0.5s | 3s |
| `shield` | Full protection: blocks damage, reflects projectiles, bounces attackers with 1.8x force. | 1s | 5s |
| `gun` | Fires a projectile in your facing direction (10 damage + knockback). | Instant | 2s |

**Priority:** Shield beats Dash beats Gun. A dashing bot that hits a shielded bot gets bounced back hard. Dashing through bullets takes damage but keeps momentum.

## Combat Mechanics

- **HP is resilience, not lives.** You're only eliminated by leaving the arena. HP controls how much knockback and stun you take when hit — at full HP you barely move, at 0 HP a light tap sends you flying. A 0-HP bot is still alive and fighting; it's just one good shove from elimination.
- **Collision damage** scales with impact speed and attacker mass. Rear hits deal 1.5x, head-on takes 0.5x.
- **Knockback scales with missing HP.** As HP drops, the knockback you take increases exponentially and stun lasts longer. Staying at high HP is a defensive stat as much as a survival one.
- **Hitstun:** When hit, you can rotate but can't thrust. Duration scales with remaining HP.
- **Projectiles** are visible in `gameState.projectiles` — you can dodge them. Shields reflect them back.

## Arena Escalation

| Event | When | What happens |
|-------|------|-------------|
| Crate pickups | From 12s, every 7-11s | Move over a crate to collect it. 4 types with different effects. |
| Arena shrink | From 25s | Arena shrinks at 3.85 units/sec down to 30% of original size. |
| Match timeout | 3 minutes | Highest HP wins. Equal HP = draw. |

### Crate Types

| Crate | `pluginId` | Effect |
|-------|-----------|--------|
| Black Hole | `blackhole` | Spawns a gravity well near the closest enemy toward the edge. Pulls all bots for 5s. |
| Artillery | `artillery` | Calls a strike on nearest enemy's position. 2s warning, then explosion (50 damage, massive knockback). |
| Bullet Burst | `bulletburst` | Fires 3 projectiles at every enemy from your position. |
| Shield | `shieldcrate` | Grants a 7-second personal shield. |

## Obstacles

The arena contains **4 circular pillars** arranged in a square pattern. Bots and projectiles collide with them — use them for cover or to cut off enemies.

| Property | Value |
|----------|-------|
| Positions | `(-90, -90)`, `(90, -90)`, `(-90, 90)`, `(90, 90)` |
| Radius | 15 each |

Obstacles are available in `gameState.arena.obstacles` as an array of `{ type, x, y, radius }`.

## Custom Drawing (Optional)

Give your bot a custom appearance:

```js
export default class MyBot {
  static botId = 'team-coolbot-2b8d4e6f';
  static botName = 'Cool Bot';

  // Static avatar — drawn once, used in sidebar and in-game
  draw(ctx, size) {
    const r = size / 2;
    ctx.beginPath();
    ctx.arc(r, r, r * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6600';
    ctx.fill();
  }

  // Dynamic drawing — called every frame (replaces draw() in-game if defined)
  // WARNING: A no-op drawLive makes your bot invisible! Only define this if you draw something.
  drawLive(ctx, size, { self, enemies }) {
    const r = size / 2;
    ctx.beginPath();
    ctx.arc(r, r, r * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = self.hp < self.maxHp / 2 ? '#ff0000' : '#00ff00';
    ctx.fill();
  }

  update(gameState) {
    return { rotate: 0, thrust: 0, usePlugin: null };
  }
}
```

