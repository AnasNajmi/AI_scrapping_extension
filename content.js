console.log("Content script loaded on:", window.location.href);

// Check if content script is already loaded to prevent duplicate loading
if (window.webScraperContentLoaded) {
  console.log("Content script already loaded, skipping...");
} else {
  window.webScraperContentLoaded = true;
  console.log("Content script initializing...");

function g(e){return e.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)||[]}function d(){return Array.from(document.images).map(e=>e.src)}function h(){const e=window.location.href,t=document.title,r=window.location.hostname;return{url:e,title:t,domain:r}}function w(e){const t=[],r=window.location.href;try{const o=["[data-item]",".item",".card",".product",".listing","article","tr",".row",".result",'[class*="item"]','[class*="post"]','[class*="entry"]','[id*="item"]','[data-testid*="item"]'];let n=null;for(const l of o){const a=document.querySelectorAll(l);if(a.length>1){n=a;break}}if(!n||n.length===0){const l=document.querySelectorAll("*");n=Array.from(l).filter(a=>a.children.length>0&&a.textContent&&a.textContent.trim().length>20)}(!n||n.length===0)&&(n=document.querySelectorAll("body")),n.forEach((l,a)=>{if(e.maxRows&&t.length>=e.maxRows)return;const u={};let f=!1;if(e.fields.forEach(s=>{try{let m=l.querySelectorAll(s.selector);if(m.length===0&&s.selector.includes(",")){const c=s.selector.split(",").map(p=>p.trim());for(const p of c){m=l.querySelectorAll(p);if(m.length>0)break}}let i="";m.length>0&&(s.type==="url"||s.type==="image"?i=Array.from(m).map(c=>{if(c instanceof HTMLAnchorElement)return c.href.startsWith("http")?c.href:new URL(c.href,window.location.origin).href;if(c instanceof HTMLImageElement)return c.src.startsWith("http")?c.src:new URL(c.src,window.location.origin).href;const p=c.getAttribute("href")||c.getAttribute("src");return p?p.startsWith("http")?p:new URL(p,window.location.origin).href:""}).filter(c=>c):i=Array.from(m).map(c=>c.textContent?.trim()||"").filter(c=>c).join(" | "),i&&i.length>0&&(f=!0)),u[s.name]=i}catch(m){console.error(`Error extracting field ${s.name}:`,m),u[s.name]=""}}),f){const s={...u,_meta:{pageIndex:0,rowIndex:a,extractedAt:new Date().toISOString(),source:r,userAgent:navigator.userAgent}};t.push(s)}}),t}catch(o){return console.error("Error extracting data:",o),[]}}async function y(e){return new Promise(t=>{let r=0,o=document.body.scrollHeight,n;const l=()=>{const a=document.body.scrollHeight;a>o&&(o=a,clearTimeout(n),r<e.maxScrolls?(r++,window.scrollTo(0,document.body.scrollHeight),n=setTimeout(l,e.idleTimeout)):t())};window.scrollTo(0,document.body.scrollHeight),r++,window.addEventListener("scroll",l,{passive:!0}),n=setTimeout(()=>{window.removeEventListener("scroll",l),t()},e.idleTimeout)})}function x(e){try{const t=document.querySelector(e);return t&&t.offsetParent!==null?(t.click(),!0):!1}catch(t){return console.error("Error clicking next page:",t),!1}}function checkPageAccess(){const e=window.location.href;if(e.startsWith("chrome://")||e.startsWith("chrome-extension://")||e.startsWith("about:")||e.startsWith("moz-extension://"))return{accessible:!1,reason:"browser-internal"};if(e.startsWith("file://"))return{accessible:!1,reason:"local-file"};if(document.readyState!=="complete"&&document.readyState!=="interactive")return{accessible:!1,reason:"loading"};return{accessible:!0,reason:"ok"}}

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
      case"extractCurrentPage":
        const n=w(e.config);
        r({success:!0,data:n,extractedCount:n.length});
        break;
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
