// Builds the playable game into public/index.html (one self-contained page).
// Usage: node build.js
const fs = require('fs'), path = require('path');
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
let page = src('template.html').replace('/*SOCIAL*/', () => src('social.js')).replace('/*NET*/', () => src('net.js')).replace('/*CODEX*/', () => src('codex.js')).replace('/*GEARUI*/', () => src('gearui.js')).replace('/*GLOSSARY*/', () => src('glossary.js'));
for (const [mark, file] of [['CONFIG', 'config.js'], ['DATA', 'data.js'], ['FRAMES', 'frames.js'], ['EFRAMES', 'eframes.js'], ['ART', 'art.js'], ['CARDSGEN', 'cards_gen.js'], ['ENGINE', 'engine.js'], ['RUN', 'run.js'], ['HUB', 'hub.js']]) page = page.replace(`/*${mark}*/`, () => src(file));
page = page.replace(/^<meta charset="utf-8">\n/, '');
const cut = page.indexOf('</style>') + '</style>'.length; // title, fonts and styles go in <head>, the screens and scripts in <body>
const out = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + page.slice(0, cut) + '\n</head>\n<body>\n' + page.slice(cut) + '\n</body>\n</html>\n';
fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), out);
console.log('public/index.html', Math.round(out.length / 1024), 'KB');
