import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

SH = Path("/tmp/browser/rtl/shots"); SH.mkdir(parents=True, exist_ok=True)
PATHS = ["/ar","/ar/solutions","/ar/solutions/sandwich-panels","/ar/contact","/ar/knowledge-hub","/ar/industries","/ar/about"]
AXE = Path("/dev-server/node_modules/axe-core/axe.min.js").read_text()

CHECK = """
() => {
  const out = {dir: document.documentElement.dir, lang: document.documentElement.lang,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    mains: document.querySelectorAll('main').length, issues: []};
  // ltr-forcing / misaligned text blocks
  document.querySelectorAll('body *').forEach(el=>{
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width===0||r.height===0) return;
    if (r.right > document.documentElement.clientWidth + 2 || r.left < -2)
      out.issues.push({t:'overflow', tag:el.tagName, cls:(el.className+'').slice(0,80), left:Math.round(r.left), right:Math.round(r.right)});
    if (cs.direction==='ltr' && el.textContent.trim().length>10 && !el.closest('[dir="ltr"]'))
      out.issues.push({t:'ltr-direction', tag:el.tagName, cls:(el.className+'').slice(0,80)});
    if (el.scrollWidth > el.clientWidth + 4 && cs.overflow!=='auto' && cs.overflowX!=='auto' && cs.overflowX!=='scroll' && el.children.length===0)
      out.issues.push({t:'clipped-text', tag:el.tagName, cls:(el.className+'').slice(0,80), txt:el.textContent.trim().slice(0,40)});
  });
  out.issues = out.issues.slice(0,25);
  return out;
}
"""

FOCUS = """
() => {
  const sel='a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
  const els=[...document.querySelectorAll(sel)].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';});
  const bad=[];
  els.forEach(e=>{ if(+e.getAttribute('tabindex')>0) bad.push({t:'positive-tabindex', tag:e.tagName}); });
  // visual RTL order check within the header nav row
  const rows={};
  els.forEach((e,i)=>{const r=e.getBoundingClientRect(); const key=Math.round(r.top/12); (rows[key]=rows[key]||[]).push({i,x:r.right});});
  let inversions=0;
  Object.values(rows).forEach(g=>{ for(let k=1;k<g.length;k++) if(g[k].x>g[k-1].x+8) inversions++; });
  return {count:els.length, positiveTabindex:bad, rtlOrderInversions:inversions};
}
"""

async def main():
  results={}
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True)
    for w in (390,1280):
      ctx=await b.new_context(viewport={"width":w,"height":1800})
      pg=await ctx.new_page()
      for path in PATHS:
        await pg.goto("http://localhost:8080"+path, wait_until="networkidle")
        await pg.wait_for_timeout(600)
        base=await pg.evaluate(CHECK)
        foc=await pg.evaluate(FOCUS)
        await pg.add_script_tag(content=AXE)
        ax=await pg.evaluate("async()=>{const r=await axe.run(document,{resultTypes:['violations']});return r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ex:v.nodes.slice(0,2).map(n=>n.html.slice(0,120))}));}")
        results[f"{w}{path}"]={"base":base,"focus":foc,"axe":ax}
        if w==390 and path in ("/ar","/ar/contact"):
          await pg.screenshot(path=str(SH/f"{path.strip('/').replace('/','_')}_{w}.png"))
      await ctx.close()
    await b.close()
  Path("/tmp/browser/rtl/out.json").write_text(json.dumps(results,indent=1,ensure_ascii=False))
  for k,v in results.items():
    print(k,"| dir",v["base"]["dir"],"lang",v["base"]["lang"],"ovf",v["base"]["overflowX"],"mains",v["base"]["mains"],
          "| issues",len(v["base"]["issues"]),"| axe",[(a["id"],a["n"]) for a in v["axe"]],"| tabidx",v["focus"]["positiveTabindex"],"inv",v["focus"]["rtlOrderInversions"])
asyncio.run(main())
