const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('data/manifest.json'));
const extensions=JSON.parse(fs.readFileSync('data/static-extensions.json'));
(async()=>{
 const trace='.next/server/app/[[...path]]/route.js.nft.json';
 const files=JSON.parse(fs.readFileSync(trace)).files;
 assert.ok(!files.some(f=>f.includes('/data/objects/')||f.includes('/public/archive-assets/')));
 const functionBytes=files.reduce((n,f)=>n+fs.statSync(path.resolve(path.dirname(trace),f)).size,0);
 assert.ok(functionBytes<500*1024*1024,'Keep function under 500 MiB');
 for(const e of Object.values(manifest)){
  if(e.location)continue;
  assert.ok(fs.existsSync(/text\/|javascript|json|svg/.test(e.mime)?'data/runtime/'+e.file+'.gz':'public/archive-assets/'+e.file+'.'+extensions[e.mime]));
 }
 const origin=process.env.PORT_ORIGIN||'http://localhost:3000';
 let checked=0;
 for(const mime of ['image/avif','image/jpeg','font/woff2','video/mp4']){
  const [url,e]=Object.entries(manifest).find(([,e])=>e.mime===mime&&!e.location);
  const local=origin+'/_archive/'+url.replace(/^https?:\/\//,'');
  const redirect=await fetch(local,{redirect:'manual'});
  assert.equal(redirect.status,307);
  const response=await fetch(new URL(redirect.headers.get('location'),origin));
  assert.equal(response.status,200);
  assert.ok(response.headers.get('content-type').startsWith(mime));
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync('data/objects/'+e.file));
  if(mime==='video/mp4'){
   const range=await fetch(local,{headers:{range:'bytes=0-99'}});
   assert.equal(range.status,206);
   assert.deepEqual(Buffer.from(await range.arrayBuffer()),fs.readFileSync('data/objects/'+e.file).subarray(0,100));
  }
  checked++;
 }
 console.log({functionBytes,binaryAssetsBundled:0,httpAssetChecks:checked,videoRange:'passed'});
})().catch(e=>{console.error(e);process.exitCode=1;});
