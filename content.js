console.log("Content script loaded on:", window.location.href);

// Check if content script is already loaded to prevent duplicate loading
if (window.webScraperContentLoaded) {
  console.log("Content script already loaded, skipping...");
} else {
  window.webScraperContentLoaded = true;
  console.log("Content script initializing...");



function g(e){return e.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)||[]}
function d(){return Array.from(document.images).map(e=>e.src)}
function h(){const e=window.location.href,t=document.title,r=window.location.hostname;return{url:e,title:t,domain:r}}
function w(rawCfg){
  const outRows=[], sourceUrl=window.location.href;
  // normalize incoming config to avoid undefined access
  const cfg = {
    fields: Array.isArray(rawCfg?.fields) ? rawCfg.fields : [],
    maxRows: Number.isFinite(rawCfg?.maxRows) ? rawCfg.maxRows : Infinity,
  };
  try{
    const candidates=["[data-item]",".item",".card",".product",".listing","article","tr",".row",".result",'[class*="item"]','[class*="post"]','[class*="entry"]','[id*="item"]','[data-testid*="item"]'];
    let nodes=null;
    for(const sel of candidates){
      const list=document?.querySelectorAll?.(sel)||[];
      if(list.length>1){nodes=list;break}
    }
    if(!nodes || (nodes.length??0)===0){
      const all=document?.querySelectorAll?.("*")||[];
      nodes=Array.from(all).filter(el=>el?.children?.length>0 && typeof el?.textContent==="string" && el.textContent.trim().length>20);
    }
    if(!nodes || (nodes.length??0)===0){
      nodes=document?.querySelectorAll?.("body")||[];
    }
    Array.from(nodes).forEach((container,rowIndex)=>{
      if(outRows.length>=cfg.maxRows) return;
      const out={}; let hasAny=false;
      for(const field of cfg.fields){
        try{
          const name = field?.name ?? "";
          const sel = typeof field?.selector==="string" ? field.selector.trim() : "";
          if(!name){continue}
          if(!sel){out[name]=""; continue}
          let found = container?.querySelectorAll?.(sel) || [];
          if((found?.length??0)===0 && sel.includes(",")){
            for(const sSel of sel.split(",").map(s=>s.trim()).filter(Boolean)){
              found = container?.querySelectorAll?.(sSel) || [];
              if((found?.length??0)>0) break;
            }
          }
          let value="";
          if((found?.length??0)>0){
            if(field.type==="url" || field.type==="image"){
              value = Array.from(found).map(n=>{
                if(n instanceof HTMLAnchorElement){
                  const href=n.getAttribute("href")||"";
                  return href? new URL(href,window.location.origin).href : "";
                }
                if(n instanceof HTMLImageElement){
                  const src=n.getAttribute("src")||"";
                  return src? new URL(src,window.location.origin).href : "";
                }
                const ref=n.getAttribute?.("href")||n.getAttribute?.("src")||"";
                return ref? new URL(ref,window.location.origin).href : "";
              }).filter(Boolean).join(" | ");
            } else if(field.type==="attribute" && typeof field.attribute==="string" && field.attribute){
              value = Array.from(found).map(n=>n.getAttribute?.(field.attribute)||"").filter(Boolean).join(" | ");
            } else {
              value = Array.from(found).map(n=>(n.textContent??"").trim()).filter(Boolean).join(" | ");
            }
          }
          if(value && value.length>0) hasAny=true;
          out[name]=value;
        }catch(err){
          console.error(`Error extracting field ${field?.name||"unknown"}:`,err);
          if(field?.name) out[field.name]="";
        }
      }
      if(hasAny){
        outRows.push({
          ...out,
          _meta:{pageIndex:0,rowIndex,extractedAt:new Date().toISOString(),source:sourceUrl,userAgent:navigator.userAgent}
        });
      }
    });
    return outRows;
  }catch(err){
    console.error("Error extracting data:",err);
    return [];
  }
}
async function y(cfg){
  // safe defaults
  const maxScrolls = Number.isFinite(cfg?.maxScrolls) ? cfg.maxScrolls : 3;
  const idleTimeout = Number.isFinite(cfg?.idleTimeout) ? cfg.idleTimeout : 1000;
  return new Promise(t=>{let r=0,o=document.body.scrollHeight,n;
    const l=()=>{const a=document.body.scrollHeight;
      if(a>o){o=a; clearTimeout(n);
        if(r<maxScrolls){r++; window.scrollTo(0,document.body.scrollHeight); n=setTimeout(l,idleTimeout); return;}
      }
      t();
    };
    window.scrollTo(0,document.body.scrollHeight); r++;
    window.addEventListener("scroll",l,{passive:!0});
    n=setTimeout(()=>{window.removeEventListener("scroll",l); t();}, idleTimeout);
  })
}
function x(nextSelector){
  try{
    if(!nextSelector || typeof nextSelector!=="string") return !1;
    const t=document.querySelector(nextSelector);
    return t&&t.offsetParent!==null?(t.click(),!0):!1
  }catch(t){return console.error("Error clicking next page:",t),!1}
}
function checkPageAccess(){const e=window.location.href;if(e.startsWith("chrome://")||e.startsWith("chrome-extension://")||e.startsWith("about:")||e.startsWith("moz-extension://"))return{accessible:!1,reason:"browser-internal"};if(e.startsWith("file://"))return{accessible:!1,reason:"local-file"};if(document.readyState!=="complete"&&document.readyState!=="interactive")return{accessible:!1,reason:"loading"};return{accessible:!0,reason:"ok"}}
chrome.runtime.onMessage.addListener((e,t,r)=>{
  console.log("Content script received message:",e);
  try{
    const accessCheck=checkPageAccess();
    if(!accessCheck.accessible&&e.action!=="ping"){
      let errorMsg="Cannot access this page.";
      switch(accessCheck.reason){
        case"browser-internal":errorMsg="Cannot access browser internal pages. Please navigate to a regular website.";break;
        case"local-file":errorMsg="Cannot access local files. Please navigate to a website.";break;
        case"loading":errorMsg="Page is still loading. Please wait and try again.";break;
      }
      r({success:!1,error:errorMsg});
      return!0;
    }
    switch(e.action){
      case"ping":
        r({success:!0,message:"Content script is ready",url:window.location.href,accessible:accessCheck.accessible});
        break;
      case"getPageInfo":
        const o=h();
        r({success:!0,pageInfo:{...o,accessible:accessCheck.accessible,readyState:document.readyState}});
        break;
    //   case"extractCurrentPage":
    //     const n=w(e.config);
    //     r({success:!0,data:n,extractedCount:n.length});
    //     break;
         case"extractCurrentPage": {
        // Normalize config so extractor never sees undefined
        const raw = (e && e.config) ? e.config : {};
        const safeCfg = {
          fields: Array.isArray(raw.fields) ? raw.fields : [],
          maxRows: Number.isFinite(raw.maxRows) ? raw.maxRows : Infinity,
        };
        const n=w(safeCfg);
        r({success:!0,data:n,extractedCount:n.length});
        break;
      }
      case"scrollPage":
        return y(e.scrollConfig).then(()=>{
          r({success:!0,scrolled:!0})
        }).catch(f=>{
          r({success:!1,error:f.message})
        }),!0;
      case"clickNextPage":
        const l=x(e.nextSelector);
        r({success:l,clicked:l});
        break;
      case"SCRAPE_PAGE":
        const a=g(document.body.innerText),u=d();
        r({emails:a,images:u});
        break;
      default:
        r({success:!1,error:"Unknown action: "+e.action})
    }
  }catch(o){
    console.error("Content script error:",o);
    r({success:!1,error:o instanceof Error?o.message:"Unknown error",stack:o instanceof Error?o.stack:undefined})
  }
  return!0
});

console.log("Content script fully initialized for:", window.location.href);
}
