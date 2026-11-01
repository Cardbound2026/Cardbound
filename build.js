// Builds the playable game into public/index.html (one self-contained page).
// Usage: node build.js
const fs = require('fs'), path = require('path');
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
let page = src('template.html').replace('/*SOCIAL*/', () => src('social.js')).replace('/*GUILD*/', () => src('guild.js')).replace('/*NET*/', () => src('net.js')).replace('/*RAID*/', () => src('raid.js')).replace('/*RECORDS*/', () => src('records.js')).replace('/*BAZAAR*/', () => src('bazaar.js')).replace('/*ARENA*/', () => src('arena.js')).replace('/*UPDATES*/', () => src('updates.js')).replace('/*CODEX*/', () => src('codex.js')).replace('/*TALENTSUI*/', () => src('talentsui.js')).replace('/*INKART*/', () => (fs.existsSync(path.join(__dirname, 'src', 'inkart.js')) ? src('inkart.js') : '')) /* INKART: Gothic Ink art pack, optional */.replace('/*INKUI*/', () => (fs.existsSync(path.join(__dirname, 'src', 'inkui.js')) ? src('inkui.js') : '')) /* INKUI: Gothic Ink interface, optional */.replace('/*BATTLEFIELD*/', () => (fs.existsSync(path.join(__dirname, 'src', 'battlefield.js')) ? src('battlefield.js') : '')) /* BATTLEFIELD: the fight as a scene, optional */.replace('/*GEARUI*/', () => src('gearui.js')).replace('/*GLOSSARY*/', () => src('glossary.js')).replace('/*TESTVENDOR*/', () => src('testvendor.js'));
for (const [mark, file] of [['CONFIG', 'config.js'], ['DATA', 'data.js'], ['FRAMES', 'frames.js'], ['EFRAMES', 'eframes.js'], ['TESTDECKS', 'testdecks.js'], ['ART', 'art.js'], ['CARDSGEN', 'cards_gen.js'], ['UPGRADES', 'card_upgrades.js'], ['TALENTS', 'talents.js'], ['WARLOCK', 'warlock.js'], ['ENGINE', 'engine.js'], ['RUN', 'run.js'], ['HUB', 'hub.js']]) page = page.replace(`/*${mark}*/`, () => src(file));
page = page.replace(/^<meta charset="utf-8">\n/, '');
page = page.replace('__CB_BUILT_AT__', () => String(Date.now())); // when this build was made (shown in the corner)
const BUILD_ID = require('crypto').createHash('sha1').update(page).digest('hex').slice(0, 10);
page = page.replace('__CB_BUILD__', BUILD_ID); // build fingerprint: online games need everyone on the same version
const cut = page.indexOf('</style>') + '</style>'.length; // title, fonts and styles go in <head>, the screens and scripts in <body>
const out = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + page.slice(0, cut) + '\n</head>\n<body>\n' + page.slice(cut) + '\n</body>\n</html>\n';
fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), out);
fs.writeFileSync(path.join(__dirname, 'public', 'version.json'), JSON.stringify({ build: BUILD_ID, at: Date.now() }) + '\n'); // open pages poll this to warn about a new version
console.log('public/index.html', Math.round(out.length / 1024), 'KB');
