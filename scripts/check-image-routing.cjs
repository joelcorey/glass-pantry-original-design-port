// Regress the actual Next bind-host mismatch, including proxy and high-DPI URLs.
const fs = require('node:fs');
const assert = require('node:assert/strict');
globalThis.AsyncLocalStorage = require('node:async_hooks').AsyncLocalStorage;
const { NextRequest } = require('next/server');
const { GET } = require('../.next/server/app/[[...path]]/route.js').routeModule.userland;
const manifest = JSON.parse(fs.readFileSync('data/manifest.json'));
(async () => {
 const results = [];
 for (const scenario of [
  {name:'localhost with wildcard bind', headers:{host:'localhost:3000'}, origin:'http://localhost:3000'},
  {name:'LAN host with wildcard bind', headers:{host:'192.168.1.20:3000'}, origin:'http://192.168.1.20:3000'},
  {name:'HTTPS preview proxy', headers:{host:'0.0.0.0:3000','x-forwarded-host':'glass-pantry.preview.example','x-forwarded-proto':'https'}, origin:'https://glass-pantry.preview.example'},
 ]) {
  const response = await GET(new NextRequest('http://0.0.0.0:3000/',{headers:scenario.headers}));
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-cache');
  const html=await response.text();
  const images=[...html.matchAll(/<img\b[^>]*>/gi)];
  const urls=new Set();
  for(const [tag] of images) {
   for(const [,attribute,value] of tag.matchAll(/\b(src|srcset)="([^"]+)"/gi)) {
    if(attribute.toLowerCase()==='srcset') {
     for(const [,url] of value.matchAll(/(https?:\/\/[^\s]+)\s+[\d.]+[wx]/g))urls.add(url.replaceAll('&amp;','&'));
    } else urls.add(value.replaceAll('&amp;','&'));
   }
  }
  assert.ok(urls.size>50,'Exercise original image src and high-DPI srcset variants');
  for(const url of urls) {
   assert.equal(new URL(url).origin,scenario.origin);
   const image=await GET(new NextRequest(url,{headers:scenario.headers}));
   assert.equal(image.status,200,url);
   assert.match(image.headers.get('content-type'),/^image\//);
   const original='https://'+new URL(url).pathname.slice('/_archive/'.length);
   const entry=manifest[original];assert.ok(entry,original);
   assert.deepEqual(Buffer.from(await image.arrayBuffer()),fs.readFileSync('data/objects/'+entry.file));
  }
  results.push({scenario:scenario.name,origin:scenario.origin,images:images.length,imageURLs:urls.size,status:'passed'});
 }
 fs.writeFileSync('verification/image-routing-results.json',JSON.stringify(results,null,2));
 console.log(results);
})().catch(error=>{console.error(error);process.exitCode=1;});
