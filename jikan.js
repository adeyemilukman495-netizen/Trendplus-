(() => {
"use strict";
const form=document.getElementById("jikan-form");
const input=document.getElementById("jikan-query");
const results=document.getElementById("jikan-results");
const status=document.getElementById("jikan-status");
if(!form||!input||!results||!status)return;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function render(data,included=[]){
 const genreMap=new Map(included.filter(x=>x.type==="genres").map(x=>[x.id,x.attributes?.name]));
 if(!data.length){status.textContent="No matching anime found. Try another title.";results.innerHTML="";return;}
 results.innerHTML=data.map(a=>{
  const x=a.attributes||{}, title=x.titles?.en||x.canonicalTitle||x.titles?.en_jp||"Untitled anime";
  const image=x.posterImage?.large||x.posterImage?.medium||"";
  const genreIds=a.relationships?.genres?.data||[];
  const genres=genreIds.map(g=>genreMap.get(g.id)).filter(Boolean).join(" · ")||"Genres not listed";
  const year=x.startDate?.slice(0,4)||"Year not listed";
  const synopsis=(x.synopsis||x.description||"Synopsis not available").replace(/<[^>]*>/g,"").slice(0,220);
  const score=x.averageRating?Number(x.averageRating).toFixed(1)+"/100":"Not rated";
  const details="https://kitsu.io/anime/"+encodeURIComponent(x.slug||a.id);
  return '<article class="card tv-card">'+(image?'<img class="tv-poster" loading="lazy" src="'+esc(image)+'" alt="Poster for '+esc(title)+'">':'')+
   '<span class="tag">'+esc(x.showType||x.subtype||"Anime")+'</span><h3>'+esc(title)+'</h3>'+
   '<p class="tv-meta">'+esc(genres)+'<br>'+esc(year)+' · '+esc(x.status||"Status unknown")+' · Score '+esc(score)+'</p>'+
   '<p class="tv-summary">'+esc(synopsis)+(synopsis.length>=220?"…":"")+'</p>'+
   '<a class="btn ghost small" href="'+esc(details)+'" target="_blank" rel="noopener">View details on Kitsu</a></article>';
 }).join("");
 status.textContent="Showing "+data.length+" anime. Catalogue data provided by Kitsu.";
}
async function request(url,loading){
 status.textContent=loading;results.innerHTML="";
 try{
  const res=await fetch(url,{headers:{Accept:"application/vnd.api+json"}});
  if(!res.ok)throw new Error("HTTP "+res.status);
  const json=await res.json();
  render(json.data||[],json.included||[]);
 }catch(err){
  status.textContent="Could not load anime right now. Please check your connection and try again.";
  results.innerHTML="";
 }
}
async function search(q){
 if(!q.trim()){status.textContent="Type an anime title, then press Search Anime.";input.focus();return;}
 const url="https://kitsu.io/api/edge/anime?filter%5Btext%5D="+encodeURIComponent(q.trim())+"&page%5Blimit%5D=12&include=genres";
 await request(url,"Searching Kitsu for "+q.trim()+"…");
}
form.addEventListener("submit",e=>{e.preventDefault();search(input.value);});
status.textContent="Loading popular anime from Kitsu…";
request("https://kitsu.io/api/edge/anime?sort=-userCount&page%5Blimit%5D=12&include=genres","Loading popular anime from Kitsu…");
})();