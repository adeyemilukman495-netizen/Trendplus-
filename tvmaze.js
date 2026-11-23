(() => {
"use strict";
const form=document.getElementById("tvmaze-form");
if(!form)return;
const input=document.getElementById("tvmaze-query");
const results=document.getElementById("tvmaze-results");
const status=document.getElementById("tvmaze-status");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const strip=s=>String(s||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
function card(item){
 const show=item.show||item, image=show.image?.medium||show.image?.original||"";
 const genres=(show.genres||[]).join(" · ")||"Genre not listed";
 const channel=show.network?.name||show.webChannel?.name||"Channel not listed";
 const year=(show.premiered||"").slice(0,4)||"Release date not listed";
 const summary=strip(show.summary).slice(0,230);
 return '<article class="card tv-card">'+(image?'<img class="tv-poster" loading="lazy" src="'+esc(image)+'" alt="Poster for '+esc(show.name)+'">':'<div class="tv-poster" aria-label="No poster available"></div>')+
 '<span class="tag">'+esc(show.type||"TV show")+'</span><h3>'+esc(show.name)+'</h3>'+
 '<p class="tv-meta">'+esc(genres)+'<br>'+esc(year)+' · '+esc(show.status||"Status unknown")+'<br>'+esc(channel)+'</p>'+
 (summary?'<p class="tv-summary">'+esc(summary)+(summary.length>=230?"…":"")+'</p>':"")+
 '<a class="btn ghost small" href="'+esc(show.url||"https://www.tvmaze.com/")+'" target="_blank" rel="noopener">View on TVmaze</a></article>';
}
async function search(q){
 if(!q.trim()){status.textContent="Enter a title to search.";results.innerHTML="";return;}
 status.textContent="Searching TVmaze…";results.innerHTML="";
 try{
  const response=await fetch("https://api.tvmaze.com/search/shows?q="+encodeURIComponent(q.trim()),{headers:{Accept:"application/json"}});
  if(!response.ok)throw new Error("Request failed ("+response.status+")");
  const data=await response.json();
  if(!data.length){status.textContent="No matching shows found. Try another title.";return;}
  results.innerHTML=data.slice(0,12).map(card).join("");
  status.textContent="Showing "+Math.min(data.length,12)+" results from TVmaze. Results may not cover every title or country.";
 }catch(e){status.textContent="TVmaze is temporarily unavailable. Please try again shortly.";}
}
form.addEventListener("submit",e=>{e.preventDefault();search(input.value);});
input.addEventListener("keydown",e=>{if(e.key==="Escape"){input.value="";results.innerHTML="";status.textContent="Search cleared."; }});
})();