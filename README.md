# Bot Battle Arena

Write a JavaScript bot that fights in a sumo-style arena. Push your opponents off the platform. Last bot standing wins.

## The Goal

Your bot is a circle on a circular platform. Each tick (60 times per second), the engine calls your bot's `update()` function. You decide how to rotate, thrust, and when to use plugins. If you leave the arena boundary, you're eliminated.

The arena shrinks over time. Matches last up to 3 minutes. Crate pickups spawn periodically with powerful effects. It gets chaotic.

## Getting Started

1. Copy `template.js` and rename it (e.g. `my_bot.js`)
2. Change `static botName` to your bot's name
3. Implement the `update(gameState)` method — this is your bot's brain
4. Load your bot file in the game UI using the "Load Bot" button

## Writing Your Bot

Your bot is a class with an `update` method that receives the full game state and returns an action:

```js
export const plugins = ['dash'];
export const stats = { hp: 4, mass: 3, speed: 5, thrust: 5, turnRate: 4, pluginPower: 3 };

export default class MyBot {
  static botName = 'My Bot';

  update(gameState) {
    const { self, enemies, arena, plugins, tick } = gameState;

    // Find the nearest enemy
    let nearest = null;
    let nearestDist = Infinity;
    for (const enemy of enemies) {
      const dx = enemy.x - self.x;
      const dy = enemy.y - self.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    // Aim at them
    const targetAngle = Math.atan2(nearest.y - self.y, nearest.x - self.x) * 180 / Math.PI;
    let angleDiff = targetAngle - self.angle;
    // Normalize to [-180, 180]
    while (angleDiff > 180) angleDiff -= 360;
    while (angleDiff < -180) angleDiff += 360;

    return {
      rotate: angleDiff,   // engine clamps this to your turnRate
      thrust: 1.0,         // full speed ahead
      usePlugin: null,
    };
  }
}
```

## Game State Reference

Every tick, `update(gameState)` receives:

| Field | Type | Description |
|-------|------|-------------|
| `self` | object | Your bot's state (see below) |
| `enemies` | array | All other alive bots (same shape as `self`) |
| `arena` | object | `{ radius, center: { x: 0, y: 0 } }` — radius shrinks over time! |
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
| `hp` | 40 | +15 | Hit points — low HP = much easier to knock out |
| `mass` | 0.5 | +0.15 | Heavier = harder to push. Does NOT affect your own movement. |
| `speed` | 1.0 | +0.25 | Max movement speed |
| `thrust` | 0.1 | +0.05 | Acceleration force |
| `turnRate` | 4 | +1.5 | Max degrees rotation per tick |
| `pluginPower` | 0% CDR | +5% CDR | Cooldown reduction on plugins (caps at 50%) |

If you don't export `stats`, you get a balanced default (20 pts used). Going over budget rejects your bot on load.

### Example Builds

- **Glass cannon**: `{ hp: 1, mass: 1, speed: 8, thrust: 8, turnRate: 4, pluginPower: 2 }` — fast but fragile
- **Tank**: `{ hp: 10, mass: 8, speed: 2, thrust: 2, turnRate: 2, pluginPower: 0 }` — immovable wall
- **Gunner**: `{ hp: 3, mass: 2, speed: 4, thrust: 3, turnRate: 4, pluginPower: 8 }` — rapid fire with 40% CDR

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
| `dash` | Fixed-speed charge forward. Plows through enemies. No steering during dash. | 0.5s | 3s |
| `shield` | Full protection: blocks damage, reflects projectiles, bounces attackers with 2.5x force. | 1s | 5s |
| `gun` | Fires a projectile in your facing direction (15 damage + knockback). | Instant | 2s |

**Priority:** Shield beats Dash beats Normal. A dashing bot that hits a shielded bot gets bounced back hard.

## Combat Mechanics

- **Collision damage** scales with impact speed and attacker mass. Rear hits deal 1.5x, head-on takes 0.5x.
- **Low HP = danger.** As HP drops, knockback increases exponentially and stun lasts longer. At 0 HP you're extremely easy to ring out.
- **Hitstun:** When hit, you can rotate but can't thrust. Duration scales with remaining HP.
- **Projectiles** are visible in `gameState.projectiles` — you can dodge them. Shields reflect them back.

## Arena Escalation

| Event | When | What happens |
|-------|------|-------------|
| Crate pickups | From 15s, every 10-15s | Move over a crate to collect it. 4 types with different effects. |
| Arena shrink | From 30s | Arena shrinks at 3.5 units/sec down to 30% of original size. |
| Match timeout | 3 minutes | Highest HP wins. Equal HP = draw. |

### Crate Types

| Crate | `pluginId` | Effect |
|-------|-----------|--------|
| Black Hole | `blackhole` | Spawns a gravity well near the closest enemy toward the edge. Pulls all bots for 5s. |
| Artillery | `artillery` | Calls a strike on nearest enemy's position. 2s warning, then explosion (50 damage, massive knockback). |
| Bullet Burst | `bulletburst` | Fires 3 projectiles at every enemy from your position. |
| Shield | `shieldcrate` | Grants a 7-second personal shield. |

Artillery strikes appear in `gameState.arenaEvents` — you can dodge them:
```js
const artillery = gameState.arenaEvents.find(e => e.type === 'artillery');
if (artillery && artillery.ticksRemaining > 60) {
  // Still time to get out of the blast radius
}
```

## Strategy Ideas

- **Rush down** — Equip dash, line up your target and charge. Watch out for shields.
- **Fortress** — Equip shield, invest in HP/mass, hold the center. Attackers bounce off you.
- **Sniper** — Equip gun, max pluginPower for fast cooldowns. Wear enemies down from range.
- **Brawler** — Dash + gun. Soften with bullets, then dash in for the kill.
- **Crate hunter** — Build for speed and grab pickups. Artillery and bullet burst can turn a fight.
- **Edge play** — Lure enemies toward the boundary, then dodge at the last moment.
- **Arena awareness** — Check `gameState.arena.radius` every tick. As it shrinks, center control is everything.

## Custom Drawing (Optional)

Give your bot a custom appearance:

```js
export default class MyBot {
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

## Tips

- Coordinates: (0,0) = arena center. Angle 0 = right, 90 = down.
- Always check `gameState.arena.radius` — it shrinks!
- Plugin `description` strings are plain English. Read them to understand what each plugin does.
- If your `update()` throws an error, your bot just idles that tick — it doesn't crash out.
- You can use `console.log()` inside your bot for debugging (check browser dev tools).
- The `tick` field tells you how far into the match you are. 60 ticks = 1 second.
