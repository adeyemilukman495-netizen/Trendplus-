(()=>{'use strict';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const backend=window.TPBackend;
const read=k=>{try{return JSON.parse(localStorage.getItem('tp-'+k)||'[]')}catch(e){return[]}},save=(k,v)=>localStorage.setItem('tp-'+k,JSON.stringify(v)),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6),page=document.body.dataset.feature;
document.body.insertAdjacentHTML('afterbegin','<header><div class="wrap bar"><a class="brand" href="./">✦ Trend<span>Pulse</span></a><button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="feature-nav"><span></span><span></span><span></span></button><nav id="feature-nav" class="feature-nav"><a href="./">Home</a><a href="./catalog.html">Explore</a><a href="./trending.html">Trending</a><a href="./rising.html">Rising</a><a href="./watchlist.html">Watchlist</a><a href="./reviews.html">Reviews</a><a href="./shorts.html">Shorts</a><a href="./community.html">Community</a><a href="./messages.html">Messages</a><a href="./profile.html">Profile</a><a href="./members.html">Members</a></nav></div></header>');
const menuButton=document.querySelector('.menu-toggle'),featureNav=document.querySelector('#feature-nav');if(menuButton&&featureNav){menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');featureNav.classList.toggle('is-open',open)});featureNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menuButton.setAttribute('aria-expanded','false');featureNav.classList.remove('is-open')}));}
function watchlist(){
const root=$('#content');let active='All';
async function draw(){try{
 if(!backend?.ready)throw new Error('Backend is unavailable.');
 const user=await backend.currentUser();
 if(!user){root.innerHTML='<div class="empty">Sign in at <a href="./members.html">Members</a> to build and sync your personal entertainment library.</div>';return}
 const [items,savedShorts]=await Promise.all([backend.getWatchlist(),backend.getShortWatchlist()]),tabs=['All','Plan to watch','Watching','Completed','On hold','Dropped'];
 const shown=active==='All'?items:items.filter(x=>(x.status||'Plan to watch')===active);
 root.innerHTML='<div class="library-toolbar"><div class="library-tabs" role="group" aria-label="Filter saved titles">'+tabs.map(s=>'<button type="button" class="library-tab '+(active===s?'active':'')+'" data-filter="'+esc(s)+'">'+esc(s)+'</button>').join('')+'</div><a class="btn secondary" href="./catalog.html">＋ Discover titles</a></div>'+
 (shown.length?'<div class="library-grid">'+shown.map(x=>'<article class="library-card">'+(x.poster_url?'<img class="library-poster" loading="lazy" src="'+esc(x.poster_url)+'" alt="Poster for '+esc(x.title)+'">':'<div class="library-poster poster-placeholder">✦<small>'+esc(x.media_type||'Title')+'</small></div>')+'<div class="library-info"><span class="tag">'+esc(x.media_type||'Title')+'</span><h3>'+esc(x.title)+'</h3><label class="sr-only" for="status-'+x.id+'">Viewing status</label><select id="status-'+x.id+'" data-status="'+x.id+'">'+tabs.slice(1).map(v=>'<option '+((x.status||'Plan to watch')===v?'selected':'')+'>'+v+'</option>').join('')+'</select><button class="library-remove" type="button" data-remove="'+x.id+'">Remove from my list</button></div></article>').join('')+'</div>':'<div class="empty library-empty"><strong>'+(items.length?'Nothing in this section yet.':'Your library is waiting for its first title.')+'</strong><p>Save movies, anime and series from Explore, then move them between your watchlist and watched titles.</p><a class="btn" href="./catalog.html">Explore titles</a></div>');
 root.insertAdjacentHTML('beforeend','<section class="saved-shorts-library"><div class="row"><div><h2>Saved Shorts</h2><p class="muted small">Videos you saved to watch later.</p></div></div>'+(savedShorts.length?'<div class="library-grid">'+savedShorts.map(row=>'<article class="library-card"><div class="library-poster poster-placeholder">▶<small>Short Film</small></div><div class="library-info"><h3>'+esc(row.shorts?.title||'TrendPulse Short')+'</h3><p class="muted small">'+esc(row.shorts?.category||'Entertainment')+'</p><a class="btn secondary" href="./shorts.html#'+encodeURIComponent(row.short_id)+'">Watch Short</a><button class="library-remove" type="button" data-unsave-short="'+esc(row.short_id)+'">Remove from watchlist</button></div></article>').join('')+'</div>':'<div class="empty">No saved Shorts yet. Tap Save on a Short to keep it here.</div>')+'</section>');
 root.querySelectorAll('[data-unsave-short]').forEach(btn=>btn.onclick=async()=>{try{await backend.toggleShortWatchlist(btn.dataset.unsaveShort);await draw()}catch(e){alert(e.message)}});
 root.querySelectorAll('[data-filter]').forEach(btn=>btn.onclick=()=>{active=btn.dataset.filter;draw()});
 root.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=async()=>{try{await backend.removeWatchlist(btn.dataset.remove);await draw()}catch(e){alert(e.message)}});
 root.querySelectorAll('[data-status]').forEach(select=>select.onchange=async()=>{try{await backend.updateWatchStatus(select.dataset.status,select.value);await draw()}catch(e){alert(e.message)}});
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
const root=$('#community-root'),roomList=$('#community-room-list'),chat=$('#community-chat'),welcome=$('#community-welcome');
const signIn=$('#community-signin'),title=$('#community-room-title'),subtitle=$('#community-room-subtitle'),feed=$('#community-chat-messages'),form=$('#community-message-form'),input=$('#community-message-input'),send=$('#community-send'),back=$('#community-back');
let currentUser=null,activeRoom=null,activeChannel=null,typingTimer=null;
const stamp=value=>new Date(value).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
function appendMessage(item){
 if(feed.querySelector('[data-message="'+item.id+'"]'))return;
 const mine=item.sender_id===currentUser?.id,wrap=document.createElement('article');
 wrap.className='wa-message '+(mine?'mine':'theirs');wrap.dataset.message=item.id;
 const name=document.createElement('strong');name.textContent=mine?'You':(item.profiles?.display_name||'TrendPulse member');
 const body=document.createElement('p');body.textContent=item.body;
 const time=document.createElement('time');time.textContent=stamp(item.created_at);
 wrap.append(name,body,time);feed.append(wrap);feed.scrollTop=feed.scrollHeight;
}
function showChat(){root.classList.add('chat-open');welcome.hidden=true;chat.hidden=false}
function closeChat(){root.classList.remove('chat-open');chat.hidden=true;welcome.hidden=false}
async function stopChannel(){if(activeChannel){await backend.leaveGroupRoom(activeChannel);activeChannel=null}}
async function openRoom(room,alreadyMember=false){
 try{
  const roomId=String(room?.id||'');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(roomId)){
   throw new Error('This community has an invalid room ID. Refresh the page and try again.');
  }
  await stopChannel();
  if(!alreadyMember)await backend.joinGroupRoom(roomId);
  activeRoom={...room,id:roomId};showChat();
  title.textContent=room.name;subtitle.textContent=room.description||room.category+' community';
  feed.replaceChildren();$('#community-presence').textContent='Connecting…';$('#community-typing').textContent='';
  const rows=await backend.getGroupMessages(room.id);rows.forEach(appendMessage);
  const result=await backend.subscribeGroupRoom(room.id,{
   onMessage:async msg=>{try{const rows=await backend.getGroupMessages(room.id);const latest=rows.find(x=>x.id===msg.id);if(latest)appendMessage(latest);else appendMessage(msg)}catch(e){}},
   onPresence:count=>$('#community-presence').textContent=count+' online',
   onTyping:payload=>{if(payload.typing){$('#community-typing').textContent='Someone is typing…';clearTimeout(typingTimer);typingTimer=setTimeout(()=>$('#community-typing').textContent='',2200)}}
  });
  activeChannel=result.channel;
  if(result.status!=='SUBSCRIBED')$('#community-presence').textContent='Live connection unavailable';
  input.focus();
 }catch(e){alert(e.message||'Could not open this community.')}
}
async function drawRooms(){
 const [rooms,memberships]=await Promise.all([backend.getGroupRooms(),backend.getGroupRoomMemberships()]);
 roomList.replaceChildren();
 if(!rooms.length){const empty=document.createElement('div');empty.className='wa-empty-communities';empty.innerHTML='<strong>No communities yet</strong><p>Be the first to create one and start a conversation.</p>';roomList.append(empty);return}
 rooms.forEach(room=>{
  const member=memberships.includes(room.id),item=document.createElement('button');
  item.type='button';item.className='wa-room';item.innerHTML='<span class="wa-room-avatar">'+esc((room.name||'T').slice(0,1).toUpperCase())+'</span><span class="wa-room-copy"><b></b><small></small></span><span class="wa-room-count"></span>';
  item.querySelector('b').textContent=room.name;
  item.querySelector('small').textContent=room.description||room.category;
  item.querySelector('.wa-room-count').textContent=member?((room.group_room_members?.[0]?.count||0)+' members'):'Join';
  item.onclick=()=>openRoom(room,member);roomList.append(item);
 });
}
form.onsubmit=async e=>{
 e.preventDefault();if(!activeRoom)return;const body=input.value.trim();if(!body)return;
 send.disabled=true;
 try{await backend.sendGroupMessage(activeRoom.id,body);input.value='';await backend.sendGroupTyping(activeChannel,false)}
 catch(err){alert(err.message||'Message could not be sent.')}
 finally{send.disabled=false;input.focus()}
};
input.addEventListener('input',()=>{if(activeChannel)backend.sendGroupTyping(activeChannel,true).catch(()=>{});});
back.onclick=closeChat;
(async()=>{
 try{
  if(!backend?.ready)throw new Error('Messaging is temporarily unavailable.');
  currentUser=await backend.currentUser();
  if(!currentUser){signIn.hidden=false;roomList.innerHTML='<p class="wa-muted">Sign in to join conversations.</p>';return}
  signIn.hidden=true;await drawRooms();
  const createDialog=$('#community-create-dialog'),createForm=$('#community-create-form'),createOpen=$('#community-create-open');
  createOpen.onclick=()=>createDialog.showModal();
  $('#community-create-close').onclick=()=>createDialog.close();
  createDialog.addEventListener('click',event=>{if(event.target===createDialog)createDialog.close()});
  createForm.onsubmit=async event=>{
   event.preventDefault();
   const submit=$('#community-create-submit'),error=$('#community-create-error');
   error.textContent='';submit.disabled=true;submit.textContent='Creating…';
   try{
    const room=await backend.createGroupRoom({name:$('#community-create-name').value,category:$('#community-create-category').value,description:$('#community-create-description').value});
    createForm.reset();createDialog.close();await drawRooms();await openRoom(room,true);
   }catch(err){error.textContent=err.message||'Could not create this community.'}
   finally{submit.disabled=false;submit.textContent='Create community'}
  };
 }catch(e){roomList.innerHTML='<p class="wa-muted">'+esc(e.message)+'</p>'}
})();
window.addEventListener('pagehide',()=>{if(activeChannel)backend.leaveGroupRoom(activeChannel)});
}
function shorts(){
const root=$('#content'),form=$('#short-form'),fileInput=$('#short-file'),preview=$('#short-preview'),status=$('#upload-status'),button=$('#upload-button'),dialog=$('#upload-dialog'),commentPanel=$('#short-comments-panel'),commentList=$('#short-comments-list'),commentForm=$('#short-comment-form'),creatorPanel=$('#short-creator-panel');
$('#open-upload').onclick=()=>dialog.showModal();$('#close-upload').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
let previewObjectUrl=null,selectedDuration=null;
const nextButton=$('#short-next'),stepOne=$('#short-step-one'),stepTwo=$('#short-step-two'),durationNote=$('#short-duration'),detailPreview=$('#short-preview-details');
function resetShortUpload(){
 selectedDuration=null;nextButton.disabled=true;stepOne.hidden=false;stepTwo.hidden=true;durationNote.textContent='Your film must be 10 minutes or less.';
 if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=null}
 preview.pause();preview.removeAttribute('src');preview.load();preview.hidden=true;
 detailPreview.pause();detailPreview.removeAttribute('src');detailPreview.load();detailPreview.hidden=true;
}
fileInput.addEventListener('change',()=>{
 const file=fileInput.files?.[0];selectedDuration=null;nextButton.disabled=true;
 if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=null}
 if(!file){preview.hidden=true;preview.removeAttribute('src');durationNote.textContent='Your film must be 10 minutes or less.';return}
 const ext=String(file.name||'').split('.').pop().toLowerCase();
 const allowed=['mp4','webm'].includes(ext)||['video/mp4','video/webm'].includes(file.type);
 if(!allowed||file.size>50*1024*1024||!file.size){
  status.textContent=!allowed?'Choose an MP4 or WebM short film.':file.size>50*1024*1024?'This film is over the 50 MB upload limit.':'The selected film could not be read.';
  durationNote.textContent=status.textContent;fileInput.value='';preview.hidden=true;preview.removeAttribute('src');return
 }
 previewObjectUrl=URL.createObjectURL(file);preview.src=previewObjectUrl;preview.hidden=false;
 preview.onloadedmetadata=()=>{
  const seconds=preview.duration;
  if(!Number.isFinite(seconds)||seconds<=0){durationNote.textContent='We could not read this film’s duration. Please choose another file.';return}
  if(seconds>600){durationNote.textContent='This film is '+Math.ceil(seconds/60)+' minutes long. Choose a film that is 10 minutes or shorter.';status.textContent=durationNote.textContent;return}
  selectedDuration=seconds;durationNote.textContent='Film length: '+Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0')+' · Ready for the next step.';status.textContent='Preview ready.';nextButton.disabled=false
 };
 preview.onerror=()=>{durationNote.textContent='This video could not be previewed. Choose another MP4 or WebM file.';nextButton.disabled=true};
});
nextButton.addEventListener('click',()=>{
 if(!fileInput.files?.[0]||!selectedDuration||selectedDuration>600)return;
 stepOne.hidden=true;stepTwo.hidden=false;detailPreview.src=preview.src;detailPreview.hidden=false;
 status.textContent='Add the details for your short film.';
});
$('#short-back').addEventListener('click',()=>{stepTwo.hidden=true;stepOne.hidden=false;status.textContent='Check your film preview before continuing.'});
let activeShort=null,activeSettingsId=null,activeCreator=null;
async function showComments(short){activeShort=short;commentPanel.hidden=false;$('#short-comments-title').textContent='Comments · '+(short.title||'Short');await loadComments()}
async function showCreator(short){activeCreator=short;const p=short.profiles||{};creatorPanel.hidden=false;$('#short-creator-name').textContent=p.display_name||'TrendPulse creator';$('#short-creator-handle').textContent='@'+(p.username||'member');$('#short-creator-avatar').textContent=(p.display_name||'T').trim().charAt(0).toUpperCase();$('#short-creator-bio').textContent=p.bio||'Creator on TrendPulse';$('#short-creator-profile-link').href='./members.html?search='+encodeURIComponent(p.username||p.display_name||'');$('#short-creator-follow').textContent='＋ Follow';$('#short-creator-follow').disabled=false;try{const stats=await backend.getSocialProfileStats(short.author_id);$('#short-creator-followers').textContent=stats.followers;$('#short-creator-following').textContent=stats.following;$('#short-creator-videos').textContent=stats.shorts??'—'}catch(e){console.warn('Creator stats unavailable',e)}try{const me=await backend.currentUser();if(me?.id===short.author_id){$('#short-creator-follow').textContent='Your profile';$('#short-creator-follow').disabled=true}else if(me){const following=await backend.isFollowing(short.author_id);$('#short-creator-follow').textContent=following?'✓ Following':'＋ Follow'}}catch(e){}}
$('#close-short-creator').onclick=()=>{creatorPanel.hidden=true;activeCreator=null};
$('#short-creator-follow').onclick=async()=>{try{if(!activeCreator)return;const me=await backend.currentUser();if(!me)throw Error('Sign in to follow creators.');if(me.id===activeCreator.author_id)return;const following=await backend.isFollowing(activeCreator.author_id);if(following){await backend.unfollowUser(activeCreator.author_id);$('#short-creator-follow').textContent='＋ Follow'}else{await backend.followUser(activeCreator.author_id);$('#short-creator-follow').textContent='✓ Following'}}catch(e){alert(e.message)}};
let creatorSearchTimer;$('#short-creator-search-input').addEventListener('input',()=>{clearTimeout(creatorSearchTimer);creatorSearchTimer=setTimeout(async()=>{const q=$('#short-creator-search-input').value.trim(),out=$('#short-creator-search-results');if(q.length<2){out.replaceChildren();return}try{const rows=await backend.searchProfiles(q);out.innerHTML=rows.length?rows.map(p=>'<button type="button" class="creator-search-result" data-creator-id="'+esc(p.id)+'"><b>'+esc(p.display_name||'TrendPulse member')+'</b><small>@'+esc(p.username||'member')+'</small></button>').join(''):'<p class="muted small">No creators found.</p>';out.querySelectorAll('[data-creator-id]').forEach(btn=>btn.onclick=async()=>{const p=rows.find(x=>x.id===btn.dataset.creatorId);if(!p)return;activeCreator={author_id:p.id,profiles:p};await showCreator(activeCreator)})}catch(e){out.textContent=e.message}},250)});
async function loadComments(){if(!activeShort)return;try{const rows=await backend.getShortComments(activeShort.id);commentList.innerHTML=rows.length?rows.map(c=>'<article class="short-comment"><b>'+esc(c.profiles?.display_name||'Member')+'</b><p>'+esc(c.content)+'</p></article>').join(''):'<p class="muted">No comments yet. Start the conversation.</p>'}catch(e){commentList.textContent=e.message}}
commentForm.onsubmit=async e=>{e.preventDefault();try{await backend.addShortComment(activeShort.id,$('#short-comment-text').value);$('#short-comment-text').value='';await loadComments()}catch(err){alert(err.message)}};
$('#close-short-comments').onclick=()=>{commentPanel.hidden=true;activeShort=null};
function card(x,currentUserId){
 const el=document.createElement('article');el.className='short-slide';el.dataset.id=x.id;
 const video=document.createElement('video');video.className='short-video';video.src=x.video_url;video.playsInline=true;video.loop=true;video.muted=true;video.preload='metadata';
 const tap=document.createElement('button');tap.className='video-tap';tap.type='button';tap.setAttribute('aria-label','Play or pause video');tap.onclick=()=>video.paused?video.play().catch(()=>{}):video.pause();
 const creator=document.createElement('div');creator.className='short-creator-actions';const creatorLink=document.createElement('a');creatorLink.href='./profile.html?user='+encodeURIComponent(x.author_id);creatorLink.textContent='@'+(x.profiles?.username||x.profiles?.display_name||'member');creator.append(creatorLink);
 const follow=document.createElement('button');follow.className='short-follow';follow.type='button';follow.textContent='＋ Follow';follow.onclick=async()=>{try{const user=await backend.currentUser();if(!user)throw Error('Sign in from Profile to follow creators.');if(user.id===x.author_id)throw Error("You can't follow your own account.");const following=await backend.isFollowing(x.author_id);if(following){await backend.unfollowUser(x.author_id);follow.textContent='＋ Follow'}else{await backend.followUser(x.author_id);follow.textContent='✓ Following'}}catch(e){alert(e.message)}};creator.append(follow);creatorLink.addEventListener('click',e=>{e.preventDefault();showCreator(x)});
 const actions=document.createElement('div');actions.className='short-actions';
 const like=document.createElement('button');like.className='short-action';like.type='button';const initialLikes=x.like_count||0;like.dataset.count=String(initialLikes);like.innerHTML=(x.liked_by_me?'♥':'♡')+'<small>'+initialLikes+' Likes</small>';if(x.liked_by_me)like.classList.add('is-liked');like.setAttribute('aria-label',(x.liked_by_me?'Unlike':'Like')+' this Short');like.onclick=async()=>{if(like.disabled)return;like.disabled=true;try{const liked=await backend.toggleShortLike(x.id);const count=Math.max(0,Number(like.dataset.count||0)+(liked?1:-1));like.dataset.count=String(count);like.classList.toggle('is-liked',liked);like.innerHTML=(liked?'♥':'♡')+'<small>'+count+' Likes</small>';like.setAttribute('aria-label',(liked?'Unlike':'Like')+' this Short')}catch(e){alert(e.message)}finally{like.disabled=false}};
 const saveShort=document.createElement('button');saveShort.className='short-action short-save-action';saveShort.type='button';saveShort.innerHTML=(x.saved_by_me?'✓':'▣')+'<small>'+(x.saved_by_me?'Saved':'Save')+'</small>';saveShort.classList.toggle('is-saved',!!x.saved_by_me);saveShort.setAttribute('aria-label','Save Short to watchlist');saveShort.onclick=async()=>{saveShort.disabled=true;try{const saved=await backend.toggleShortWatchlist(x.id);saveShort.innerHTML=(saved?'✓':'▣')+'<small>'+(saved?'Saved':'Save')+'</small>';saveShort.classList.toggle('is-saved',saved)}catch(e){alert(e.message)}finally{saveShort.disabled=false}};
 const comments=document.createElement('button');comments.className='short-action';comments.type='button';comments.innerHTML='▤<small>Comment</small>';comments.onclick=()=>{if(x.allow_comments===false){alert('Comments are turned off for this Short.');return}showComments(x)};
 const sound=document.createElement('button');sound.className='short-action';sound.type='button';sound.textContent='🔇';sound.onclick=()=>{video.muted=!video.muted;sound.textContent=video.muted?'🔇':'🔊'};
 const share=document.createElement('button');share.className='short-action';share.type='button';share.innerHTML='↗<small>Share</small>';share.onclick=async()=>{const url=location.origin+location.pathname+'#'+encodeURIComponent(x.id);try{if(navigator.share)await navigator.share({title:x.title,text:x.caption||'Watch on TrendPulse',url});else{await navigator.clipboard.writeText(url);share.querySelector('small').textContent='Copied'}}catch(e){}};
 const download=document.createElement('button');download.className='short-action';download.type='button';download.innerHTML='↓<small>Download</small>';download.hidden=x.allow_download===false;download.onclick=async()=>{try{const res=await fetch(x.video_url);if(!res.ok)throw Error();const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(x.title||'trendpulse-short').replace(/[^a-z0-9-_]/gi,'_')+'.mp4';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}catch(e){alert('This video could not be downloaded from this browser.')}};
 const settings=document.createElement('button');settings.className='short-action';settings.type='button';settings.innerHTML='⚙<small>Settings</small>';settings.onclick=async()=>{try{const user=await backend.currentUser();if(!user||user.id!==x.author_id)throw Error('Only the creator can edit this Short.');activeSettingsId=x.id;$('#short-settings-title').textContent=x.title;$('#short-visibility').value=x.visibility||'public';$('#short-comments-enabled').checked=x.allow_comments!==false;$('#short-download-enabled').checked=x.allow_download!==false;$('#short-settings-dialog').showModal()}catch(e){alert(e.message)}};

 const report=document.createElement('button');report.className='short-action';report.type='button';report.innerHTML='⚑<small>Report</small>';report.onclick=async()=>{const reason=prompt('Why are you reporting this Short?');if(!reason)return;try{await backend.reportContent({target_type:'short',target_id:x.id,reason});report.querySelector('small').textContent='Sent'}catch(e){alert(e.message)}};
 actions.append(like,comments,saveShort,sound,share,download,settings,report);
 const meta=document.createElement('div');meta.className='short-overlay';const title=document.createElement('h3');title.textContent=x.title||'TrendPulse Short';const caption=document.createElement('p');caption.textContent=x.caption||'';const category=document.createElement('span');category.className='short-category';category.textContent=x.category||'Entertainment';meta.append(title,caption,category);el.append(video,tap,creator,actions,meta);let touchX=0,touchY=0;el.addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchX=t.clientX;touchY=t.clientY},{passive:true});el.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-touchX,dy=t.clientY-touchY;if(dx<-70&&Math.abs(dx)>Math.abs(dy)*1.25)showCreator(x);else if(dx>70&&Math.abs(dx)>Math.abs(dy)*1.25&&creatorPanel)creatorPanel.hidden=true},{passive:true});return {el,video};
}
let activeFeed='foryou',feedItems=[],feedUser=null;
const feedTabs=[...document.querySelectorAll('[data-short-feed]')];
function setFeedTab(name){activeFeed=name;feedTabs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shortFeed===name)));const hint=$('#shorts-feed-hint');if(hint)hint.textContent=name==='following'?'Only Shorts from creators you follow.':name==='latest'?'The newest public Shorts, in order.':'A discovery mix shaped by the topics you watch and what the community enjoys.';draw()}
feedTabs.forEach(b=>b.addEventListener('click',()=>setFeedTab(b.dataset.shortFeed)));
function rankFeed(items){
 const rows=[...items];
 if(activeFeed==='latest')return rows.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
 if(activeFeed==='following')return rows;
 let interests={};try{interests=JSON.parse(localStorage.getItem('tp-short-interests')||'{}')}catch(e){}
 const now=Date.now();
 return rows.sort((a,b)=>{
  const score=x=>{const age=Math.max(0,(now-new Date(x.created_at||now).getTime())/3600000);const freshness=Math.max(0,48-age)/48;const category=String(x.category||'').toLowerCase();const affinity=Number(interests[category]||0);const engagement=Math.log1p(Number(x.like_count||0));return affinity*2.5+engagement*.7+freshness*.8};
  return score(b)-score(a)
 });
}
function recordShortInterest(short){try{const key='tp-short-interests',data=JSON.parse(localStorage.getItem(key)||'{}'),category=String(short.category||'entertainment').toLowerCase();data[category]=Math.min(20,Number(data[category]||0)+1);localStorage.setItem(key,JSON.stringify(data))}catch(e){}}
async function draw(){
 root.innerHTML='<div class="shorts-empty"><div><strong>Loading Shorts…</strong><p>Getting the latest videos.</p></div></div>';
 try{
  if(!backend?.ready)throw Error(backend?.reason||'Video service is unavailable. Check your connection and try again.');
  const [items,currentUser]=await Promise.all([backend.getShorts(),backend.currentUser()]);feedItems=items;feedUser=currentUser;root.replaceChildren();
  let visible=items;
  if(activeFeed==='following'){
   if(!currentUser){root.innerHTML='<div class="shorts-empty"><div><strong>Sign in to see your Following feed.</strong><p>Follow creators to build a feed of their latest Shorts.</p><a class="publish-short" href="./members.html">Sign in / Join</a></div></div>';return}
   const {data:follows,error}=await backend.client.from('follows').select('followed_id').eq('follower_id',currentUser.id);
   if(error)throw error;
   const followed=new Set((follows||[]).map(x=>x.followed_id));
   visible=items.filter(x=>followed.has(x.author_id));
  }
  visible=rankFeed(visible);
  if(!visible.length){
   const message=activeFeed==='following'?'No Shorts from followed creators yet. Follow creators from Shorts or Discover and their videos will appear here.':'No playable Shorts yet. Videos will appear here when they are available.';
   root.innerHTML='<div class="shorts-empty"><div><strong>'+esc(message)+'</strong><p>Be among the first to discover something new.</p><button type="button" class="publish-short" id="empty-create">＋ Create a Short</button><button type="button" class="shorts-retry" id="shorts-retry">Refresh feed</button></div></div>';
   $('#empty-create').onclick=()=>dialog.showModal();$('#shorts-retry').onclick=draw;return
  }
  const entries=visible.map(x=>card(x,currentUser?.id));entries.forEach(x=>root.append(x.el));
  const markViewed=entry=>{if(entry.video.dataset.interestRecorded)return;entry.video.dataset.interestRecorded='1';recordShortInterest(visible.find(x=>x.id===entry.el.dataset.id)||{})};
  if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(changes=>changes.forEach(change=>{const entry=entries.find(x=>x.el===change.target),v=change.target.querySelector('video');if(change.isIntersecting&&change.intersectionRatio>.7){v.play().catch(()=>{});if(entry)markViewed(entry)}else v.pause()}),{root,threshold:[.2,.7]});
   entries.forEach(x=>observer.observe(x.el));
  }else entries.forEach(x=>{x.video.play().catch(()=>{});markViewed(x)});
 }catch(e){
  root.innerHTML='<div class="shorts-empty"><div><strong>Shorts could not load.</strong><p>'+esc(e.message||'Please try again.')+'</p><button type="button" class="shorts-retry" id="shorts-retry">Try again</button></div></div>';
  $('#shorts-retry').onclick=draw;
 }
}
form.onsubmit=async e=>{
 e.preventDefault();const file=fileInput.files?.[0];
 try{
  if(!file)throw Error('Choose your short film from Gallery or Files first.');
  if(!selectedDuration||selectedDuration>600)throw Error('Choose a film that is 10 minutes or shorter and wait for its preview to load.');
  if(stepTwo.hidden)throw Error('Tap Next and complete your film details first.');
  const ext=String(file.name||'').split('.').pop().toLowerCase();
  if(!(['mp4','webm'].includes(ext)||['video/mp4','video/webm'].includes(file.type)))throw Error('Choose an MP4 or WebM short film.');
  if(file.size>50*1024*1024)throw Error('This film is over the 50 MB upload limit.');
  if(!$('#short-title').value.trim())throw Error('Add a title for your short film.');
  button.disabled=true;status.textContent='Checking your account…';
  if(!await backend.currentUser())throw Error('Sign in from Profile before uploading.');
  status.textContent='Uploading your film… Keep TrendPulse open until it finishes.';
  const videoPath=await backend.uploadShortMedia(file);
  status.textContent='Publishing your short film…';
  await backend.createShort({title:$('#short-title').value.trim(),caption:$('#caption').value.trim(),category:$('#short-topic').value,video_path:videoPath,visibility:$('#short-visibility-upload').value,allow_comments:$('#short-allow-comments-upload').checked,allow_download:$('#short-allow-download-upload').checked});
  form.reset();resetShortUpload();status.textContent='Your short film has been published.';dialog.close();await draw()
 }catch(err){status.textContent=err.message||'Upload failed. Your film was not published.'}
 finally{button.disabled=false}
};
$('#short-settings-form').onsubmit=async e=>{e.preventDefault();try{await backend.updateShortSettings(activeSettingsId,$('#short-visibility').value,$('#short-comments-enabled').checked,$('#short-download-enabled').checked);$('#short-settings-dialog').close();await draw()}catch(err){alert(err.message)}};
draw();
}
function messages(){
const form=$('#member-search-form'),results=$('#member-results'),chat=$('#chat-area'),feed=$('#chat-messages'),send=$('#message-form');let activeChannel=null;
async function loadMessages(id){
 const items=await backend.getMessages(id);feed.replaceChildren();
 items.forEach(x=>{const el=document.createElement('article');el.className='card';const b=document.createElement('b');b.textContent=x.sender_id===window.currentTrendPulseUserId?'You':'Member';const p=document.createElement('p');p.textContent=x.body;el.append(b,p);feed.append(el)});
 feed.scrollTop=feed.scrollHeight;
}
async function openConversation(id,title){
 const current=await backend.currentUser();if(current)window.currentTrendPulseUserId=current.id;
 chat.hidden=false;$('#chat-title').textContent=title||'Conversation';chat.dataset.conversationId=id;
 if(activeChannel)await backend.removeChannel(activeChannel);
 await loadMessages(id);
 activeChannel=backend.subscribeToConversation(id,async()=>{try{await loadMessages(id)}catch(e){console.warn('Could not refresh messages',e)}});
}
form.onsubmit=async e=>{e.preventDefault();try{const users=await backend.searchMembers($('#member-search').value);results.replaceChildren();if(!users.length){results.innerHTML='<div class="empty">No other members found.</div>';return}users.forEach(u=>{const el=document.createElement('article');el.className='card';const title=document.createElement('b');title.textContent=u.display_name;const meta=document.createElement('p');meta.textContent='@'+(u.username||'member');const button=document.createElement('button');button.className='primary';button.textContent='Open conversation';button.onclick=async()=>{try{const conv=await backend.startConversation(u.id);await openConversation(conv.id,'Conversation with '+u.display_name)}catch(err){alert(err.message)}};el.append(title,meta,button);results.append(el)})}catch(err){alert(err.message)}};
send.onsubmit=async e=>{e.preventDefault();const button=send.querySelector('button[type="submit"]');try{const id=chat.dataset.conversationId;if(!id)throw new Error('Choose a member first.');button.disabled=true;await backend.sendMessage(id,$('#message-content').value.trim());$('#message-content').value='';await loadMessages(id)}catch(err){alert(err.message)}finally{button.disabled=false}};
const conversationId=new URLSearchParams(location.search).get('conversation');
if(conversationId){backend.currentUser().then(user=>{if(!user)throw new Error('Sign in to view this conversation.');window.currentTrendPulseUserId=user.id;return openConversation(conversationId,'Service conversation')}).catch(err=>{chat.hidden=false;feed.textContent=err.message||'Could not open this conversation.'})}
}
function profile(){
const auth=$('#profile-auth'),form=$('#profile-form'),status=$('#profile-status'),panel=$('#profile-panel'),stats=$('#stats'),signup=$('#signup-form'),signin=$('#signin-form'),ownerAdminLink=$('#owner-admin-link');
const title=$('#auth-title'),subtitle=$('#auth-subtitle'),switchText=$('#auth-switch');
let authMode='signin';
function message(text,kind='info'){
 status.textContent=text;
 status.hidden=!text;
 status.setAttribute('data-state',kind);
}
function setMode(mode){
 authMode=mode;
 const joining=mode==='signup';signup.hidden=!joining;signin.hidden=joining;
 title.textContent=joining?'Create your account':'Welcome back';
 subtitle.textContent=joining?'Join the TrendPulse community.':'Sign in to continue to TrendPulse.';
 switchText.innerHTML=joining?'Already have an account? <button type="button" id="show-signin">Log in</button>':'New to TrendPulse? <button type="button" id="show-signup">Sign up</button>';
 const toggle=$('#show-signup');if(toggle)toggle.onclick=async()=>{
  message('');
  try{
   const user=await backend.currentUser();
   if(user){const {error}=await backend.signOut();if(error)throw error}
   auth.hidden=false;panel.hidden=true;setMode('signup');
  }catch(e){message(e.message||'Could not switch to sign-up. Please try again.','error')}
 };
 const back=$('#show-signin');if(back)back.onclick=()=>{message('');setMode('signin')};
}
async function refresh(){
 if(!backend?.ready){auth.hidden=false;panel.hidden=true;message(backend?.reason||'TrendPulse could not connect to Supabase. Please try again later.','error');return}
 try{
  const user=await backend.currentUser();
  // A late auth refresh must not replace the sign-up form after the user has
  // explicitly chosen Sign up. The toggle signs out any existing session.
  if(authMode==='signup'){auth.hidden=false;panel.hidden=true;return}
  auth.hidden=!!user;panel.hidden=!user;
  if(!user){if(ownerAdminLink)ownerAdminLink.hidden=true;message('');return}
  const p=await backend.getProfile(user.id);
  $('#name').value=p.display_name||'';
  $('#username').value=p.username||'';
  $('#bio').value=p.bio||'';
  const displayName=p.display_name||'TrendPulse member',handle=p.username||'member';
  $('#profile-display-name').textContent=displayName;
  $('#profile-handle').textContent='@'+handle;
  $('#profile-avatar').textContent=(displayName.trim().charAt(0)||'T').toUpperCase();
  $('#profile-bio-text').textContent=p.bio||'Add a bio to introduce yourself.';
  try{
   const social=await backend.getSocialProfileStats(user.id);
   $('#profile-follower-count').textContent=social.followers;
   $('#profile-following-count').textContent=social.following;
   $('#profile-likes-count').textContent=social.likes;
  }catch(socialError){console.warn('Social profile counts unavailable:',socialError.message)}
  message('Signed in as '+(user.email||'TrendPulse member'),'success');
  // Reveal the admin entry only when Supabase confirms this signed-in account is on the owner allowlist. Fail closed on any error.
  if(ownerAdminLink){ownerAdminLink.hidden=true;try{const {data:ownerAllowed,error:ownerError}=await backend.client.rpc('is_trendpulse_admin');if(!ownerError&&ownerAllowed===true)ownerAdminLink.hidden=false}catch(ownerCheckError){ownerAdminLink.hidden=true}}
  try{
   const [w,r,posts,shorts]=await Promise.all([backend.getWatchlist(),backend.getReviews(),backend.getPosts(),backend.getShorts()]);
   const myShorts=shorts.filter(x=>x.author_id===user.id);
   const myReviews=r.filter(x=>x.author_id===user.id),myPosts=posts.filter(x=>x.author_id===user.id);
   stats.innerHTML='<div class="grid">'+[['Watchlist',w.length],['Reviews',myReviews.length],['Posts',myPosts.length],['Shorts',myShorts.length]].map(x=>'<div class="card"><b>'+x[1]+'</b><p class="muted">'+x[0]+'</p></div>').join('')+'</div>';
   const activityItems=[...myReviews.map(x=>({kind:'Review',title:x.title||'A title',date:x.created_at,detail:x.content||''})),...myPosts.map(x=>({kind:'Community post',title:'You shared a post',date:x.created_at,detail:x.content||x.body||''})),...myShorts.map(x=>({kind:'Short video',title:x.title||'Short film',date:x.created_at,detail:'You published a Short.'})),...w.map(x=>({kind:'Watchlist',title:x.title||'Saved title',date:x.created_at,detail:'Added to your library.'}))].filter(x=>x.date).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,12);
   const activityFeed=$('#activity-feed');
   if(activityFeed)activityFeed.innerHTML=activityItems.length?activityItems.map(x=>'<article class="activity-item"><span class="activity-dot"></span><div><b>'+esc(x.kind)+'</b><h3>'+esc(x.title)+'</h3><p>'+esc(x.detail).slice(0,180)+'</p><time>'+new Date(x.date).toLocaleString()+'</time></div></article>').join(''):'<div class="empty">Your activity will appear here as you post, review, publish Shorts and save titles.</div>';
   const videoGrid=$('#profile-videos');
   if(videoGrid)videoGrid.innerHTML=myShorts.length?'<div class="tiktok-video-grid">'+myShorts.map(x=>'<a class="tiktok-video-tile" href="./shorts.html#'+encodeURIComponent(x.id)+'"><span class="tiktok-video-play">▶</span><b>'+esc(x.title||'Short film')+'</b></a>').join('')+'</div>':'<div class="tiktok-profile-empty"><b>Your videos will appear here</b><p>Share a Short Film and it will be part of your creator profile.</p><a href="./shorts.html">Go to Shorts</a></div>';
   const uploadList=$('#profile-upload-list');
   if(uploadList){
    uploadList.replaceChildren();
    if(!myShorts.length){const empty=document.createElement('p');empty.className='muted small';empty.textContent='You have not uploaded any Shorts yet.';uploadList.append(empty)}
    myShorts.forEach(short=>{
     const row=document.createElement('div');row.className='profile-upload-row';
     const details=document.createElement('div');details.className='profile-upload-details';
     const name=document.createElement('b');name.textContent=short.title||'Untitled Short';
     const visibility=document.createElement('small');visibility.textContent=(short.visibility||'public')==='public'?'Public':short.visibility==='followers'?'Followers only':'Private';
     details.append(name,visibility);
     const remove=document.createElement('button');remove.type='button';remove.className='profile-upload-delete';remove.textContent='Delete';
     remove.onclick=async()=>{
      if(!confirm('Permanently delete "'+(short.title||'this Short')+'"? This cannot be undone.'))return;
      remove.disabled=true;remove.textContent='Deleting…';
      try{const result=await backend.deleteShort(short.id);if(result.storageWarning)message(result.storageWarning,'error');else message('Your Short was deleted.','success');await refresh()}
      catch(err){message(err.message||'This upload could not be deleted.','error');remove.disabled=false;remove.textContent='Delete'}
     };
     row.append(details,remove);uploadList.append(row);
    });
   }
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
  if(data.session){setMode('signin');message('Account created successfully.','success');await refresh()}
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
  const saved=await backend.saveProfile({display_name:$('#name').value,username:$('#username').value,bio:$('#bio').value});
  $('#name').value=saved.display_name||'';
  $('#username').value=saved.username||'';
  $('#bio').value=saved.bio||'';
  message('Your profile has been saved successfully.','success');
 }catch(err){message(err.message||'Your profile could not be saved. Please try again.','error')}
 finally{btn.disabled=false}
};
const passwordForm=$('#password-change-form');
if(passwordForm){passwordForm.onsubmit=async e=>{
 e.preventDefault();
 const next=$('#new-account-password').value;
 const confirm=$('#confirm-account-password').value;
 const button=passwordForm.querySelector('button[type=submit]');
 const note=$('#password-change-status');
 note.textContent='';
 if(next.length<8){note.textContent='Use at least 8 characters.';return}
 if(next!==confirm){note.textContent='The passwords do not match.';return}
 button.disabled=true;note.textContent='Updating password…';
 try{await backend.updatePassword(next);passwordForm.reset();note.textContent='Password updated successfully.'}
 catch(err){note.textContent=err.message||'Password could not be updated.'}
 finally{button.disabled=false}
};}
setMode('signin');refresh();
if(backend?.onAuthChange)backend.onAuthChange(()=>refresh());
const editForm=$('#profile-form'),editHeading=$('#profile-edit-heading'),settings=$('#profile-settings'),profileTabs=[...document.querySelectorAll('[data-profile-tab]')],videos=$('#profile-videos'),activity=$('#profile-activity');
editForm.hidden=true;editHeading.hidden=true;if(settings)settings.hidden=true;
function showProfileTab(tab){const isActivity=tab==='activity';videos.hidden=isActivity;activity.hidden=!isActivity;profileTabs.forEach(a=>{const active=a.dataset.profileTab===tab;a.classList.toggle('active',active);a.setAttribute('aria-selected',String(active))});if(isActivity)activity.scrollIntoView({behavior:'smooth',block:'start'})}
profileTabs.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showProfileTab(a.dataset.profileTab)}));
showProfileTab('videos');
$('#jump-to-edit').onclick=()=>{editForm.hidden=false;editHeading.hidden=false;editHeading.scrollIntoView({behavior:'smooth',block:'start'})};
$('#collapse-profile-edit').onclick=()=>{editForm.hidden=true;editHeading.hidden=true;$('#profile-panel').scrollIntoView({behavior:'smooth',block:'start'})};
$('#profile-settings-toggle').onclick=()=>{if(!settings)return;settings.hidden=!settings.hidden;if(!settings.hidden)settings.scrollIntoView({behavior:'smooth',block:'start'})};
$('#settings-edit-profile').onclick=()=>{settings.hidden=true;editForm.hidden=false;editHeading.hidden=false;editHeading.scrollIntoView({behavior:'smooth',block:'start'})};
const preferenceIds=['pref-reduce-motion','pref-compact-layout','pref-autoplay-shorts'];
preferenceIds.forEach(id=>{const input=$('#'+id);if(!input)return;const key='tp-setting-'+id;const saved=localStorage.getItem(key);if(saved!==null)input.checked=saved==='true';input.addEventListener('change',()=>{localStorage.setItem(key,String(input.checked));$('#preferences-status').textContent='Preference saved on this device.';if(id==='pref-reduce-motion')document.documentElement.classList.toggle('tp-reduce-motion',input.checked);if(id==='pref-compact-layout')document.documentElement.classList.toggle('tp-compact-layout',input.checked)})});
document.documentElement.classList.toggle('tp-reduce-motion',$('#pref-reduce-motion')?.checked===true);
document.documentElement.classList.toggle('tp-compact-layout',$('#pref-compact-layout')?.checked===true);
$('#settings-signout').onclick=()=>$('#profile-signout').click();
$('#settings-back-to-profile')?.addEventListener('click',()=>{settings.hidden=true;$('#profile-panel').scrollIntoView({behavior:'smooth',block:'start'})});
$('#profile-share').onclick=async()=>{const url=location.href.split('?')[0];try{if(navigator.share)await navigator.share({title:'TrendPulse profile',url});else{await navigator.clipboard.writeText(url);message('Profile link copied.','success')}}catch(e){}};
}
async function catalog(){let form=$('#search-form'),root=$('#content'),status=$('#status');form.onsubmit=async e=>{e.preventDefault();let q=$('#query').value.trim(),kind=$('#kind').value;if(!q)return;root.innerHTML='';status.textContent='Searching public catalogue…';let data=[];try{if(kind==='Anime'||kind==='Manga'){let type=kind==='Anime'?'anime':'manga';let r=await fetch('https://kitsu.io/api/edge/'+type+'?filter[text]='+encodeURIComponent(q)+'&page[limit]=12');if(!r.ok)throw Error();let j=await r.json();data=(j.data||[]).map(x=>{let a=x.attributes||{};return{title:a.canonicalTitle||a.titles?.en||a.titles?.en_jp||'Untitled',poster:a.posterImage?.small||a.posterImage?.medium,genres:'',year:(a.startDate||'').slice(0,4),summary:a.synopsis||'',url:'https://kitsu.io/'+type+'/'+a.slug,type:kind,score:a.averageRating}})}else if(kind==='TV / Drama'){let r=await fetch('https://api.tvmaze.com/search/shows?q='+encodeURIComponent(q));if(!r.ok)throw Error();let j=await r.json();data=j.slice(0,12).map(v=>({title:v.show.name,poster:v.show.image?.medium,genres:(v.show.genres||[]).join(', '),year:v.show.premiered?.slice(0,4)||'',summary:(v.show.summary||'').replace(/<[^>]*>/g,' '),url:v.show.url,type:'TV / Drama'}))}else{let search=q+' film movie';if(kind==='Hollywood Movies')search=q+' Hollywood film';if(kind==='Bollywood Movies')search=q+' Bollywood Indian film';if(kind==='International Movies')search=q+' international cinema film';let r=await fetch('https://en.wikipedia.org/w/rest.php/v1/search/page?q='+encodeURIComponent(search)+'&limit=12');if(!r.ok)throw Error();let j=await r.json();data=(j.pages||[]).map(x=>({title:x.title,poster:x.thumbnail?.url,genres:x.description||'Wikipedia result',year:'',summary:x.excerpt||'Open the article for more information.',url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(x.key||x.title.replace(/ /g,'_')),type:'Film / Wikipedia'}))}}catch(e){status.textContent='The selected public catalogue is temporarily unavailable. Try again later.';return}if(!data.length){status.textContent='No matching titles found.';return}status.textContent='Found '+data.length+' results. Add a title to your watchlist. Film results are Wikipedia knowledge results, not verified ratings or streaming availability.';root.innerHTML='<div class="grid">'+data.map(x=>'<article class="card">'+(x.poster?'<img class="poster" loading="lazy" src="'+esc(x.poster)+'" alt="Artwork for '+esc(x.title)+'">':'')+'<span class="tag">'+esc(x.type)+'</span><h3>'+esc(x.title)+'</h3><p class="muted small">'+esc([x.year,x.genres,x.score?'Community rating '+x.score:''].filter(Boolean).join(' · '))+'</p><p class="small">'+esc(x.summary).slice(0,240)+'</p><button data-add="'+encodeURIComponent(JSON.stringify(x))+'">＋ Watchlist</button> <a class="btn secondary" href="'+esc(x.url)+'" target="_blank" rel="noopener">Details</a></article>').join('')+'</div>';root.querySelectorAll('[data-add]').forEach(b=>b.onclick=async()=>{try{const x=JSON.parse(decodeURIComponent(b.dataset.add));const user=await backend.currentUser();if(!user){b.textContent='Sign in first';return}await backend.addWatchlist({external_id:x.url,title:x.title,media_type:x.type,poster_url:x.poster||null});b.textContent='Added ✓'}catch(err){b.textContent=err.message||'Could not save'}})}}
function services(){
 const root=$('#service-directory-list'),status=$('#service-directory-status'),search=$('#service-directory-search'),category=$('#service-directory-category');
 const backend=window.TPBackend,money=value=>'₦'+Number(value||0).toLocaleString('en-NG',{maximumFractionDigits:2});
 let timer;
 async function draw(){
  if(!backend?.ready){status.textContent='The service directory is temporarily unavailable.';root.innerHTML='<div class="empty">Please try again later.</div>';return}
  status.textContent='Loading services…';
  try{
   const rows=await backend.getEarnServices(search.value.trim(),category.value);
   if(!rows.length){root.innerHTML='<div class="empty"><strong>No services found.</strong><p>Try another search or category. You can also check back later as members publish new services.</p><a class="btn secondary" href="./earn.html">Publish a service</a></div>';status.textContent='';return}
   root.innerHTML=rows.map(x=>{
    const p=x.profiles||{},seller=p.display_name||p.username||'TrendPulse member';
    return '<article class="panel earn-service-card"><div class="earn-card-top"><span class="tag">'+esc(x.category||'Other')+'</span><span class="tag">Community provider</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><strong>From '+money(x.starting_price)+'</strong><p class="muted small">Offered by '+esc(seller)+(p.username?' · @'+esc(p.username):'')+'</p><button type="button" class="primary" data-directory-request="'+esc(x.id)+'">Request this service</button><p class="muted small">You can discuss details with the provider. No payment is taken here.</p></article>';
   }).join('');
   status.textContent=rows.length+' service'+(rows.length===1?'':'s')+' available.';
   root.querySelectorAll('[data-directory-request]').forEach(button=>button.addEventListener('click',async()=>{
    const details=prompt('Tell the provider what you need (5–1500 characters). Do not include passwords, one-time codes or private financial information.');
    if(details===null)return;
    if(details.trim().length<5){status.textContent='Please add a little more detail (at least 5 characters).';return}
    button.disabled=true;button.textContent='Sending request…';
    try{await backend.createServiceRequest(button.dataset.directoryRequest,details.trim());location.href='./earn.html?request=1'}
    catch(error){status.textContent=error.message||'Could not send your request. Sign in and try again.';button.disabled=false;button.textContent='Request this service'}
   }));
  }catch(error){status.textContent=error.message||'Could not load services.';root.innerHTML='<div class="empty">The service directory could not be loaded. Please try again.</div>'}
 }
 search.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(draw,300)});
 category.addEventListener('change',draw);
 draw();
}
function earn(){
 const tabs=[...document.querySelectorAll('[data-earn-tab]')],sections={opportunities:$('#earn-opportunities'),services:$('#earn-services'),dashboard:$('#earn-dashboard'),requests:$('#earn-requests'),orders:$('#earn-orders')};
 function show(name){tabs.forEach(t=>{const active=t.dataset.earnTab===name;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active))});Object.entries(sections).forEach(([key,node])=>{node.hidden=key!==name});if(name==='requests')loadRequests();if(name==='orders')loadOrders()}
 tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.earnTab)));
 const backend=window.TPBackend,form=$('#earn-service-form'),list=$('#earn-service-list'),publicList=$('#earn-public-service-list'),status=$('#earn-service-status'),publicStatus=$('#earn-market-status'),requestList=$('#earn-request-list'),requestStatus=$('#earn-request-status');
 const orderList=$('#earn-order-list'),orderStatus=$('#earn-order-status');
 const money=value=>'₦'+Number(value||0).toLocaleString('en-NG',{maximumFractionDigits:2});
 function serviceCard(x,own=false){
   const profile=x.profiles||{},seller=profile.display_name||profile.username||'TrendPulse member',price=money(x.starting_price);
   return '<article class="panel earn-service-card"><div class="earn-card-top"><span class="tag">'+esc(x.category)+'</span>'+(own?'<span class="tag">'+(x.status==='paused'?'Paused':'Live')+'</span>':'')+'</div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><strong>From '+price+'</strong><p class="muted small">'+(own?'Your listing':'By '+esc(seller))+'</p>'+(own?'<div class="earn-card-actions"><button type="button" class="secondary" data-earn-toggle="'+esc(x.id)+'" data-next="'+(x.status==='paused'?'active':'paused')+'">'+(x.status==='paused'?'Publish':'Pause')+'</button><button type="button" class="secondary" data-earn-delete="'+esc(x.id)+'">Delete</button></div>':'<button type="button" class="primary" data-request-service="'+esc(x.id)+'">Request this service</button><p class="muted small">Send an enquiry directly to the seller. No payment is taken.</p>')+'</article>';
 }
 async function loadMarket(){
   if(!backend?.ready){publicStatus.textContent='Marketplace connection is not available right now.';return}
   publicStatus.textContent='Loading community services…';
   try{
     const rows=await backend.getEarnServices($('#earn-market-search').value,$('#earn-market-category').value);
     publicList.innerHTML=rows.length?rows.map(x=>serviceCard(x)).join(''):'<div class="empty"><strong>No services found yet.</strong><p>Be the first to publish a service for the community.</p></div>';
     publicStatus.textContent=rows.length?rows.length+' community service'+(rows.length===1?'':'s')+' available.':'';
     publicList.querySelectorAll('[data-request-service]').forEach(button=>button.addEventListener('click',async()=>{
       const details=prompt('Tell the seller what you need (5–1500 characters). Do not include passwords or private financial information.');
       if(details===null)return;
       button.disabled=true;button.textContent='Sending request…';
       try{await backend.createServiceRequest(button.dataset.requestService,details);publicStatus.textContent='Request sent. Open the Requests tab to follow it and message the seller.';show('requests')}
       catch(error){publicStatus.textContent=error.message||'Could not send the request.';button.disabled=false;button.textContent='Request this service'}
     }));
   }catch(error){publicStatus.textContent=error.message||'Could not load services. Please try again.';publicList.innerHTML='<div class="empty">Marketplace temporarily unavailable.</div>'}
 }
 async function loadMine(){
   if(!backend?.ready){list.innerHTML='<div class="empty">Marketplace connection is unavailable.</div>';return}
   try{
     const rows=await backend.getMyEarnServices();
     list.innerHTML=rows.length?rows.map(x=>serviceCard(x,true)).join(''):'<div class="empty">You have not published a service yet.</div>';
     list.querySelectorAll('[data-earn-delete]').forEach(button=>button.addEventListener('click',async()=>{
       if(!confirm('Delete this service listing?'))return;
       button.disabled=true;try{await backend.deleteEarnService(button.dataset.earnDelete);await loadMine();await loadMarket();status.textContent='Service listing deleted.'}catch(error){button.disabled=false;status.textContent=error.message||'Could not delete listing.'}
     }));
     list.querySelectorAll('[data-earn-toggle]').forEach(button=>button.addEventListener('click',async()=>{
       button.disabled=true;try{await backend.updateEarnService(button.dataset.earnToggle,{status:button.dataset.next});await loadMine();await loadMarket();status.textContent='Listing status updated.'}catch(error){button.disabled=false;status.textContent=error.message||'Could not update listing.'}
     }));
   }catch(error){list.innerHTML='<div class="empty">'+esc(error.message||'Could not load your listings.')+'</div>'}
 }
 async function loadRequests(){
   if(!backend?.ready){requestList.innerHTML='<div class="empty">Requests are unavailable until the backend is connected.</div>';return}
   requestStatus.textContent='Loading your requests…';
   try{
     const user=await backend.currentUser();if(!user){requestList.innerHTML='<div class="empty">Sign in to view service requests.</div>';requestStatus.textContent='';return}
     const rows=await backend.getMyServiceRequests();
     if(!rows.length){requestList.innerHTML='<div class="empty">No service requests yet. When someone contacts you about a listing, it will appear here.</div>';requestStatus.textContent='';return}
     requestList.innerHTML=rows.map(row=>{
       const mineBuyer=row.buyer_id===user.id,person=mineBuyer?(row.seller||{}):(row.buyer||{}),name=person.display_name||person.username||'TrendPulse member',title=row.service?.title||'Service listing';
       const actions=mineBuyer?(row.status==='pending'?'<button class="secondary" data-request-action="cancelled" data-request-id="'+esc(row.id)+'">Cancel request</button>':''):(row.status==='pending'?'<button class="primary" data-request-action="accepted" data-request-id="'+esc(row.id)+'">Accept</button><button class="secondary" data-request-action="declined" data-request-id="'+esc(row.id)+'">Decline</button>':'');
       return '<article class="panel earn-request-card"><div class="earn-card-top"><span class="tag">'+(mineBuyer?'You requested':'Incoming request')+'</span><span class="tag">'+esc(row.status)+'</span></div><h3>'+esc(title)+'</h3><p class="muted small">'+(mineBuyer?'Seller: ':'Buyer: ')+esc(name)+'</p><p>'+esc(row.request_message)+'</p><p class="muted small">'+new Date(row.created_at).toLocaleString()+'</p><div class="earn-card-actions"><a class="btn secondary" href="./messages.html?conversation='+encodeURIComponent(row.conversation_id)+'">Open chat</a>'+actions+'</div></article>';
     }).join('');
     requestStatus.textContent=rows.length+' request'+(rows.length===1?'':'s');
     requestList.querySelectorAll('[data-request-action]').forEach(button=>button.addEventListener('click',async()=>{
       button.disabled=true;try{await backend.respondServiceRequest(button.dataset.requestId,button.dataset.requestAction);if(button.dataset.requestAction==='accepted'){await loadRequests();await loadOrders();show('orders');orderStatus.textContent='Order created from the accepted request.'}else{await loadRequests();requestStatus.textContent='Request updated.'}}catch(error){button.disabled=false;requestStatus.textContent=error.message||'Could not update request.'}
     }));
   }catch(error){requestStatus.textContent=error.message||'Could not load requests.';requestList.innerHTML='<div class="empty">Your requests could not be loaded.</div>'}
 }
 async function loadOrders(){
   if(!backend?.ready){orderList.innerHTML='<div class="empty">Orders are unavailable until the backend is connected.</div>';return}
   orderStatus.textContent='Loading your orders…';
   try{
     const user=await backend.currentUser();
     if(!user){orderList.innerHTML='<div class="empty">Sign in to view your orders.</div>';orderStatus.textContent='';return}
     const rows=await backend.getMyServiceOrders();
     let testPayments=[],sandboxReady=true;
     try{testPayments=await backend.getMyServiceTestPayments()}catch(_){sandboxReady=false}
     if(!rows.length){orderList.innerHTML='<div class="empty">No orders yet. When a seller accepts one of your service requests, it will appear here.</div>';orderStatus.textContent='';return}
     const paymentByOrder=new Map(testPayments.map(payment=>[payment.order_id,payment]));
     const labels={accepted:'Accepted',in_progress:'In progress',delivered:'Delivered',completed:'Completed',cancelled:'Cancelled'};
     orderList.innerHTML=rows.map(order=>{
       const isBuyer=order.buyer_id===user.id,other=isBuyer?(order.seller||{}):(order.buyer||{});
       const testPayment=paymentByOrder.get(order.id);
       const person=other.display_name||other.username||'TrendPulse member';
       let actions='';
       if(!isBuyer&&order.status==='accepted')actions+='<button class="primary" data-order-action="in_progress" data-order-id="'+esc(order.id)+'">Start work</button>';
       if(!isBuyer&&order.status==='in_progress')actions+='<button class="primary" data-order-action="delivered" data-order-id="'+esc(order.id)+'">Mark delivered</button>';
       if(isBuyer&&order.status==='delivered')actions+='<button class="primary" data-order-action="completed" data-order-id="'+esc(order.id)+'">Confirm completion</button>';
       if(order.status==='accepted')actions+='<button class="secondary" data-order-action="cancelled" data-order-id="'+esc(order.id)+'">Cancel order</button>';
       if(isBuyer&&!testPayment&&sandboxReady&&['accepted','in_progress','delivered'].includes(order.status))actions+='<button class="secondary" data-test-payment="'+esc(order.id)+'">Run test payment (no real money)</button>';
       const events=(order.events||[]).slice().sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
       const history=events.length?'<ol class="earn-order-history">'+events.map(ev=>'<li><b>'+esc(labels[ev.event_type]||ev.event_type)+'</b><span>'+esc(ev.actor?.display_name||ev.actor?.username||'Member')+' · '+new Date(ev.created_at).toLocaleString()+'</span>'+(ev.note?'<p>'+esc(ev.note)+'</p>':'')+'</li>').join('')+'</ol>':'';
       const paymentNote=testPayment?'<p class="earn-trust-note">TEST ONLY: simulated payment recorded for '+money(testPayment.amount)+'. No real money was collected and no payout is available.</p>':'<p class="muted small">No payment recorded. The order price is not proof of payment.</p>';
       return '<article class="panel earn-order-card" data-order-id="'+esc(order.id)+'"><div class="earn-card-top"><span class="tag">Order</span><span class="tag order-status-'+esc(order.status)+'">'+esc(labels[order.status]||order.status)+'</span></div><h3>'+esc(order.service?.title||'Community service')+'</h3><p class="muted small">'+(isBuyer?'Seller: ':'Buyer: ')+esc(person)+'</p><strong>'+money(order.listing_price)+'</strong>'+paymentNote+'<div class="earn-card-actions"><a class="btn secondary" href="./messages.html?conversation='+encodeURIComponent(order.conversation_id)+'">Open chat</a>'+actions+'</div><details class="earn-order-details"><summary>Order history</summary>'+history+'</details></article>';
     }).join('');
     const requestedOrder=new URLSearchParams(location.search).get('order');
     if(requestedOrder){
       const target=[...orderList.querySelectorAll('.earn-order-card')].find(card=>card.dataset.orderId===requestedOrder);
       if(target){
         target.classList.add('is-deep-linked');
         target.scrollIntoView({behavior:'smooth',block:'center'});
         window.setTimeout(()=>target.classList.remove('is-deep-linked'),4500);
       }
     }
     orderStatus.textContent=rows.length+' order'+(rows.length===1?'':'s');
     orderList.querySelectorAll('[data-test-payment]').forEach(button=>button.addEventListener('click',async()=>{
       if(!confirm('Run a sandbox-only payment simulation? This does not charge anyone or create withdrawable money.'))return;
       button.disabled=true;button.textContent='Recording test…';
       try{await backend.simulateServiceTestPayment(button.dataset.testPayment);await loadOrders();orderStatus.textContent='Sandbox payment recorded. No real money was collected.'}
       catch(error){button.disabled=false;button.textContent='Run test payment (no real money)';orderStatus.textContent=error.message||'Could not record the test payment.'}
     }));
     if(!sandboxReady)orderStatus.textContent='Payment sandbox is not installed yet. Orders still work; no payment has been taken.';
     orderList.querySelectorAll('[data-order-action]').forEach(button=>button.addEventListener('click',async()=>{
       const action=button.dataset.orderAction;
       const note=action==='delivered'?prompt('Add a delivery note (optional, up to 1,000 characters).'):null;
       if(action==='delivered'&&note===null)return;
       button.disabled=true;
       try{await backend.transitionServiceOrder(button.dataset.orderId,action,note||'');await loadOrders();orderStatus.textContent='Order updated.'}
       catch(error){button.disabled=false;orderStatus.textContent=error.message||'Could not update the order.'}
     }));
   }catch(error){orderStatus.textContent=error.message||'Could not load orders.';orderList.innerHTML='<div class="empty">Your orders could not be loaded.</div>'}
 }
 form.addEventListener('submit',async event=>{
   event.preventDefault();status.textContent='';
   if(!backend?.ready){status.textContent='Marketplace connection is unavailable.';return}
   const title=$('#earn-service-title').value.trim(),description=$('#earn-service-description').value.trim(),price=Number($('#earn-service-price').value);
   if(!title||!description||!Number.isFinite(price)||price<0){status.textContent='Please check the service details and price.';return}
   const button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Publishing…';
   try{await backend.createEarnService({title,category:$('#earn-service-category').value,description,starting_price:price});form.reset();status.textContent='Your service is now published for the TrendPulse community.';await loadMine();await loadMarket()}
   catch(error){status.textContent=error.message||'Could not publish your service. Sign in and try again.'}
   finally{button.disabled=false;button.textContent='Publish service'}
 });
 $('#earn-market-search').addEventListener('input',()=>{clearTimeout(window.tpEarnSearchTimer);window.tpEarnSearchTimer=setTimeout(loadMarket,350)});
 $('#earn-market-category').addEventListener('change',loadMarket);
 loadMarket();loadMine();
 const nav=document.createElement('nav');nav.className='tp-bottom-nav';nav.setAttribute('aria-label','Main navigation');nav.innerHTML='<a href="./"><span>⌂</span><small>Home</small></a><a href="./discover.html"><span>⌕</span><small>Discover</small></a><a href="./shorts.html"><span>▣</span><small>Shorts</small></a><a href="./community.html"><span>◎</span><small>Community</small></a><a href="./profile.html"><span>◉</span><small>Profile</small></a><a href="./earn.html" aria-current="page"><span>₦</span><small>Earn</small></a>';document.body.append(nav);
 const params=new URLSearchParams(location.search);if(params.has('request'))show('requests');if(params.has('order'))show('orders');
}
const map={watchlist,reviews,community:posts,shorts,messages,profile,catalog,earn,services};if(map[page])map[page]();
})();