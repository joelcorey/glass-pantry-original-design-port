const fs=require('node:fs');const assert=require('node:assert/strict');
globalThis.AsyncLocalStorage=require('node:async_hooks').AsyncLocalStorage;
const {NextRequest}=require('next/server');const {GET}=require('../.next/server/app/[[...path]]/route.js').routeModule.userland;
const manifest=JSON.parse(fs.readFileSync('data/manifest.json'));const origin='http://localhost:3000';
(async()=>{
 const tests=[];
 for(const mime of ['font/woff2','text/css','application/javascript','image/avif','image/jpeg','video/mp4']){
  const [url,e]=Object.entries(manifest).find(([,e])=>e.mime===mime);
  const local=origin+'/_archive/'+url.replace(/^https?:\/\//,'');
  const res=await GET(new NextRequest(local));assert.equal(res.status,200);assert.ok(res.headers.get('content-type').startsWith(mime));
  const body=Buffer.from(await res.arrayBuffer());
  if(!/text\/|javascript/.test(mime))assert.deepEqual(body,fs.readFileSync('data/objects/'+e.file));
  tests.push({mime,test:'Original asset served',status:'passed'});
  if(mime==='video/mp4'){
   for(const [range,start,end,status]of [['bytes=0-99',0,100,206],['bytes=-100',body.length-100,body.length,206],['bytes='+body.length+'-',0,0,416]]){
    const part=await GET(new NextRequest(local,{headers:{range}}));assert.equal(part.status,status);if(status===206)assert.deepEqual(Buffer.from(await part.arrayBuffer()),body.subarray(start,end));
    tests.push({test:range,status:'passed'});
   }
  }
 }
 const query=await GET(new NextRequest(origin+'/about-me?utm_source=test'));assert.equal(query.status,200);tests.push({test:'Site query string preserves captured page',status:'passed'});
 fs.writeFileSync('verification/behavior-results.json',JSON.stringify(tests,null,2));console.log(tests);
})().catch(e=>{console.error(e);process.exitCode=1;});
