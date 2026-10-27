import { NextRequest } from 'next/server';
import { lookup, read, localize } from '../../lib/archive';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
 const url=new URL(request.url);
 // Next's request URL can use the bind address (0.0.0.0) instead of
 // the browser-facing host, especially in dev and behind a preview proxy.
 const host=(request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host).split(',')[0].trim();
 const protocol=(request.headers.get('x-forwarded-proto') || url.protocol.slice(0,-1)).split(',')[0].trim();
 const origin=new URL(`${protocol}://${host}`).origin;
 const archive=url.pathname.startsWith('/_archive/');
 const original=archive?`https://${url.pathname.slice(10)}${url.search}`:`https://www.theglasspantry.com${url.pathname}${url.search}`;
 let entry=lookup(original);
 if(!entry && !archive) entry=lookup(original.split('?')[0]);
 if(!entry) return new Response('Not captured in the original crawl.',{status:404});
 if(entry.location) return new Response(null,{status:entry.status || 301,headers:{Location:localize(entry.location,origin)}});
 let body:Buffer|string=read(entry);
 if(/text\/|javascript|json|svg/.test(entry.mime)) {
  body=localize(body.toString('utf8'),origin);
  if(entry.mime==='text/html'&&!archive) {
   // Preserve full document navigations: Wix SPA routing expects live Wix services.
   body=body.replace('</body>',`<script>document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(a&&a.origin===location.origin&&!a.pathname.startsWith('/_archive/')&&a.pathname!==location.pathname&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&a.target!=='_blank'){e.preventDefault();e.stopImmediatePropagation();location.href=a.href}},true)</script></body>`);
  }
 }
 const headers:Record<string,string>={'Content-Type':entry.mime+(entry.mime.startsWith('text/')?'; charset=utf-8':''),'Cache-Control':typeof body === 'string' ? 'no-cache' : 'public, max-age=3600'};
 if(Buffer.isBuffer(body)) {
  headers['Accept-Ranges']='bytes';
  const range=request.headers.get('range');
  if(range) {
   const match=/^bytes=(\d*)-(\d*)$/.exec(range);
   if(match && (match[1] || match[2])) {
    const start=match[1]?Number(match[1]):Math.max(0,body.length-Number(match[2]));
    const end=match[1]?(match[2]?Math.min(Number(match[2]),body.length-1):body.length-1):body.length-1;
    if(start>end || start>=body.length) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${body.length}`}});
    headers['Content-Range']=`bytes ${start}-${end}/${body.length}`;
    return new Response(new Uint8Array(body.subarray(start,end+1)),{status:206,headers});
   }
  }
 }
 return new Response(typeof body === "string" ? body : new Uint8Array(body),{status:entry.status || 200,headers});
}
