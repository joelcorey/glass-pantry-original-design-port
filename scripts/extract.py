"""Read-only extraction of HTTP response bodies from the original WARC collection."""
import json,glob,gzip,hashlib,pathlib,urllib.parse,collections
root=pathlib.Path('/home/derpina/crawls/collections/glass-pantry')
out=pathlib.Path('data');(out/'objects').mkdir(exist_ok=True)
rows=[]
for p in sorted((root/'warc-cdx').glob('*')):
 for line in p.open():
  try:
   r=json.loads(line[line.index('{'):])
   if r.get('mime') not in (None,'warc/revisit') and (r.get('status')=='200' or (urllib.parse.urlsplit(r.get('url','')).netloc=='www.theglasspantry.com' and r.get('status') in ('301','404'))):rows.append(r)
  except (ValueError,KeyError):pass
unique={r['url']:r for r in rows}; manifest={};errors=[]
files={}
for url,r in unique.items():
 try:
  if r['filename'] not in files:files[r['filename']]=(root/'archive'/r['filename']).open('rb')
  f=files[r['filename']];f.seek(int(r['offset']));raw=gzip.decompress(f.read(int(r['length'])))
  warc_head,http=raw.split(b'\r\n\r\n',1)
  length=int(next(l.split(b':',1)[1] for l in warc_head.split(b'\r\n') if l.startswith(b'Content-Length:')))
  http_head,body=http[:length].split(b'\r\n\r\n',1)
  key=hashlib.sha256(body).hexdigest(); dest=out/'objects'/key
  if not dest.exists():dest.write_bytes(body)
  manifest[url]={'file':key,'mime':r['mime'],'status':int(r['status'])}
  location=next((l.split(b':',1)[1].strip().decode() for l in http_head.split(b'\r\n') if l.lower().startswith(b'location:')),None)
  if location:manifest[url]['location']=location
 except Exception as e:errors.append([url,str(e)])
(out/'manifest.json').write_text(json.dumps(manifest))
routes=sorted(urllib.parse.urlsplit(u).path for u,v in manifest.items() if urllib.parse.urlsplit(u).netloc=='www.theglasspantry.com' and v['mime']=='text/html')
(out/'routes.json').write_text(json.dumps(routes,indent=2));(out/'extraction-errors.json').write_text(json.dumps(errors,indent=2))
print('Extracted',len(manifest),'responses;',len(routes),'routes;',len(errors),'errors')
