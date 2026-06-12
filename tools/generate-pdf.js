// Génère docs/COMPTE-RENDU-MISSION.pdf depuis docs/COMPTE-RENDU-MISSION.md
// Usage : node tools/generate-pdf.js   (depuis la racine du repo, macOS + Chrome requis)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MD = path.join(ROOT, 'docs', 'COMPTE-RENDU-MISSION.md');
const HTML = path.join(ROOT, 'docs', '_cr.html');
const PDF = path.join(ROOT, 'docs', 'COMPTE-RENDU-MISSION.pdf');
function findBrowser() {
  if (process.platform !== 'win32') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Aucun navigateur Chromium trouvé. Installez Chrome ou Edge.');
}
const CHROME = findBrowser();

let marked;
try {
  marked = require('marked');
} catch (e) {
  execSync('npm i --no-save marked@12', { cwd: ROOT, stdio: 'inherit' });
  marked = require(path.join(ROOT, 'node_modules', 'marked'));
}
const parse = (marked.marked || marked).parse;

const css = `
@page { size: A4; margin: 16mm 15mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color:#1a1a2e; font-size:10.5px; line-height:1.5; }
h1 { font-size:24px; color:#7D80F4; margin:0 0 4px; }
h2 { font-size:15px; color:#3a3a5c; margin:18px 0 8px; border-bottom:2px solid #7D80F4; padding-bottom:3px; }
h3 { font-size:12px; color:#5a5a7c; margin:13px 0 5px; }
p { margin:5px 0; }
table { border-collapse:collapse; width:100%; margin:8px 0; font-size:9.5px; }
th { background:#7D80F4; color:#fff; text-align:left; padding:5px 7px; }
th code { background:rgba(255,255,255,.25); color:#fff; }
td { border:1px solid #d8d8e8; padding:4px 7px; vertical-align:top; }
tr:nth-child(even) td { background:#f6f6fc; }
code { background:#f0f0f8; padding:1px 4px; border-radius:3px; font-size:9px; font-family:"SF Mono",Menlo,monospace; }
pre { background:#16161e; color:#d6e4d6; padding:10px 12px; border-radius:6px; overflow:hidden; font-size:8.8px; line-height:1.45; border-left:4px solid #7D80F4; }
pre code { background:none; color:inherit; padding:0; }
strong { color:#2a2a4a; }
blockquote { border-left:3px solid #f0a020; background:#fff8ec; margin:8px 0; padding:6px 10px; }
blockquote p { margin:2px 0; }
ul,ol { margin:5px 0; padding-left:20px; }
li { margin:2.5px 0; }
hr { border:none; border-top:1px solid #ddd; margin:14px 0; }
.cover { padding-top:60px; }
.cover h1 { font-size:30px; border:none; }
.cover h2 { font-size:16px; border:none; color:#5a5a7c; margin-bottom:30px; }
.cover table { font-size:11px; margin-top:24px; }
.pagebreak { page-break-after: always; }
.fig { margin:10px 0; page-break-inside:avoid; text-align:center; }
.fig img { max-width:100%; max-height:540px; border:1px solid #c8c8dc; border-radius:6px; }
.cap { font-size:9px; color:#6a6a8a; margin-top:3px; font-style:italic; }
.shot { border:2px dashed #f0a020; background:#fff8ec; color:#8a5a00; padding:8px 12px; border-radius:6px; margin:8px 0; font-size:10px; }
h2,h3 { page-break-after:avoid; } table,pre,.shot,.fig { page-break-inside:avoid; }
`;

const body = parse(fs.readFileSync(MD, 'utf8'));
fs.writeFileSync(HTML, `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`);
execSync(`"${CHROME}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${PDF}" "${HTML}"`, { stdio: 'inherit' });
fs.unlinkSync(HTML);
console.log('PDF généré :', PDF);
