(() => {
"use strict";
const cfg=window.TP_CONFIG||{}, topics=window.TP_TOPICS||[];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const fmt=n=>new Intl.NumberFormat().format(Math.round(n||0));
const safe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today=new Date(); today.setUTCDate(today.getUTCDate()-2);
const end=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()));
const ymd=d=>d.toISOString().slice(0,10).replace(/-/g,"");
const end7=new Date(end); end7.setUTCDate(end7.getUTCDate()-6);
const start7=new Date(end7); start7.setUTCDate(start7.getUTCDate()-7);
const endPrev=new Date(end7); endPrev.setUTCDate(endPrev.getUTCDate()-1);
const dateA=ymd(start7),dateB=ymd(end),dateC=ymd(start7),dateD=ymd(endPrev);
const cacheKey="tp-data-v5";
const imageCacheKey="tp-images-v1";
let records=[];
function cacheRead(){try{const x=JSON.parse(localStorage.getItem(cacheKey)||"null");if(x&&Date.now()-x.time<30*60000)return x.data;}catch(e){}return null;}
async function loadOne(t){
 // Wikimedia's Analytics API expects the agent value "all-agents", not "all".
 // Identify the browser client as recommended by Wikimedia for browser-based requests.
 const url=cfg.api+"/en.wikipedia/all-access/all-agents/"+encodeURIComponent(t.article)+"/daily/"+dateA+"/"+dateB;
 let res;
 for(let attempt=0;attempt<4;attempt++){
   res=await fetch(url,{headers:{Accept:"application/json","Api-User-Agent":"TrendPulse/1.0 (https://adeyemilukman495-netizen.github.io/Trendplus-/)"}});
   if(res.status===404)return {...t,views:0,previous:0,avg:0,growth:0,series:[],noData:true};
   if(res.status!==429&&res.status!==503)break;
   if(attempt===3)throw new Error("API "+res.status);
   const retryAfter=Number(res.headers.get("Retry-After")||0);
   const waitMs=retryAfter>0?Math.min(retryAfter*1000,30000):5000*Math.pow(2,attempt);
   await new Promise(resolve=>setTimeout(resolve,waitMs));
 }
 if(!res||!res.ok)throw new Error("API "+(res?res.status:"request failed"));
 const json=await res.json(), items=json.items||[];
 const recent=items.filter(x=>x.timestamp>=dateA+"00"&&x.timestamp<=dateB+"00");
 const previous=recent.filter(x=>x.timestamp.slice(0,8)>=dateC&&x.timestamp.slice(0,8)<=dateD);
 const current=recent.filter(x=>x.timestamp.slice(0,8)>dateD);
 const sum=a=>a.reduce((n,x)=>n+(x.views||0),0);
 const currentViews=sum(current), previousViews=sum(previous);
 return {...t,views:currentViews,previous:previousViews,avg:currentViews/7,growth:previousViews?((currentViews-previousViews)/previousViews)*100:(currentViews?null:0),series:recent.map(x=>x.views||0)};
}
async function loadImages(){
 let saved={};
 try{const raw=JSON.parse(localStorage.getItem(imageCacheKey)||"null");if(raw&&Date.now()-raw.time<7*86400000)saved=raw.data||{};}catch(e){}
 const unique=[...new Map(topics.map(t=>[t.article,t])).values()];
 const missing=unique.filter(t=>!Object.prototype.hasOwnProperty.call(saved,t.article));
 for(let i=0;i<missing.length;i+=6){
   const batch=await Promise.all(missing.slice(i,i+6).map(async t=>{
     try{
       const url="https://en.wikipedia.org/api/rest_v1/page/summary/"+encodeURIComponent(t.article.replace(/_/g," "));
       const res=await fetch(url,{headers:{Accept:"application/json"}});
       if(!res.ok)return [t.article,null];
       const data=await res.json();
       const src=data.thumbnail&&data.thumbnail.source||data.originalimage&&data.originalimage.source||null;
       return [t.article,typeof src==="string"&&src.startsWith("https://")?src:null];
     }catch(e){return [t.article,null];}
   }));
   batch.forEach(([key,value])=>{saved[key]=value;});
 }
 try{localStorage.setItem(imageCacheKey,JSON.stringify({time:Date.now(),data:saved}));}catch(e){}
 records=records.map(t=>({...t,image:saved[t.article]||null}));
}
async function loadData(){
 const cached=cacheRead();
 if(cached){records=cached;}
 else{
   const unique=[...new Map(topics.map(t=>[t.article,t])).values()];
   const output=[];
   // Wikimedia asks clients to wait for each Analytics API request to finish
   // before sending the next one. Keep requests sequential to avoid throttling.
   for(let i=0;i<unique.length;i++){
     const t=unique[i];
     try{output.push(await loadOne(t));}
     catch(e){output.push({...t,views:0,previous:0,avg:0,growth:0,series:[],error:true});}
   }
   const byArticle=new Map(output.map(x=>[x.article,x]));
   records=topics.map(t=>({...byArticle.get(t.article),...t}));
   try{localStorage.setItem(cacheKey,JSON.stringify({time:Date.now(),data:records}));}catch(e){}
 }
 await loadImages();
 return records;
}
function starButton(t){const saved=JSON.parse(localStorage.getItem("tp-follows")||"[]");const yes=saved.includes(t.article);return '<button class="star" type="button" data-star="'+safe(t.article)+'" aria-label="'+(yes?"Unfollow ":"Follow ")+safe(t.title)+'" aria-pressed="'+yes+'">'+(yes?"★":"☆")+'</button>';}
function card(t){
 const hasBaseline=t.growth!==null&&Number.isFinite(t.growth);
 const rise=hasBaseline&&t.growth>=0;
 const trend=hasBaseline?Math.round(t.growth):null;
 const series=t.series||[];
 const points=series.map((v,i)=>{const x=4+i*(92/Math.max(1,series.length-1));const max=Math.max(1,...series);const y=31-(v/max)*26;return x.toFixed(1)+","+y.toFixed(1)}).join(" ");
 const badge=hasBaseline?(rise?"▲ ":"▼ ")+Math.abs(trend)+"% vs previous week":"NEW · no previous-week baseline";
 return '<article class="card">'+(t.image?'<a href="https://en.wikipedia.org/wiki/'+encodeURIComponent(t.article)+'" target="_blank" rel="noopener" aria-label="View image source for '+safe(t.title)+'"><img src="'+safe(t.image)+'" alt="'+safe(t.title)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" style="display:block;width:100%;height:170px;object-fit:cover;border-radius:12px;margin-bottom:12px"></a><small style="display:block;margin:-6px 0 10px;opacity:.7">Image via Wikipedia · see article for image credits</small>':"")+'<div class="top"><span class="tag">'+safe((cfg.categories||[]).find(c=>c[0]===t.category)?.[1]||t.category)+'</span>'+starButton(t)+'</div><h3><a href="https://en.wikipedia.org/wiki/'+encodeURIComponent(t.article)+'" target="_blank" rel="noopener">'+safe(t.title)+'</a></h3><p class="avg"><b>'+fmt(t.avg)+'</b> avg views/day</p><span class="badge '+(hasBaseline?(rise?"up":"down"):"up")+'">'+badge+'</span>'+(points?'<svg class="spark" viewBox="0 0 100 36" role="img" aria-label="Recent page view trend"><polyline points="'+points+'"></polyline></svg>':"")+'</article>';
}
function bindStars(root=document){$$("[data-star]",root).forEach(b=>b.addEventListener("click",()=>{let a=[];try{a=JSON.parse(localStorage.getItem("tp-follows")||"[]")}catch(e){}const id=b.dataset.star;a=a.includes(id)?a.filter(x=>x!==id):[...a,id];localStorage.setItem("tp-follows",JSON.stringify(a));b.textContent=a.includes(id)?"★":"☆";b.setAttribute("aria-pressed",String(a.includes(id)));b.setAttribute("aria-label",(a.includes(id)?"Unfollow ":"Follow ")+(topics.find(t=>t.article===id)?.title||id));}));}
function chips(active,fn){const ul=$("#chips");if(!ul)return;ul.innerHTML=(cfg.categories||[]).map(c=>'<li><button class="chip" type="button" data-cat="'+c[0]+'" aria-pressed="'+(c[0]===active)+'">'+safe(c[1])+'</button></li>').join("");$$("[data-cat]",ul).forEach(b=>b.addEventListener("click",()=>{active=b.dataset.cat;$$("[data-cat]",ul).forEach(x=>x.setAttribute("aria-pressed",String(x===b)));fn(active);}));}
function renderList(target,list){if(!target)return;target.innerHTML=list.length?list.map(card).join(""):'<p class="demo">No page-view data was returned for these topics. Please try again later.</p>';bindStars(target);}
function render(){
 const page=document.body.dataset.page||"";
 const all=records.filter(t=>t.views>0);
 const trend=[...all].sort((a,b)=>b.avg-a.avg);
 const rise=[...all].filter(t=>t.previous>=cfg.minimumViews).sort((a,b)=>b.growth-a.growth);
 renderList($("#home-trend"),trend.slice(0,6));
 const movieTopics=all.filter(t=>["movies","hollywood","international-movies","bollywood","nollywood","animation"].includes(t.category)).sort((a,b)=>b.avg-a.avg);
 renderList($("#home-movies"),movieTopics.slice(0,8));
 renderList($("#home-rise"),rise.slice(0,6));
 const out=$("#out");
 if(out){
   const isCategory=page==="category";
   let category=document.body.dataset.cat||"all",mode="trend";
   const draw=()=>{let list=category==="all"?all:category==="movies"?all.filter(t=>["movies","hollywood","international-movies"].includes(t.category)):all.filter(t=>t.category===category);list=mode==="rise"?[...list].sort((a,b)=>b.growth-a.growth):[...list].sort((a,b)=>b.avg-a.avg);renderList(out,list);const count=$("#count");if(count){const failed=records.filter(t=>t.error).length;count.textContent=list.length+" topics with page-view data"+(failed?" · "+failed+" topic lookups unavailable":"")+" · latest stats through "+end.toLocaleDateString()+" · checked "+new Date().toLocaleTimeString()+" · auto-refresh 30m";}};
   if(!isCategory)chips("all",c=>{category=c;draw();});
   else $$("[data-m]").forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.m;$$("[data-m]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));draw();}));
   draw();
 }
 async function renderGlobalBuzz(){
 const buzz=$("#buzz");if(!buzz)return;
 const date=$("#buzz-date");if(date)date.textContent=end.toLocaleDateString();
 const y=String(end.getUTCFullYear()),m=String(end.getUTCMonth()+1).padStart(2,"0"),d=String(end.getUTCDate()).padStart(2,"0");
 try{
   const response=await fetch("https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/"+y+"/"+m+"/"+d,{headers:{Accept:"application/json"}});
   if(!response.ok)throw new Error("Global page-view feed unavailable");
   const payload=await response.json();
   const articles=(payload.items?.[0]?.articles||[]).filter(x=>x.article&&!/^(Main_Page|Special:|Wikipedia:|File:|Portal:|User:)/i.test(x.article)).slice(0,5);
   if(!articles.length)throw new Error("No global articles returned");
   buzz.innerHTML=articles.map((item,i)=>{const title=item.article.replace(/_/g," ");return '<li><span class="n">'+(i+1)+'</span><a href="https://en.wikipedia.org/wiki/'+encodeURIComponent(item.article)+'" target="_blank" rel="noopener">'+safe(title)+'</a><small>'+fmt(item.views)+' views</small></li>';}).join("");
 }catch(error){
   buzz.innerHTML=trend.slice(0,5).map((t,i)=>'<li><span class="n">'+(i+1)+'</span><a href="https://en.wikipedia.org/wiki/'+encodeURIComponent(t.article)+'" target="_blank" rel="noopener">'+safe(t.title)+'</a><small>'+fmt(t.views)+' views · tracked</small></li>').join("")||"<li>Global trend data is temporarily unavailable.</li>";
 }
 }
 renderGlobalBuzz();
 const note=$("#home-note");if(note&&all.length)note.textContent="Ranked by average daily Wikipedia page views for the latest complete 7-day period.";
}
function init(){
 const siteNav=document.querySelector('header.top nav');if(siteNav&&!document.querySelector('.site-menu-toggle')){const toggle=document.createElement('button');toggle.type='button';toggle.className='site-menu-toggle';toggle.setAttribute('aria-label','Open navigation');toggle.setAttribute('aria-expanded','false');toggle.innerHTML='<span></span><span></span><span></span>';siteNav.parentElement.insertBefore(toggle,siteNav);toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');siteNav.classList.toggle('is-open',open)});siteNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{toggle.setAttribute('aria-expanded','false');siteNav.classList.remove('is-open')}));}
 const placeholders=$$(".grid");placeholders.forEach(el=>{if(!el.children.length)el.innerHTML='<div class="card sk" aria-label="Loading trends"></div><div class="card sk" aria-hidden="true"></div><div class="card sk" aria-hidden="true"></div>';});
 loadData().then(render).catch(()=>{ $$(".grid").forEach(el=>el.innerHTML='<p class="demo">Live trend data is temporarily unavailable. Please refresh in a little while.</p>');});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
setInterval(()=>{if(document.visibilityState==="visible")loadData().then(render).catch(()=>{});},30*60*1000);
})();