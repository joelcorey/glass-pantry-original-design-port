"""Unmodified reference replay. Reads original WARC bytes; never uses port output."""
import http.server,json,pathlib,gzip,urllib.parse
root=pathlib.Path('/home/derpina/crawls/collections/glass-pantry');index={}
for p in sorted((root/'warc-cdx').glob('*')):
 for l in p.open():
  try:
   r=json.loads(l[l.index('{'):])
   if r.get('status')=='200' and r.get('mime') not in (None,'warc/revisit'):index[r['url']]=r
  except:pass
class Handler(http.server.BaseHTTPRequestHandler):
 def do_GET(self):
  u=urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query).get('url',[''])[0]
  r=index.get(u) or index.get(u.replace('%7E','~'))
  if not r:self.send_error(404);return
  with (root/'archive'/r['filename']).open('rb') as f:
   f.seek(int(r['offset']));raw=gzip.decompress(f.read(int(r['length'])))
  wh,h=raw.split(b'\r\n\r\n',1);n=int(next(l.split(b':',1)[1] for l in wh.split(b'\r\n') if l.startswith(b'Content-Length:')));body=h[:n].split(b'\r\n\r\n',1)[1]
  self.send_response(200);self.send_header('Content-Type',r['mime']);self.end_headers();self.wfile.write(body)
 def log_message(self,*args):pass
http.server.ThreadingHTTPServer(('127.0.0.1',3001),Handler).serve_forever()
