(()=>{'use strict';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const backend=window.TPBackend;
const read=k=>{try{return JSON.parse(localStorage.getItem('tp-'+k)||'[]')}catch(e){return[]}},save=(k,v)=>localStorage.setItem('tp-'+k,JSON.stringify(v)),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6),page=document.body.dataset.feature;
document.body.insertAdjacentHTML('afterbegin','<header><div class="wrap bar"><a class="brand" href="./">✦ Trend<span>Pulse</span></a><nav><a href="./catalog.html">Explore</a><a href="./watchlist.html">Watchlist</a><a href="./reviews.html">Reviews</a><a href="./shorts.html">Shorts</a><a href="./community.html">Community</a><a href="./messages.html">Messages</a><a href="./profile.html">Profile</a><a href="./members.html">Members</a></nav></div></header>');
function watchlist(){
const root=$('#content');
async function draw(){try{
 if(!backend?.ready)throw new Error('Backend is unavailable.');
 const user=await backend.currentUser();
 if(!user){root.innerHTML='<div class="empty">Sign in at <a href="./members.html">Members</a> to see your synced watchlist.</div>';return}
 const items=await backend.getWatchlist();
 root.innerHTML=items.length?'<div class="grid">'+items.map(x=>'<article class="card"><b>'+esc(x.title)+'</b> <span class="tag">'+esc(x.media_type)+'</span><label>Status</label><select data-status="'+x.id+'">'+['Plan to watch','Watching','Completed','On hold','Dropped'].map(s=>'<option '+(x.status===s?'selected':'')+'>'+s+'</option>').join('')+'</select><button class="secondary" data-remove="'+x.id+'">Remove</button></article>').join('')+'</div>':'<div class="empty">Your watchlist is empty. Search titles in <a href="./catalog.html">Explore</a>.</div>';
 root.querySelectorAll('[data-remove]').forEach(b=>b.onclick=async()=>{try{await backend.removeWatchlist(b.dataset.remove);await draw()}catch(e){alert(e.message)}});
 root.querySelectorAll('[data-status]').forEach(s=>s.onchange=async()=>{try{await backend.updateWatchStatus(s.dataset.status,s.value)}catch(e){alert(e.message)}});
}catch(e){root.innerHTML='<div class="empty">'+esc(e.message)+'</div>'}}
draw();
}
function reviews(){
const form=$('#review-form'),root=$('#content');
async function draw(){try{const items=await backend.getReviews();root.innerHTML=items.length?items.map(x=>'<article class="card"><b>'+esc(x.title)+'</b> <span class="stars">'+('★'.repeat(x.rating))+('☆'.repeat(5-x.rating))+'</span><p>'+esc(x.profiles?.display_name||'Member')+': '+esc(x.content)+'</p><small class="muted">'+new Date(x.created_at).toLocaleString()+'</small></article>').join(''):'<div class="empty">No community reviews yet.</div>'}catch(e){root.innerHTML='<div class="empty">'+esc(e.message)+'</div>'}}
form.onsubmit=async e=>{e.preventDefault();try{await backend.createReview({title:$('#title').value.trim(),media_type:$('#type').value,rating:+$('#rating').value,content:$('#review').value.trim()});form.reset();await draw()}catch(err){alert(err.message)}};
draw();
}
function posts(){
const form=$('#post-form'),root=$('#content');
async function draw(){try{const items=await backend.getPosts();root.innerHTML=items.length?items.map(x=>'<article class="card"><b>'+esc(x.profiles?.display_name||'TrendPulse member')+'</b> <span class="tag">'+esc(x.category)+'</span><p>'+esc(x.content)+'</p><small class="muted">'+new Date(x.created_at).toLocaleString()+'</small><p><button class="secondary" data-like="'+x.id+'">♥ Like</button></p></article>').join(''):'<div class="empty">No shared posts yet. Start the first fandom conversation.</div>';root.querySelectorAll('[data-like]').forEach(b=>b.onclick=async()=>{try{const liked=await backend.toggleLike(b.dataset.like);b.textContent=liked?'♥ Liked':'♥ Like'}catch(e){alert(e.message)}})}catch(e){root.innerHTML='<div class="empty">'+esc(e.message)+'</div>'}}
form.onsubmit=async e=>{e.preventDefault();try{await backend.createPost({category:$('#topic').value,content:$('#post').value.trim()});form.reset();await draw()}catch(err){alert(err.message)}};
draw();
}
function shorts(){
const root=$('#content'),form=$('#short-form'),fileInput=$('#short-file'),preview=$('#short-preview'),status=$('#upload-status'),button=$('#upload-button'),dialog=$('#upload-dialog');
$('#open-upload').onclick=()=>{dialog.showModal();};
$('#close-upload').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
fileInput.addEventListener('change',()=>{
 const file=fileInput.files?.[0];
 if(!file){preview.hidden=true;preview.removeAttribute('src');return}
 if(!['video/mp4','video/webm'].includes(file.type)){status.textContent='Please choose an MP4 or WebM video.';fileInput.value='';return}
 if(file.size>50*1024*1024){status.textContent='This video is larger than 50 MB.';fileInput.value='';return}
 preview.src=URL.createObjectURL(file);preview.hidden=false;status.textContent='Preview ready. Add a caption and title, then post.';
});
function card(x){
 const el=document.createElement('article');el.className='short-slide';el.dataset.id=x.id;
 const video=document.createElement('video');video.className='short-video';video.src=x.video_url;video.playsInline=true;video.loop=true;video.muted=true;video.preload='metadata';
 const tap=document.createElement('button');tap.className='video-tap';tap.type='button';tap.setAttribute('aria-label','Play or pause video');tap.onclick=()=>{if(video.paused)video.play().catch(()=>{});else video.pause()};
 const sound=document.createElement('button');sound.className='short-action sound-action';sound.type='button';sound.textContent='🔇';sound.setAttribute('aria-label','Turn sound on');sound.onclick=()=>{video.muted=!video.muted;sound.textContent=video.muted?'🔇':'🔊';sound.setAttribute('aria-label',video.muted?'Turn sound on':'Mute video')};
 const actions=document.createElement('div');actions.className='short-actions';
 const share=document.createElement('button');share.className='short-action';share.type='button';share.innerHTML='↗<small>Share</small>';share.onclick=async()=>{const url=location.origin+location.pathname+'#'+encodeURIComponent(x.id);try{if(navigator.share)await navigator.share({title:x.title,text:x.caption||'Watch this on TrendPulse',url});else{await navigator.clipboard.writeText(url);share.querySelector('small').textContent='Copied'}}catch(e){}};
 const report=document.createElement('button');report.className='short-action';report.type='button';report.innerHTML='⋯<small>Report</small>';report.onclick=async()=>{const reason=prompt('Tell us why you are reporting this Short:');if(!reason)return;try{await backend.reportContent({target_type:'short',target_id:x.id,reason});report.querySelector('small').textContent='Sent'}catch(e){alert(e.message)}};
 actions.append(sound,share,report);
 const meta=document.createElement('div');meta.className='short-overlay';
 const title=document.createElement('h3');title.textContent=x.title||'TrendPulse Short';
 const caption=document.createElement('p');caption.textContent=x.caption||'';
 const creator=document.createElement('p');creator.className='short-creator';creator.textContent='@'+(x.profiles?.username||x.profiles?.display_name||'member');
 const category=document.createElement('span');category.className='short-category';category.textContent=x.category||'Entertainment';
 meta.append(creator,title,caption,category);
 el.append(video,tap,actions,meta);return {el,video};
}
async function draw(){
 try{
  if(!backend?.ready)throw new Error('TrendPulse is connecting to its video service. Please try again shortly.');
  const items=await backend.getShorts();root.replaceChildren();
  if(!items.length){const empty=document.createElement('div');empty.className='shorts-empty';empty.innerHTML='<div><strong>Your Shorts feed starts here.</strong><p>Be the first to share a video with the community.</p><button type="button" class="publish-short" id="empty-create">＋ Create a Short</button></div>';root.append(empty);$('#empty-create').onclick=()=>dialog.showModal();return}
  const entries=items.map(x=>card(x));entries.forEach(x=>root.append(x.el));
  const observer=new IntersectionObserver(changes=>changes.forEach(change=>{const v=change.target.querySelector('video');if(change.isIntersecting&&change.intersectionRatio>.7){v.play().catch(()=>{});}else{v.pause();}}),{root,threshold:[.2,.7]});
  entries.forEach(x=>observer.observe(x.el));
 }catch(e){root.innerHTML='<div class="shorts-empty">'+esc(e.message)+'</div>'}
}
form.onsubmit=async e=>{
 e.preventDefault();const file=fileInput.files?.[0];
 try{
  if(!file)throw new Error('Choose a video first.');
  if(!['video/mp4','video/webm'].includes(file.type))throw new Error('Only MP4 and WebM videos are supported.');
  if(file.size>50*1024*1024)throw new Error('Choose a video smaller than 50 MB.');
  if(!$('#short-title').value.trim())throw new Error('Add a title for your Short.');
  button.disabled=true;status.textContent='Checking your account…';
  const user=await backend.currentUser();if(!user)throw new Error('Please sign in before posting a Short.');
  status.textContent='Uploading video… keep this page open.';
  const videoUrl=await backend.uploadMedia(file);
  status.textContent='Publishing your Short…';
  await backend.createShort({title:$('#short-title').value.trim(),caption:$('#caption').value.trim(),category:$('#short-topic').value,video_url:videoUrl});
  form.reset();preview.pause();preview.removeAttribute('src');preview.load();preview.hidden=true;status.textContent='Your Short is now published.';dialog.close();await draw();root.scrollTo({top:0,behavior:'smooth'});
 }catch(err){status.textContent=err.message||'Upload failed. Please try again.'}
 finally{button.disabled=false}
};
draw();
}
function messages(){
const form=$('#member-search-form'),results=$('#member-results'),chat=$('#chat-area'),messages=$('#chat-messages'),send=$('#message-form');
async function loadMessages(id){const items=await backend.getMessages(id);messages.replaceChildren();items.forEach(x=>{const el=document.createElement('article');el.className='card';const b=document.createElement('b');b.textContent=x.sender_id===window.currentTrendPulseUserId?'You':'Member';const p=document.createElement('p');p.textContent=x.body;el.append(b,p);messages.append(el)})}
form.onsubmit=async e=>{e.preventDefault();try{const users=await backend.searchMembers($('#member-search').value);results.replaceChildren();if(!users.length){results.innerHTML='<div class="empty">No other members found.</div>';return}users.forEach(u=>{const el=document.createElement('article');el.className='card';const title=document.createElement('b');title.textContent=u.display_name;const meta=document.createElement('p');meta.textContent='@'+(u.username||'member');const button=document.createElement('button');button.className='primary';button.textContent='Open conversation';button.onclick=async()=>{try{const conv=await backend.startConversation(u.id);chat.hidden=false;$('#chat-title').textContent='Conversation with '+u.display_name;chat.dataset.conversationId=conv.id;await loadMessages(conv.id)}catch(err){alert(err.message)}};el.append(title,meta,button);results.append(el)})}catch(err){alert(err.message)}};
send.onsubmit=async e=>{e.preventDefault();try{const id=chat.dataset.conversationId;if(!id)throw new Error('Choose a member first.');await backend.sendMessage(id,$('#message-content').value.trim());$('#message-content').value='';await loadMessages(id)}catch(err){alert(err.message)}};
}
function profile(){
const form=$('#profile-form'),status=$('#profile-status');
async function init(){try{const user=await backend.currentUser();if(!user){status.innerHTML='Sign in at <a href="./members.html">Members</a> to manage your account profile.';return}const p=await backend.getProfile(user.id);$('#name').value=p.display_name||'';$('#username').value=p.username||'';$('#bio').value=p.bio||'';const [w,r,pst,sh]=await Promise.all([backend.getWatchlist(),backend.getReviews(),backend.getPosts(),backend.getShorts()]);$('#stats').innerHTML='<div class="grid">'+[['Watchlist',w.length],['Reviews',r.filter(x=>x.author_id===user.id).length],['Posts',pst.filter(x=>x.author_id===user.id).length],['Shorts',sh.filter(x=>x.author_id===user.id).length]].map(x=>'<div class="card"><b>'+x[1]+'</b><p class="muted">'+x[0]+'</p></div>').join('')+'</div>'}catch(e){status.textContent=e.message}}
form.onsubmit=async e=>{e.preventDefault();try{await backend.saveProfile({display_name:$('#name').value,username:$('#username').value,bio:$('#bio').value});status.textContent='Profile saved to your TrendPulse account.'}catch(err){status.textContent=err.message}};
const clear=$('#clear-data');if(clear)clear.hidden=true;init();
}
async function catalog(){let form=$('#search-form'),root=$('#content'),status=$('#status');form.onsubmit=async e=>{e.preventDefault();let q=$('#query').value.trim(),kind=$('#kind').value;if(!q)return;root.innerHTML='';status.textContent='Searching public catalogue…';let data=[];try{if(kind==='Anime'||kind==='Manga'){let type=kind==='Anime'?'anime':'manga';let r=await fetch('https://kitsu.io/api/edge/'+type+'?filter[text]='+encodeURIComponent(q)+'&page[limit]=12');if(!r.ok)throw Error();let j=await r.json();data=(j.data||[]).map(x=>{let a=x.attributes||{};return{title:a.canonicalTitle||a.titles?.en||a.titles?.en_jp||'Untitled',poster:a.posterImage?.small||a.posterImage?.medium,genres:'',year:(a.startDate||'').slice(0,4),summary:a.synopsis||'',url:'https://kitsu.io/'+type+'/'+a.slug,type:kind,score:a.averageRating}})}else if(kind==='TV / Drama'){let r=await fetch('https://api.tvmaze.com/search/shows?q='+encodeURIComponent(q));if(!r.ok)throw Error();let j=await r.json();data=j.slice(0,12).map(v=>({title:v.show.name,poster:v.show.image?.medium,genres:(v.show.genres||[]).join(', '),year:v.show.premiered?.slice(0,4)||'',summary:(v.show.summary||'').replace(/<[^>]*>/g,' '),url:v.show.url,type:'TV / Drama'}))}else{let search=q+' film movie';if(kind==='Hollywood Movies')search=q+' Hollywood film';if(kind==='Bollywood Movies')search=q+' Bollywood Indian film';if(kind==='International Movies')search=q+' international cinema film';let r=await fetch('https://en.wikipedia.org/w/rest.php/v1/search/page?q='+encodeURIComponent(search)+'&limit=12');if(!r.ok)throw Error();let j=await r.json();data=(j.pages||[]).map(x=>({title:x.title,poster:x.thumbnail?.url,genres:x.description||'Wikipedia result',year:'',summary:x.excerpt||'Open the article for more information.',url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(x.key||x.title.replace(/ /g,'_')),type:'Film / Wikipedia'}))}}catch(e){status.textContent='The selected public catalogue is temporarily unavailable. Try again later.';return}if(!data.length){status.textContent='No matching titles found.';return}status.textContent='Found '+data.length+' results. Add a title to your watchlist. Film results are Wikipedia knowledge results, not verified ratings or streaming availability.';root.innerHTML='<div class="grid">'+data.map(x=>'<article class="card">'+(x.poster?'<img class="poster" loading="lazy" src="'+esc(x.poster)+'" alt="Artwork for '+esc(x.title)+'">':'')+'<span class="tag">'+esc(x.type)+'</span><h3>'+esc(x.title)+'</h3><p class="muted small">'+esc([x.year,x.genres,x.score?'Community rating '+x.score:''].filter(Boolean).join(' · '))+'</p><p class="small">'+esc(x.summary).slice(0,240)+'</p><button data-add="'+encodeURIComponent(JSON.stringify(x))+'">＋ Watchlist</button> <a class="btn secondary" href="'+esc(x.url)+'" target="_blank" rel="noopener">Details</a></article>').join('')+'</div>';root.querySelectorAll('[data-add]').forEach(b=>b.onclick=async()=>{try{const x=JSON.parse(decodeURIComponent(b.dataset.add));const user=await backend.currentUser();if(!user){b.textContent='Sign in first';return}await backend.addWatchlist({external_id:x.url,title:x.title,media_type:x.type,poster_url:x.poster||null});b.textContent='Added ✓'}catch(err){b.textContent=err.message||'Could not save'}})}}
const map={watchlist,reviews,community:posts,shorts,messages,profile,catalog};if(map[page])map[page]();
})();