/** Exercise the actual production App Router handler without opening sockets. */
const fs=require('node:fs');const zlib=require('node:zlib');const crypto=require('node:crypto');
globalThis.AsyncLocalStorage=require('node:async_hooks').AsyncLocalStorage;
const {NextRequest}=require('next/server');const {GET}=require('../.next/server/app/[[...path]]/route.js').routeModule.userland;
const manifest=JSON.parse(fs.readFileSync('data/manifest.json'));const origin='http://localhost:3000';
const source=process.env.CRAWL_ROOT||'/home/derpina/crawls/collections/glass-pantry';const index={};
for(const name of fs.readdirSync(source+'/warc-cdx').sort())for(const line of fs.readFileSync(source+'/warc-cdx/'+name,'utf8').split('\n')){try{const r=JSON.parse(line.slice(line.indexOf('{')));if(r.mime!=='warc/revisit'&&r.status)index[r.url]=r;}catch{}}
function originalBody(url){const r=index[url];const fd=fs.openSync(source+'/archive/'+r.filename,'r');const c=Buffer.alloc(+r.length);fs.readSync(fd,c,0,c.length,+r.offset);fs.closeSync(fd);const raw=zlib.gunzipSync(c);const first=raw.indexOf('\r\n\r\n');const length=+raw.subarray(0,first).toString().match(/Content-Length: (\d+)/)[1];const http=raw.subarray(first+4,first+4+length);return http.subarray(http.indexOf('\r\n\r\n')+4);}
(async()=>{
 const results={routes:0,html_exact_after_url_normalization:0,redirects:0,original_404s:0,asset_samples:0,failures:[],missing_internal_links:[]};const missing=new Set();
 for(const [url,entry] of Object.entries(manifest)){
  if(new URL(url).host!=='www.theglasspantry.com'||entry.mime!=='text/html')continue;
  const res=await GET(new NextRequest(url.replace('https://www.theglasspantry.com',origin)));
  results.routes++;
  if(res.status!==(entry.status||200))results.failures.push({url,error:'status mismatch',status:res.status});
  if(entry.location){results.redirects++;if(res.headers.get('location')!==entry.location.replace('https://www.theglasspantry.com',origin))results.failures.push({url,error:'redirect mismatch'});continue;}
  if(entry.status===404)results.original_404s++;
  let rendered=await res.text();
  // Reverse the responsive asset tags, document navigation hook and URL relocation.
  rendered=rendered.replace('<link rel="stylesheet" href="/responsive.css">','').replace('<script src="/responsive.js"></script>','');
  rendered=rendered.replace(/<script>document\.addEventListener\('click',function\(e\)\{var a=e\.target\.closest[\s\S]*?<\/script><\/body>/,'</body>');
  rendered=rendered.split(origin+'/_archive/').join('https://').split(origin.replaceAll('/','\\/')+'\\/_archive\\/').join('https:\\/\\/');
  rendered=rendered.split(origin).join('https://www.theglasspantry.com').split(origin.replaceAll('/','\\/')).join('https:\\/\\/www.theglasspantry.com');
  // Scheme-relative and HTTP URLs are deliberately canonicalized to HTTPS.
  const normalize=t=>t.replace(/(?<=["'=(])\/\/([a-z0-9.-]+\.[a-z]{2,})/gi,'https://$1').replace(/http:\/\//g,'https://').split('http:\\/\\/').join('https:\\/\\/');
  const original=originalBody(url).toString('utf8');
  if(normalize(rendered)===normalize(original))results.html_exact_after_url_normalization++;
  else results.failures.push({url,error:'HTML differs beyond approved URL and navigation changes'});
  for(const match of original.matchAll(/href="https:\/\/www\.theglasspantry\.com([^"#?]*)/g)){
   const dest=new URL('https://www.theglasspantry.com'+match[1]).href;if(!manifest[dest]&&!manifest[decodeURI(dest)])missing.add(dest);
  }
  if(results.routes%100===0)console.log('Checked',results.routes,'routes');
 }
 const samples=Object.entries(manifest).filter(([,e])=>!e.mime.startsWith('text/html')).filter((_,i)=>i%200===0);
 for(const [url,e]of samples){const original=originalBody(url);const extracted=fs.readFileSync('data/objects/'+e.file);if(!original.equals(extracted))results.failures.push({url,error:'asset bytes differ'});results.asset_samples++;}
 results.missing_internal_links=[...missing].sort();
 const missingRes=await GET(new NextRequest(origin+'/this-page-was-never-captured'));
 results.uncaptured_route_status=missingRes.status;
 fs.writeFileSync('verification/route-results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify({...results,missing_internal_links:results.missing_internal_links.length},null,2));if(results.failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
