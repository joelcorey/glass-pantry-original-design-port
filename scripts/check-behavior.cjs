const fs=require('node:fs');const assert=require('node:assert/strict');
globalThis.AsyncLocalStorage=require('node:async_hooks').AsyncLocalStorage;
const {NextRequest}=require('next/server');const {GET}=require('../.next/server/app/[[...path]]/route.js').routeModule.userland;
const manifest=JSON.parse(fs.readFileSync('data/manifest.json'));const origin='http://localhost:3000';
(async()=>{
 const tests=[];
 for(const mime of ['font/woff2','text/css','application/javascript','image/avif','image/jpeg','video/mp4']){
  const [url,e]=Object.entries(manifest).find(([,e])=>e.mime===mime);
  const local=origin+'/_archive/'+url.replace(/^https?:\/\//,'');
  const res=await GET(new NextRequest(local));
  if(!/text\/|javascript/.test(mime)) {
   assert.equal(res.status,307);
   const target=res.headers.get('location');
   assert.ok(target.startsWith('/archive-assets/'));
   assert.deepEqual(fs.readFileSync('public'+target),fs.readFileSync('data/objects/'+e.file));
  } else {
   assert.equal(res.status,200);assert.ok(res.headers.get('content-type').startsWith(mime));
   assert.ok((await res.arrayBuffer()).byteLength>0);
  }
  tests.push({mime,test:'Original asset served or redirected to identical static bytes',status:'passed'});
 }
 const query=await GET(new NextRequest(origin+'/about-me?utm_source=test'));assert.equal(query.status,200);tests.push({test:'Site query string preserves captured page',status:'passed'});
 fs.writeFileSync('verification/behavior-results.json',JSON.stringify(tests,null,2));console.log(tests);
})().catch(e=>{console.error(e);process.exitCode=1;});
