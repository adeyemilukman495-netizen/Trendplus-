(()=>{'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cacheKey='tp-home-tvmaze-v1',cacheAge=6*60*60*1000;
const validUrl=value=>typeof value==='string'&&/^https:\/\//i.test(value)?value:'';
const year=show=>(show.premiered||'').slice(0,4)||'Year unknown';
function card(show){
 const poster=validUrl(show.image?.original||show.image?.medium),url=validUrl(show.url)||'https://www.tvmaze.com/';
 const rating=Number(show.rating?.average),genres=(show.genres||[]).slice(0,2).join(' · ');
 return '<article class="pina-poster-card"><a class="pina-poster-link" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer" aria-label="View '+esc(show.name)+' on TVmaze">'+(poster?'<img loading="lazy" decoding="async" src="'+esc(poster)+'" alt="Poster for '+esc(show.name)+'">':'<span class="pina-poster-placeholder" aria-hidden="true">✦</span>')+(Number.isFinite(rating)?'<span class="pina-rating">★ '+rating.toFixed(1)+'</span>':'')+'</a><h3><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(show.name)+'</a></h3><p class="pina-poster-meta">'+esc(year(show))+(genres?' · '+esc(genres):'')+'</p></article>';
}
function drawRow(id,items){
 const root=$(id);if(!root)return;
 root.innerHTML=items.length?items.map(card).join(''):'<p class="pina-empty">No titles are available in this section right now.</p>';
}
function feature(show){
 const root=$('home-featured');if(!root||!show)return;
 const image=validUrl(show.image?.original||show.image?.medium),url=validUrl(show.url)||'https://www.tvmaze.com/';
 root.style.backgroundImage=image?'linear-gradient(90deg,#171a25 0%,rgba(23,26,37,.95) 40%,rgba(23,26,37,.32) 100%),url("'+image.replace(/["\\]/g,'')+'")':'';
 root.querySelector('.pina-featured-copy').innerHTML='<span class="pina-label">FEATURED DISCOVERY</span><h2>'+esc(show.name)+'</h2><p>'+esc((show.summary||'Explore this series and discover more titles in the TrendPulse catalogue.').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,190))+'</p><a class="pina-primary" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">View title <span>→</span></a>';
 const art=root.querySelector('.pina-featured-art');if(art)art.style.display=image?'none':'block';
}
async function load(){
 const ids=['home-popular','home-latest','home-anime','home-drama'];
 try{
  let shows=[];
  try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cached&&Date.now()-cached.time<cacheAge&&Array.isArray(cached.shows))shows=cached.shows;}catch(e){}
  if(!shows.length){
   const pages=await Promise.all([0,1].map(async page=>{const response=await fetch('https://api.tvmaze.com/shows?page='+page,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error('Catalogue request failed');return response.json()}));
   shows=pages.flat().filter(s=>s&&s.name&&s.url);
   try{localStorage.setItem(cacheKey,JSON.stringify({time:Date.now(),shows}))}catch(e){}
  }
  const rated=shows.filter(s=>Number.isFinite(Number(s.rating?.average))).sort((a,b)=>Number(b.rating.average)-Number(a.rating.average));
  const latest=shows.filter(s=>s.premiered).sort((a,b)=>String(b.premiered).localeCompare(String(a.premiered)));
  const anime=shows.filter(s=>(s.genres||[]).some(g=>/anime|animation/i.test(g)));
  const drama=shows.filter(s=>(s.genres||[]).some(g=>/drama/i.test(g)));
  feature(rated[0]||latest[0]);
  drawRow(ids[0],rated.slice(0,18));
  drawRow(ids[1],latest.slice(0,18));
  drawRow(ids[2],anime.slice(0,18));
  drawRow(ids[3],drama.slice(0,18));
 }catch(error){ids.forEach(id=>{const root=$(id);if(root)root.innerHTML='<p class="pina-empty">The catalogue is temporarily unavailable. Please refresh later.</p>'});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();