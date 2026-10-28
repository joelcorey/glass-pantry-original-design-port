import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';
const origin=process.env.PORT_ORIGIN||'http://localhost:3000';
const routes=['/','/featured-recipes','/about-me','/food','/glass','/adventures','/wild-mushrooms','/make-your-own-sourdough-starter','/single-post/exploring-with-edna-episode-44-front-end-work-part-3-of-3'];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
const results=[];
fs.mkdirSync('verification/responsive',{recursive:true});
try {
 for(const route of routes){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto(origin+route,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>document.querySelectorAll('video').forEach(v=>v.pause()));
  await page.waitForTimeout(300);
  const desktop=await page.evaluate(()=>[...document.querySelectorAll('#site-root [id]')].map(e=>{const r=e.getBoundingClientRect();return [e.id,r.x,r.y,r.width,r.height,getComputedStyle(e).fontSize]}));
  // At desktop width the new stylesheet must produce identical pixels.
  await page.evaluate(()=>scrollTo(0,0));
  const withCSS=await page.screenshot({animations:'disabled'});
  await page.evaluate(()=>document.querySelector('link[href="/responsive.css"]').disabled=true);
  const withoutCSS=await page.screenshot({animations:'disabled'});
  assert.deepEqual(withCSS,withoutCSS,route+' desktop design changed');
  await page.evaluate(()=>document.querySelector('link[href="/responsive.css"]').disabled=false);
  results.push({route,width:1440,desktopPixelsUnchanged:true});
  for(const width of [320,390,430,768,979]){
   await page.setViewportSize({width,height:844});
   await page.waitForTimeout(200);
   await page.evaluate(()=>scrollTo(0,0));
   await page.waitForFunction(()=>document.documentElement.classList.contains('pantry-mobile-ready'));
   const metrics=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,headerBottom:document.querySelector('#SITE_HEADER').getBoundingClientRect().bottom,contentTop:document.querySelector('#PAGES_CONTAINER').getBoundingClientRect().top,links:[...document.querySelectorAll('#SITE_HEADER nav > ul > li:not([data-index="__more__"]) > a')].map(e=>({text:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,visible:getComputedStyle(e).visibility})),contentImages:[...document.querySelectorAll('#PAGES_CONTAINER .pantry-mobile-item.wixui-image')].filter(e=>getComputedStyle(e).visibility==='visible').map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}})}));
   assert.ok(metrics.documentWidth<=width+1,`${route} overflows at ${width}: ${metrics.documentWidth}`);
   assert.ok(metrics.contentTop>=metrics.headerBottom-10,route+' content overlaps header');
   for(const link of metrics.links){assert.equal(link.visible,'visible');assert.ok(link.height>=44,link.text+' tap target');}
   for(const image of metrics.contentImages){assert.ok(image.left>=-1&&image.right<=width+1,route+' image clipped at '+width);}
   if(width===390){
    await page.screenshot({path:`verification/responsive/${route==='/'?'home':route.split('/').pop()}-mobile.png`,animations:'disabled'});
   }
   results.push({route,width,documentWidth:metrics.documentWidth,navigationLinks:metrics.links.length,imagesChecked:metrics.contentImages.length});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.waitForTimeout(500);
  const restored=await page.evaluate(()=>[...document.querySelectorAll('#site-root [id]')].map(e=>{const r=e.getBoundingClientRect();return [e.id,r.x,r.y,r.width,r.height,getComputedStyle(e).fontSize]}));
  assert.deepEqual(restored,desktop,route+' desktop layout changed after resize');
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:844}});
 page.setDefaultTimeout(10000);
 await page.goto(origin);
 const button=page.locator('#SITE_HEADER .wixui-dropdown-menu li > button').first();
 await button.click();
 assert.equal(await button.getAttribute('aria-expanded'),'true');
 const submenu=page.locator('#SITE_HEADER .wixui-dropdown-menu li > ul[aria-hidden="false"]');
 await submenu.locator('a').first().waitFor({state:'visible'});
 await button.click();
 assert.equal(await button.getAttribute('aria-expanded'),'false');
 // A preserved navigation link must still open the original captured page.
 await page.locator('#SITE_HEADER nav > ul > li > a').filter({hasText:'About'}).click();
 await page.waitForURL(origin+'/about-me');
 results.push({mobileSubmenu:'passed',mobileNavigation:'passed'});
 const phone=await browser.newContext({...devices['iPhone 13']});
 const touchPage=await phone.newPage();
 await touchPage.goto(origin);
 await touchPage.waitForFunction(()=>document.documentElement.classList.contains('pantry-mobile-ready'));
 assert.ok(await touchPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const touchButton=touchPage.locator('#SITE_HEADER .wixui-dropdown-menu li > button').first();
 await touchButton.tap();
 assert.equal(await touchButton.getAttribute('aria-expanded'),'true');
 results.push({device:'iPhone 13',touchSubmenu:'passed',documentFitsViewport:true});
 await phone.close();
 fs.writeFileSync('verification/responsive-results.json',JSON.stringify(results,null,2));
 console.log(`Passed ${results.length} responsive checks, including desktop pixel preservation, resize restoration, submenu and navigation.`);
} finally {await browser.close();}
