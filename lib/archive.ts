import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
type Entry = {file:string;mime:string;status?:number;location?:string};
const root = path.join(/* turbopackIgnore: true */ process.cwd(), 'data');
export const manifest: Record<string,Entry> = JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const hosts = [...new Set(Object.keys(manifest).map(u=>new URL(u).host))].sort((a,b)=>b.length-a.length);
export function lookup(url:string): Entry|undefined {
 let decoded=url;
 try { decoded=decodeURI(url); } catch { /* Unrecognized malformed URL remains a 404. */ }
 return manifest[url] || manifest[decoded] || manifest[url.replace(/%7E/gi,'~')];
}
const staticExtensions: Record<string,string> = JSON.parse(fs.readFileSync(path.join(root,'static-extensions.json'),'utf8'));
export function staticAsset(entry:Entry) {
 return /text\/|javascript|json|svg/.test(entry.mime) ? undefined : `/archive-assets/${entry.file}.${staticExtensions[entry.mime]}`;
}
export function read(entry:Entry) { return gunzipSync(fs.readFileSync(/* turbopackIgnore: true */ path.join(root,'runtime',entry.file+'.gz'))); }
const escapedHosts=hosts.map(host=>host.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
const urls=new RegExp(`(https?:\\/\\/|https?:\\\\/\\\\/|(?<=["'=(])\\/\\/)(${escapedHosts})`, 'g');
export function localize(text:string,origin:string) {
 const links:string[]=[];
 // External navigation destinations are links, not replay resources.
 text=text.replace(/(<a\b[^>]*?\bhref=["'])(https?:\/\/[^"']+|\/\/[^"']+)(["'])/gi,(whole,prefix:string,href:string,suffix:string)=>{
  try {
   const host=new URL(href.startsWith('//')?'https:'+href:href).host;
   if(host==='www.theglasspantry.com'||host==='theglasspantry.com')return whole;
   const token=`__GLASS_PANTRY_EXTERNAL_LINK_${links.length}__`;
   links.push(href);return prefix+token+suffix;
  } catch { return whole; }
 });
 text=text.replace(urls,(_whole,scheme:string,host:string)=>{
  const dest=host==='www.theglasspantry.com'||host==='theglasspantry.com' ? origin : `${origin}/_archive/${host}`;
  return scheme.includes('\\') ? dest.replaceAll('/', '\\/') : dest;
 });
 return text.replace(/__GLASS_PANTRY_EXTERNAL_LINK_(\d+)__/g,(_token,index:string)=>links[Number(index)]);
}
