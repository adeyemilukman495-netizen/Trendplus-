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
const form=$('#post-form'),root=$('#content'),dialog=$('#community-compose');
$('#open-compose').onclick=()=>dialog.showModal();$('#close-compose').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
async function draw(){try{const items=await backend.getPosts();root.innerHTML=items.length?items.map(x=>'<article class="social-post"><div class="social-post-head"><a class="social-avatar" href="./profile.html?user='+encodeURIComponent(x.author_id)+'">'+esc((x.profiles?.display_name||'M').slice(0,1).toUpperCase())+'</a><div class="social-author"><a href="./profile.html?user='+encodeURIComponent(x.author_id)+'">'+esc(x.profiles?.display_name||'TrendPulse member')+'</a><small>@'+esc(x.profiles?.username||'member')+' · '+new Date(x.created_at).toLocaleDateString()+'</small></div><span class="tag">'+esc(x.category)+'</span></div><p class="social-post-text">'+esc(x.content)+'</p><div class="social-post-actions"><button class="secondary" data-like="'+x.id+'">♡ Like</button><button class="secondary" data-comments="'+x.id+'">Comments</button><button class="secondary" data-follow="'+x.author_id+'">＋ Follow</button></div><div class="social-comments" id="comments-'+x.id+'" hidden></div></article>').join(''):'<div class="empty">No posts yet. Start the first conversation in your fandom.</div>';
root.querySelectorAll('[data-like]').forEach(btn=>btn.onclick=async()=>{try{const liked=await backend.toggleLike(btn.dataset.like);btn.textContent=liked?'♥ Liked':'♡ Like';btn.classList.toggle('is-liked',liked)}catch(e){alert(e.message)}});
root.querySelectorAll('[data-follow]').forEach(btn=>btn.onclick=async()=>{try{await backend.followUser(btn.dataset.follow);btn.textContent='✓ Following';btn.disabled=true}catch(e){alert(e.message)}});
root.querySelectorAll('[data-comments]').forEach(btn=>btn.onclick=async()=>{const box=$('#comments-'+btn.dataset.comments);box.hidden=!box.hidden;if(!box.hidden){try{const list=await backend.getComments(btn.dataset.comments);box.innerHTML=list.map(v=>'<p><b>'+esc(v.profiles?.display_name||'Member')+'</b> '+esc(v.content)+'</p>').join('')+'<form class="comment-form"><input maxlength="1000" required placeholder="Add a comment…"><button class="secondary">Send</button></form>';box.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await backend.addComment(btn.dataset.comments,box.querySelector('input').value);btn.click();btn.click()}catch(err){alert(err.message)}}}catch(e){box.textContent=e.message}}});
}catch(e){root.innerHTML='<div class="empty">'+esc(e.message)+'</div>'}}
form.onsubmit=async e=>{e.preventDefault();try{if(!await backend.currentUser())throw Error('Sign in from your Profile before posting.');await backend.createPost({category:$('#topic').value,content:$('#post').value.trim()});form.reset();dialog.close();draw()}catch(err){alert(err.message)}};
draw();
}
function shorts(){
const root=$('#content'),form=$('#short-form'),fileInput=$('#short-file'),preview=$('#short-preview'),status=$('#upload-status'),button=$('#upload-button'),dialog=$('#upload-dialog'),commentPanel=$('#short-comments-panel'),commentList=$('#short-comments-list'),commentForm=$('#short-comment-form');
$('#open-upload').onclick=()=>dialog.showModal();$('#close-upload').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
fileInput.addEventListener('change',()=>{const file=fileInput.files?.[0];if(!file){preview.hidden=true;preview.removeAttribute('src');return}if(!['video/mp4','video/webm'].includes(file.type)||file.size>50*1024*1024){status.textContent='Choose an MP4 or WebM video up to 50 MB.';fileInput.value='';return}preview.src=URL.createObjectURL(file);preview.hidden=false;status.textContent='Preview ready.'});
let activeShort=null,activeSettingsId=null;
async function showComments(short){activeShort=short;commentPanel.hidden=false;$('#short-comments-title').textContent='Comments · '+(short.title||'Short');await loadComments()}
async function loadComments(){if(!activeShort)return;try{const rows=await backend.getShortComments(activeShort.id);commentList.innerHTML=rows.length?rows.map(c=>'<article class="short-comment"><b>'+esc(c.profiles?.display_name||'Member')+'</b><p>'+esc(c.content)+'</p></article>').join(''):'<p class="muted">No comments yet. Start the conversation.</p>'}catch(e){commentList.textContent=e.message}}
commentForm.onsubmit=async e=>{e.preventDefault();try{await backend.addShortComment(activeShort.id,$('#short-comment-text').value);$('#short-comment-text').value='';await loadComments()}catch(err){alert(err.message)}};
$('#close-short-comments').onclick=()=>{commentPanel.hidden=true;activeShort=null};
function card(x){
 const el=document.createElement('article');el.className='short-slide';el.dataset.id=x.id;
 const video=document.createElement('video');video.className='short-video';video.src=x.video_url;video.playsInline=true;video.loop=true;video.muted=true;video.preload='metadata';
 const tap=document.createElement('button');tap.className='video-tap';tap.type='button';tap.setAttribute('aria-label','Play or pause video');tap.onclick=()=>video.paused?video.play().catch(()=>{}):video.pause();
 const creator=document.createElement('div');creator.className='short-creator-actions';const creatorLink=document.createElement('a');creatorLink.href='./profile.html?user='+encodeURIComponent(x.author_id);creatorLink.textContent='@'+(x.profiles?.username||x.profiles?.display_name||'member');creator.append(creatorLink);
 const follow=document.createElement('button');follow.className='short-follow';follow.type='button';follow.textContent='＋ Follow';follow.onclick=async()=>{try{const user=await backend.currentUser();if(!user)throw Error('Sign in from Profile to follow creators.');if(user.id===x.author_id)throw Error("You can't follow your own account.");await backend.followUser(x.author_id);follow.textContent='✓ Following';follow.disabled=true}catch(e){alert(e.message)}};creator.append(follow);
 const actions=document.createElement('div');actions.className='short-actions';
 const like=document.createElement('button');like.className='short-action';like.type='button';const initialLikes=x.like_count||0;like.innerHTML=(x.liked_by_me?'♥':'♡')+'<small>'+initialLikes+' Likes</small>';if(x.liked_by_me)like.classList.add('is-liked');like.onclick=async()=>{try{const liked=await backend.toggleShortLike(x.id);like.classList.toggle('is-liked',liked);const count=Math.max(0,(Number(like.dataset.count)||initialLikes)+(liked?1:-1));like.dataset.count=count;like.innerHTML=(liked?'♥':'♡')+'<small>'+count+' Likes</small>'}catch(e){alert(e.message)}};
 const comments=document.createElement('button');comments.className='short-action';comments.type='button';comments.innerHTML='▤<small>Comment</small>';comments.onclick=()=>{if(x.allow_comments===false){alert('Comments are turned off for this Short.');return}showComments(x)};
 const sound=document.createElement('button');sound.className='short-action';sound.type='button';sound.textContent='🔇';sound.onclick=()=>{video.muted=!video.muted;sound.textContent=video.muted?'🔇':'🔊'};
 const share=document.createElement('button');share.className='short-action';share.type='button';share.innerHTML='↗<small>Share</small>';share.onclick=async()=>{const url=location.origin+location.pathname+'#'+encodeURIComponent(x.id);try{if(navigator.share)await navigator.share({title:x.title,text:x.caption||'Watch on TrendPulse',url});else{await navigator.clipboard.writeText(url);share.querySelector('small').textContent='Copied'}}catch(e){}};
 const download=document.createElement('button');download.className='short-action';download.type='button';download.innerHTML='↓<small>Download</small>';download.hidden=x.allow_download===false;download.onclick=async()=>{try{const res=await fetch(x.video_url);if(!res.ok)throw Error();const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(x.title||'trendpulse-short').replace(/[^a-z0-9-_]/gi,'_')+'.mp4';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}catch(e){alert('This video could not be downloaded from this browser.')}};
 const settings=document.createElement('button');settings.className='short-action';settings.type='button';settings.innerHTML='⚙<small>Settings</small>';settings.onclick=async()=>{try{const user=await backend.currentUser();if(!user||user.id!==x.author_id)throw Error('Only the creator can edit this Short.');activeSettingsId=x.id;$('#short-settings-title').textContent=x.title;$('#short-visibility').value=x.visibility||'public';$('#short-comments-enabled').checked=x.allow_comments!==false;$('#short-download-enabled').checked=x.allow_download!==false;$('#short-settings-dialog').showModal()}catch(e){alert(e.message)}};
 const report=document.createElement('button');report.className='short-action';report.type='button';report.innerHTML='⚑<small>Report</small>';report.onclick=async()=>{const reason=prompt('Why are you reporting this Short?');if(!reason)return;try{await backend.reportContent({target_type:'short',target_id:x.id,reason});report.querySelector('small').textContent='Sent'}catch(e){alert(e.message)}};
 actions.append(like,comments,sound,share,download,settings,report);
 const meta=document.createElement('div');meta.className='short-overlay';const title=document.createElement('h3');title.textContent=x.title||'TrendPulse Short';const caption=document.createElement('p');caption.textContent=x.caption||'';const category=document.createElement('span');category.className='short-category';category.textContent=x.category||'Entertainment';meta.append(title,caption,category);el.append(video,tap,creator,actions,meta);return {el,video};
}
async function draw(){try{if(!backend?.ready)throw Error('Video service is unavailable.');const items=await backend.getShorts();root.replaceChildren();if(!items.length){root.innerHTML='<div class="shorts-empty"><div><strong>Your Shorts feed starts here.</strong><p>Be the first to share a video.</p><button type="button" class="publish-short" id="empty-create">＋ Create a Short</button></div></div>';$('#empty-create').onclick=()=>dialog.showModal();return}const entries=items.map(card);entries.forEach(x=>root.append(x.el));const observer=new IntersectionObserver(changes=>changes.forEach(change=>{const v=change.target.querySelector('video');if(change.isIntersecting&&change.intersectionRatio>.7)v.play().catch(()=>{});else v.pause()}),{root,threshold:[.2,.7]});entries.forEach(x=>observer.observe(x.el))}catch(e){root.innerHTML='<div class="shorts-empty">'+esc(e.message)+'</div>'}}
form.onsubmit=async e=>{e.preventDefault();const file=fileInput.files?.[0];try{if(!file)throw Error('Choose a video first.');if(!['video/mp4','video/webm'].includes(file.type)||file.size>50*1024*1024)throw Error('Choose an MP4 or WebM video up to 50 MB.');if(!$('#short-title').value.trim())throw Error('Add a title.');button.disabled=true;status.textContent='Checking account…';if(!await backend.currentUser())throw Error('Sign in from Profile before uploading.');status.textContent='Uploading video securely…';const videoPath=await backend.uploadShortMedia(file);await backend.createShort({title:$('#short-title').value.trim(),caption:$('#caption').value.trim(),category:$('#short-topic').value,video_path:videoPath,visibility:$('#short-visibility-upload').value,allow_comments:$('#short-allow-comments-upload').checked,allow_download:$('#short-allow-download-upload').checked});form.reset();preview.pause();preview.removeAttribute('src');preview.load();preview.hidden=true;status.textContent='Short published.';dialog.close();await draw()}catch(err){status.textContent=err.message||'Upload failed.'}finally{button.disabled=false}};
$('#short-settings-form').onsubmit=async e=>{e.preventDefault();try{await backend.updateShortSettings(activeSettingsId,$('#short-visibility').value,$('#short-comments-enabled').checked,$('#short-download-enabled').checked);$('#short-settings-dialog').close();await draw()}catch(err){alert(err.message)}};
draw();
}
function messages(){
const form=$('#member-search-form'),results=$('#member-results'),chat=$('#chat-area'),messages=$('#chat-messages'),send=$('#message-form');
async function loadMessages(id){const items=await backend.getMessages(id);messages.replaceChildren();items.forEach(x=>{const el=document.createElement('article');el.className='card';const b=document.createElement('b');b.textContent=x.sender_id===window.currentTrendPulseUserId?'You':'Member';const p=document.createElement('p');p.textContent=x.body;el.append(b,p);messages.append(el)})}
form.onsubmit=async e=>{e.preventDefault();try{const users=await backend.searchMembers($('#member-search').value);results.replaceChildren();if(!users.length){results.innerHTML='<div class="empty">No other members found.</div>';return}users.forEach(u=>{const el=document.createElement('article');el.className='card';const title=document.createElement('b');title.textContent=u.display_name;const meta=document.createElement('p');meta.textContent='@'+(u.username||'member');const button=document.createElement('button');button.className='primary';button.textContent='Open conversation';button.onclick=async()=>{try{const conv=await backend.startConversation(u.id);chat.hidden=false;$('#chat-title').textContent='Conversation with '+u.display_name;chat.dataset.conversationId=conv.id;await loadMessages(conv.id)}catch(err){alert(err.message)}};el.append(title,meta,button);results.append(el)})}catch(err){alert(err.message)}};
send.onsubmit=async e=>{e.preventDefault();try{const id=chat.dataset.conversationId;if(!id)throw new Error('Choose a member first.');await backend.sendMessage(id,$('#message-content').value.trim());$('#message-content').value='';await loadMessages(id)}catch(err){alert(err.message)}};
}
function profile(){
const auth=$('#profile-auth'),form=$('#profile-form'),status=$('#profile-status'),panel=$('#profile-panel'),stats=$('#stats'),signup=$('#signup-form'),signin=$('#signin-form');
const title=$('#auth-title'),subtitle=$('#auth-subtitle'),switchText=$('#auth-switch');
function message(text,kind='info'){
 status.textContent=text;
 status.hidden=!text;
 status.setAttribute('data-state',kind);
}
function setMode(mode){
 const joining=mode==='signup';signup.hidden=!joining;signin.hidden=joining;
 title.textContent=joining?'Create your account':'Welcome back';
 subtitle.textContent=joining?'Join the TrendPulse community.':'Sign in to continue to TrendPulse.';
 switchText.innerHTML=joining?'Already have an account? <button type="button" id="show-signin">Log in</button>':'New to TrendPulse? <button type="button" id="show-signup">Sign up</button>';
 const toggle=$('#show-signup');if(toggle)toggle.onclick=()=>{message('');setMode('signup')};
 const back=$('#show-signin');if(back)back.onclick=()=>{message('');setMode('signin')};
}
async function refresh(){
 if(!backend?.ready){auth.hidden=false;panel.hidden=true;message(backend?.reason||'TrendPulse could not connect to Supabase. Please try again later.','error');return}
 try{
  const user=await backend.currentUser();
  auth.hidden=!!user;panel.hidden=!user;
  if(!user){message('');return}
  const p=await backend.getProfile(user.id);
  $('#name').value=p.display_name||'';
  $('#username').value=p.username||'';
  $('#bio').value=p.bio||'';
  message('Signed in as '+(user.email||'TrendPulse member'),'success');
  try{
   const [w,r,posts,shorts]=await Promise.all([backend.getWatchlist(),backend.getReviews(),backend.getPosts(),backend.getShorts()]);
   stats.innerHTML='<div class="grid">'+[['Watchlist',w.length],['Reviews',r.filter(x=>x.author_id===user.id).length],['Posts',posts.filter(x=>x.author_id===user.id).length],['Shorts',shorts.filter(x=>x.author_id===user.id).length]].map(x=>'<div class="card"><b>'+x[1]+'</b><p class="muted">'+x[0]+'</p></div>').join('')+'</div>';
  }catch(statsError){stats.textContent='Your profile is ready. Activity counts are temporarily unavailable.'}
 }catch(e){message(e.message||'Could not load your profile. Please sign in again.','error')}
}
signup.onsubmit=async e=>{
 e.preventDefault();
 const btn=signup.querySelector('button[type=submit]');btn.disabled=true;
 message('Creating your account…');
 try{
  const email=$('#signup-email').value.trim();
  const {data,error}=await backend.signUp(email,$('#signup-password').value,$('#signup-name').value.trim());
  if(error)throw error;
  signup.reset();
  if(data.session){message('Account created successfully.','success');await refresh()}
  else{setMode('signin');$('#signin-email').value=email;message('Account created. Check your email for the confirmation link, then log in.','success')}
 }catch(err){message(err.message||'Sign-up failed. Please try again.','error')}
 finally{btn.disabled=false}
};
signin.onsubmit=async e=>{
 e.preventDefault();
 const btn=signin.querySelector('button[type=submit]');btn.disabled=true;message('Signing in…');
 try{const {error}=await backend.signIn($('#signin-email').value.trim(),$('#signin-password').value);if(error)throw error;signin.reset();await refresh()}
 catch(err){message(err.message||'Sign-in failed. Please check your details.','error')}
 finally{btn.disabled=false}
};
$('#profile-google').onclick=async()=>{
 const btn=$('#profile-google');btn.disabled=true;message('Connecting to Google…');
 try{const {error}=await backend.signInWithGoogle();if(error)throw error}
 catch(e){message(e.message||'Google sign-in failed.','error');btn.disabled=false}
};
$('#forgot-password').onclick=async()=>{
 const email=$('#signin-email').value.trim();
 if(!email){message('Enter your email address first, then choose Forgot password.','error');$('#signin-email').focus();return}
 try{const {error}=await backend.resetPassword(email);if(error)throw error;message('If an account exists for that email, a password reset link will be sent.','success')}
 catch(e){message(e.message||'Could not send the password reset email.','error')}
};
document.querySelectorAll('[data-toggle-password]').forEach(btn=>btn.onclick=()=>{
 const input=$('#'+btn.dataset.togglePassword);input.type=input.type==='password'?'text':'password';
 btn.setAttribute('aria-label',input.type==='password'?'Show password':'Hide password')
});
$('#profile-signout').onclick=async()=>{
 try{const {error}=await backend.signOut();if(error)throw error;await refresh()}
 catch(e){message(e.message||'Could not sign out.','error')}
};
form.onsubmit=async e=>{
 e.preventDefault();
 const btn=form.querySelector('button[type=submit]');btn.disabled=true;message('Saving your profile…');
 try{
  await backend.saveProfile({display_name:$('#name').value,username:$('#username').value,bio:$('#bio').value});
  message('Your profile has been saved.','success');
 }catch(err){message(err.message||'Your profile could not be saved. Please try again.','error')}
 finally{btn.disabled=false}
};
setMode('signin');refresh();
if(backend?.onAuthChange)backend.onAuthChange(()=>refresh());
}
async function catalog(){let form=$('#search-form'),root=$('#content'),status=$('#status');form.onsubmit=async e=>{e.preventDefault();let q=$('#query').value.trim(),kind=$('#kind').value;if(!q)return;root.innerHTML='';status.textContent='Searching public catalogue…';let data=[];try{if(kind==='Anime'||kind==='Manga'){let type=kind==='Anime'?'anime':'manga';let r=await fetch('https://kitsu.io/api/edge/'+type+'?filter[text]='+encodeURIComponent(q)+'&page[limit]=12');if(!r.ok)throw Error();let j=await r.json();data=(j.data||[]).map(x=>{let a=x.attributes||{};return{title:a.canonicalTitle||a.titles?.en||a.titles?.en_jp||'Untitled',poster:a.posterImage?.small||a.posterImage?.medium,genres:'',year:(a.startDate||'').slice(0,4),summary:a.synopsis||'',url:'https://kitsu.io/'+type+'/'+a.slug,type:kind,score:a.averageRating}})}else if(kind==='TV / Drama'){let r=await fetch('https://api.tvmaze.com/search/shows?q='+encodeURIComponent(q));if(!r.ok)throw Error();let j=await r.json();data=j.slice(0,12).map(v=>({title:v.show.name,poster:v.show.image?.medium,genres:(v.show.genres||[]).join(', '),year:v.show.premiered?.slice(0,4)||'',summary:(v.show.summary||'').replace(/<[^>]*>/g,' '),url:v.show.url,type:'TV / Drama'}))}else{let search=q+' film movie';if(kind==='Hollywood Movies')search=q+' Hollywood film';if(kind==='Bollywood Movies')search=q+' Bollywood Indian film';if(kind==='International Movies')search=q+' international cinema film';let r=await fetch('https://en.wikipedia.org/w/rest.php/v1/search/page?q='+encodeURIComponent(search)+'&limit=12');if(!r.ok)throw Error();let j=await r.json();data=(j.pages||[]).map(x=>({title:x.title,poster:x.thumbnail?.url,genres:x.description||'Wikipedia result',year:'',summary:x.excerpt||'Open the article for more information.',url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(x.key||x.title.replace(/ /g,'_')),type:'Film / Wikipedia'}))}}catch(e){status.textContent='The selected public catalogue is temporarily unavailable. Try again later.';return}if(!data.length){status.textContent='No matching titles found.';return}status.textContent='Found '+data.length+' results. Add a title to your watchlist. Film results are Wikipedia knowledge results, not verified ratings or streaming availability.';root.innerHTML='<div class="grid">'+data.map(x=>'<article class="card">'+(x.poster?'<img class="poster" loading="lazy" src="'+esc(x.poster)+'" alt="Artwork for '+esc(x.title)+'">':'')+'<span class="tag">'+esc(x.type)+'</span><h3>'+esc(x.title)+'</h3><p class="muted small">'+esc([x.year,x.genres,x.score?'Community rating '+x.score:''].filter(Boolean).join(' · '))+'</p><p class="small">'+esc(x.summary).slice(0,240)+'</p><button data-add="'+encodeURIComponent(JSON.stringify(x))+'">＋ Watchlist</button> <a class="btn secondary" href="'+esc(x.url)+'" target="_blank" rel="noopener">Details</a></article>').join('')+'</div>';root.querySelectorAll('[data-add]').forEach(b=>b.onclick=async()=>{try{const x=JSON.parse(decodeURIComponent(b.dataset.add));const user=await backend.currentUser();if(!user){b.textContent='Sign in first';return}await backend.addWatchlist({external_id:x.url,title:x.title,media_type:x.type,poster_url:x.poster||null});b.textContent='Added ✓'}catch(err){b.textContent=err.message||'Could not save'}})}}
const map={watchlist,reviews,community:posts,shorts,messages,profile,catalog};if(map[page])map[page]();
})();