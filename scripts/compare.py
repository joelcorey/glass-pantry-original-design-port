from PIL import Image,ImageChops
import pathlib,json
results=[]
for original in pathlib.Path('verification').glob('*-original.png'):
 port=original.with_name(original.name.replace('-original.png','-port.png'))
 if not port.exists():continue
 a=Image.open(original).convert('RGB');b=Image.open(port).convert('RGB')
 if a.size!=b.size:results.append({'name':original.stem,'original_size':a.size,'port_size':b.size});continue
 diff=ImageChops.difference(a,b);diff.save(original.with_name(original.name.replace('-original.png','-diff.png')))
 changed=sum(1 for px in diff.getdata() if max(px)>10)
 results.append({'name':original.stem,'size':a.size,'changed_pixels_over_10':changed,'changed_percent':100*changed/(a.width*a.height)})
pathlib.Path('verification/visual-results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
