import os,re,json
from PIL import Image
ROOT="/dev-server"; SRC=os.path.join(ROOT,"src")
tsfiles=[]
for dp,dn,fn in os.walk(SRC):
    for f in fn:
        if f.endswith((".tsx",".ts")): tsfiles.append(os.path.join(dp,f))
def resolve(spec,frm):
    if spec.startswith("@/"): base=os.path.join(SRC,spec[2:])
    elif spec.startswith("."): base=os.path.normpath(os.path.join(os.path.dirname(frm),spec))
    else: return None
    for c in [base,base+".tsx",base+".ts",base+"/index.tsx",base+"/index.ts"]:
        if os.path.isfile(c): return c
    return None
# build importer graph: file -> files it imports
imports={}; rev={}
imp_any=re.compile(r'from\s+["\']([^"\']+)["\']')
texts={}
for f in tsfiles:
    t=open(f,errors="ignore").read(); texts[f]=t
    for m in imp_any.finditer(t):
        r=resolve(m.group(1),f)
        if r: rev.setdefault(r,set()).add(f)
def routes_for(f,seen=None):
    seen=seen or set()
    if f in seen: return set()
    seen.add(f)
    out=set()
    relp=os.path.relpath(f,SRC)
    if relp.startswith("routes/"): out.add(relp)
    for p in rev.get(f,()): out|=routes_for(p,seen)
    return out
def route_to_url(r):
    p=r[len("routes/"):].rsplit(".",1)[0]
    p=p.replace("/index","").replace(".index","")
    p=p.replace("_authenticated.","").replace("_authenticated/","")
    p=p.replace(".","/")
    if p in("index","__root"): return "/" if p=="index" else "(root layout)"
    return "/"+p
imp_re=re.compile(r'import\s+([A-Za-z0-9_]+)\s+from\s+["\']([^"\']+\.(?:jpg|jpeg|png|webp|avif|svg)(?:\.asset\.json)?)["\']')
rows={}
for f in tsfiles:
    t=texts[f]
    lines=t.split("\n")
    for m in imp_re.finditer(t):
        var,spec=m.groups()
        if spec.startswith("@/"): p=os.path.join(SRC,spec[2:])
        elif spec.startswith("."): p=os.path.normpath(os.path.join(os.path.dirname(f),spec))
        else: continue
        if not os.path.exists(p): continue
        ctx=[]
        for i,l in enumerate(lines):
            if re.search(r'\b'+re.escape(var)+r'\b',l) and not l.strip().startswith("import"):
                chunk="\n".join(lines[max(0,i-3):i+3])
                alt=re.search(r'alt=["\']([^"\']+)',chunk)
                cls=re.search(r'className=["\']([^"\']+)',chunk)
                ctx.append({"line":i+1,"alt":alt.group(1) if alt else None,"class":cls.group(1)[:80] if cls else None,"code":l.strip()[:160]})
        rows.setdefault(p,{"assets":p,"used_by":[]})["used_by"].append({
          "module":os.path.relpath(f,ROOT),"var":var,
          "routes":sorted(route_to_url(r) for r in routes_for(f)),
          "slots":ctx[:5]})
out=[]
for p,v in sorted(rows.items()):
    dim="CDN pointer"
    if not p.endswith(".asset.json"):
        try:
            im=Image.open(p); dim=f"{im.width}x{im.height}"
        except: dim="?"
    out.append({"asset":os.path.relpath(p,ROOT),"intrinsic":dim,"kb":os.path.getsize(p)//1024,**v})
json.dump(out,open("/tmp/manifest.json","w"),indent=1)
print(len(out))
