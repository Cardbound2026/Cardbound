# Cardbound

A dark co-op RPG deckbuilder: Slay the Spire style card combat, Diablo style gear, and a walkable town hub.

## Play

The live game is the `public/` folder (one page, `public/index.html`), deployed as a Cloudflare Worker with static assets (settings in `wrangler.jsonc`; deploy command `npx wrangler deploy`).
Progress saves in the browser and, when signed in (Discord), to the player's Supabase account. Co-op, chat, trades, the Bazaar, the Arena and the Hall of Records run through Supabase too.

## Layout

| Folder | What it holds |
|---|---|
| `public/` | The built game that gets deployed. Do not edit by hand: run `node build.js`. |
| `src/` | Game source. `engine.js` combat rules, `run.js` map runs and parties, `hub.js` saves, gear and cards, `template.html` all screens (town, map, fights), `data.js` enemies and gear tables, `frames.js` and `art.js` card images. |
| `tools/` | Balance simulations that play the game automatically (`node tools/runsim.js 100 White 0`, `node tools/partysim.js 30`, `node tools/progsim.js 25 4`). |
| `supabase/` | Database setup, run in the Supabase SQL editor: `schema.sql` (tables, includes records and seasons), `backups.sql` (save backups), then `trust.sql` (server checks on saves, trades, sales, wagers and the Hall of Records). Each is safe to run again. |
| `design/` | Design workbooks (card database, gear system, Map 1, card art catalog), card frames and approved card art, and the Python scripts that build the workbooks. |

## Build

```
node build.js
```

Requires Node.js 18 or newer. No packages to install.

## Trust (supabase/trust.sql)

- Every save is checked on the server; it is never blocked, but an account whose save can't have come from play is flagged (`public.trust_flags` says why). Flagged accounts drop off the Hall of Records and can't trade.
- Trades, Bazaar sales and Arena wagers are registered on the server first (`trade_ledger`); the game only moves items once the server agrees.
- Admins (`public.admins`) get Tinker Pip's free test goods and are kept off the public boards.
- Review flags: `select * from public.trust_flags order by at desc;`  Clear one: `update public.profiles set flagged = false where user_id = '...';`
