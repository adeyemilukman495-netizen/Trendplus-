(() => {
"use strict";
const form=document.getElementById("jikan-form");
if(!form)return;
const input=document.getElementById("jikan-query");
const results=document.getElementById("jikan-results");
const status=document.getElementById("jikan-status");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function search(q){
 if(!q.trim()){status.textContent="Enter an anime title to search.";results.innerHTML="";return;}
 status.textContent="Searching anime catalogue…";results.innerHTML="";
 try{
  const res=await fetch("https://api.jikan.moe/v4/anime?q="+encodeURIComponent(q.trim())+"&limit=12&sfw=true",{headers:{Accept:"application/json"}});
  if(!res.ok)throw new Error("Request failed ("+res.status+")");
  const json=await res.json(), data=json.data||[];
  if(!data.length){status.textContent="No matching anime found. Try another title.";return;}
  results.innerHTML=data.map(a=>{
   const image=a.images?.jpg?.large_image_url||a.images?.jpg?.image_url||"";
   const genres=(a.genres||[]).map(g=>g.name).join(" · ")||"Genres not listed";
   const year=a.year||a.aired?.prop?.from?.year||"Year not listed";
   const synopsis=(a.synopsis||"Synopsis not available").slice(0,220);
   return '<article class="card tv-card">'+(image?'<img class="tv-poster" loading="lazy" src="'+esc(image)+'" alt="Poster for '+esc(a.title)+'">':'')+
    '<span class="tag">'+esc(a.type||"Anime")+'</span><h3>'+esc(a.title)+'</h3>'+
    '<p class="tv-meta">'+esc(genres)+'<br>'+esc(year)+' · '+esc(a.status||"Status unknown")+' · Score '+esc(a.score??"N/A")+'</p>'+
    '<p class="tv-summary">'+esc(synopsis)+(synopsis.length>=220?"…":"")+'</p>'+
    '<a class="btn ghost small" href="'+esc(a.url)+'" target="_blank" rel="noopener">View details</a></article>';
  }).join("");
  status.textContent="Showing "+data.length+" anime results. Information is supplied by Jikan / MyAnimeList.";
 }catch(e){status.textContent="Anime catalogue is temporarily unavailable. Please try again shortly.";}
}
form.addEventListener("submit",e=>{e.preventDefault();search(input.value);});
})();