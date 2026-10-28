import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

// Keep original captures in Git, but deploy binaries as CDN files and only
// compressed, rewritable text in the function. Extensions preserve MIME types.
const manifest = JSON.parse(fs.readFileSync('data/manifest.json', 'utf8'));
const extensions = {'image/avif':'avif','image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/x-icon':'ico','font/woff2':'woff2','font/woff':'woff','application/font-woff':'woff','font/ttf':'ttf','application/pdf':'pdf','video/mp4':'mp4','audio/mpeg':'mp3','application/vnd.apple.mpegurl':'m3u8','application/x-mpegURL':'m3u8','application/octet-stream':'bin','image/bmp':'bmp'};
fs.mkdirSync('public/archive-assets', {recursive:true});
fs.mkdirSync('data/runtime', {recursive:true});
const seen = new Set();
let staticBytes=0, runtimeBytes=0;
for (const entry of Object.values(manifest)) {
 if (entry.location || seen.has(entry.file)) continue;
 seen.add(entry.file);
 const source = path.join('data/objects', entry.file);
 if (/text\/|javascript|json|svg/.test(entry.mime)) {
  const target = path.join('data/runtime', entry.file+'.gz');
  if (!fs.existsSync(target)) fs.writeFileSync(target, gzipSync(fs.readFileSync(source)));
  runtimeBytes += fs.statSync(target).size;
 } else {
  const extension = extensions[entry.mime];
  if (!extension) throw new Error('Add static MIME extension for '+entry.mime);
  const target = path.join('public/archive-assets', entry.file+'.'+extension);
  if (!fs.existsSync(target)) fs.copyFileSync(source, target);
  staticBytes += fs.statSync(target).size;
 }
}
fs.writeFileSync('data/static-extensions.json', JSON.stringify(extensions));
console.log(`Prepared ${seen.size} assets: ${staticBytes} static bytes, ${runtimeBytes} compressed function bytes`);
