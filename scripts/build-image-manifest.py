#!/usr/bin/env python3
"""Regenerate docs/image-manifest.{md,csv} from actual image imports in src/."""
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


import json,os,csv,re
d=out
def classify(a,slots):
    cls=" ".join(filter(None,[s.get("class") or "" for s in slots]))
    p=a.lower()
    if "/og/" in p: return ("Social / OG card","1200x630 (1.91:1)")
    if "logo" in p: return ("Brand logo","SVG or 1024px PNG, transparent")
    if "hero" in p or "aspect-[21/9]" in cls or "h-screen" in cls: return ("Full-bleed hero","2400x1200 (2:1), safe centre crop")
    if "aspect-video" in cls or "16/9" in cls: return ("16:9 media block","1920x1080")
    if "aspect-square" in cls or "aspect-[1/1]" in cls: return ("Square tile","1200x1200")
    if "aspect-[4/3]" in cls: return ("4:3 card","1600x1200")
    if "rounded-full" in cls: return ("Avatar / round badge","512x512")
    if "object-cover" in cls: return ("Card / section cover","1600x900 (16:9)")
    return ("Inline illustration / card","1600x900 (16:9)")
rows=[]
for r in d:
    slots=[s for u in r["used_by"] for s in u["slots"]]
    slot,req=classify(r["asset"],slots)
    routes=sorted({x for u in r["used_by"] for x in u["routes"]})
    mods=sorted({u["module"] for u in r["used_by"]})
    alts=[s["alt"] for s in slots if s["alt"]]
    rows.append(dict(asset=r["asset"],intrinsic=r["intrinsic"],kb=r["kb"],slot=slot,required=req,
        routes="; ".join(routes),components="; ".join(mods),alt=alts[0] if alts else "",
        code="; ".join(dict.fromkeys(s["code"] for s in slots))[:200]))
os.makedirs("/dev-server/docs",exist_ok=True)
with open("/dev-server/docs/image-manifest.csv","w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=["asset","intrinsic","kb","slot","required","routes","components","alt","code"])
    w.writeheader(); w.writerows(rows)
# Machine-readable slot catalogue consumed by the admin image manager UI.
slots=[{"assetPath":r["asset"],
        "assetKey":os.path.splitext(os.path.basename(r["asset"]))[0],
        "folder":os.path.dirname(r["asset"]).replace("src/assets","assets"),
        "intrinsic":r["intrinsic"],"kb":r["kb"],"slot":r["slot"],"required":r["required"],
        "routes":[x for x in r["routes"].split("; ") if x],
        "components":[x for x in r["components"].split("; ") if x],
        "alt":r["alt"]} for r in rows]
os.makedirs("/dev-server/src/data",exist_ok=True)
json.dump({"generatedBy":"scripts/build-image-manifest.py","count":len(slots),"slots":slots},
          open("/dev-server/src/data/image-slots.json","w"),indent=1)

groups={}
for r in rows:
    g=os.path.dirname(r["asset"]).replace("src/assets","assets") or "assets"
    groups.setdefault(g,[]).append(r)
tot=sum(r["kb"] for r in rows)
md=["# NEVO Image Replacement Manifest","",
f"Every image asset currently imported by application code: **{len(rows)} files**, {tot/1024:.1f} MB total.",
"Use this to commission or license replacement photography. `Required` is the target delivery size for the slot (deliver at 2x where the slot is displayed smaller).","",
"Machine-readable copy: [`docs/image-manifest.csv`](./image-manifest.csv).","",
"## Summary by folder","","| Folder | Files | Size (MB) |","|---|---|---|"]
for g in sorted(groups): md.append(f"| `{g}` | {len(groups[g])} | {sum(x['kb'] for x in groups[g])/1024:.1f} |")
md.append("")
for g in sorted(groups):
    md += [f"## `{g}`","","| Asset | Current | Slot | Required | Page(s) | Component | Alt text |","|---|---|---|---|---|---|---|"]
    for r in sorted(groups[g],key=lambda x:x["asset"]):
        md.append("| `{}` | {} ({} KB) | {} | {} | {} | `{}` | {} |".format(
            os.path.basename(r["asset"]),r["intrinsic"],r["kb"],r["slot"],r["required"],
            r["routes"].replace("|","/"),r["components"],(r["alt"] or "—").replace("|","/")))
    md.append("")
md += ["## Replacement rules","",
"- Keep the same file path and name so no code changes are needed; only the binary is swapped.",
"- Deliver JPG for photography (quality 82, progressive) and PNG only for transparency.",
"- Match or exceed the `Required` size; never upscale a smaller source.",
"- Licensing: record source, licence type, and licence ID per file before committing.",
"- Re-run `python3 scripts/build-image-manifest.py` after any asset change to refresh this document.",""]
open("/dev-server/docs/image-manifest.md","w").write("\n".join(md))
print(len(rows),"rows written")
