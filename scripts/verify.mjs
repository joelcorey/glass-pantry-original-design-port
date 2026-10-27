/** Compare raw original WARC replay with the running Next.js port. */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
const source=process.env.CRAWL_ROOT || '/home/derpina/crawls/collections/glass-pantry';
const origin=process.env.PORT_ORIGIN || 'http://localhost:3000';
const index=new Map();
for(const name of fs.readdirSync(path.join(source,'warc-cdx')).sort()) {
 for(const line of fs.readFileSync(path.join(source,'warc-cdx',name),'utf8').split('\n')) {
  try {const r=JSON.parse(line.slice(line.indexOf('{')));if(r.mime!=='warc/revisit'&&r.status)index.set(r.url,r);}catch{}
 }
}
function responseFor(url){
 const r=index.get(url)||index.get(url.replace(/%7E/gi,'~'));
 if(!r)return {status:404,body:'Not captured in original crawl.'};
 const fd=fs.openSync(path.join(source,'archive',r.filename),'r');const compressed=Buffer.alloc(Number(r.length));fs.readSync(fd,compressed,0,compressed.length,Number(r.offset));fs.closeSync(fd);
 const record=zlib.gunzipSync(compressed);const split=record.indexOf('\r\n\r\n');const length=Number(record.subarray(0,split).toString().match(/Content-Length: (\d+)/)[1]);const http=record.subarray(split+4,split+4+length);const start=http.indexOf('\r\n\r\n');const headers=http.subarray(0,start).toString();const location=headers.match(/\r\nlocation: ([^\r]+)/i)?.[1];
 return {status:Number(r.status),contentType:r.mime,body:http.subarray(start+4),headers:location?{location}:{}};
}
fs.mkdirSync('verification',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const routes=(process.env.VERIFY_ROUTES||'/,/featured-recipes,/about-me,/wild-mushrooms,/make-your-own-sourdough-starter,/single-post/exploring-with-edna-episode-44-front-end-work-part-3-of-3').split(',');
const sizes=[{name:'desktop',width:1440,height:1000},{name:'tablet',width:768,height:1024},{name:'mobile',width:390,height:844}];
const results=[];
for(const route of routes)for(const size of sizes){
 const label=(route==='/'?'home':route.slice(1).replaceAll('/','_'))+'-'+size.name;
 for(const kind of ['original','port']){
  const context=await browser.newContext({viewport:{width:size.width,height:size.height},serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async r=>{
   const url=r.request().url();
   if(kind==='original')return r.fulfill(responseFor(url));
   if(url.startsWith(origin))return r.continue();
   return r.abort();
  });
  await page.goto((kind==='original'?'https://www.theglasspantry.com':origin)+route,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(6000);
  // Load original lazy imagery at identical scroll positions.
  for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=700){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(100);}
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(1000);
  await page.screenshot({path:`verification/${label}-${kind}.png`,fullPage:true});
  results.push({route,viewport:size,kind,title:await page.title(),errors,links:await page.locator('a[href]').count()});
  await context.close();
 }
}
await browser.close();fs.writeFileSync('verification/browser-results.json',JSON.stringify(results,null,2));
execFileSync('python',['scripts/compare.py'],{stdio:'inherit'});
