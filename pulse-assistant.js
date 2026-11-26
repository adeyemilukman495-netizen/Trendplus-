(()=>{'use strict';
if(document.getElementById('tp-guide-launcher'))return;
const css=`
#tp-guide-launcher{position:fixed;right:18px;bottom:92px;z-index:9998;border:0;border-radius:999px;padding:13px 17px;background:linear-gradient(135deg,#25f4ee,#fe2c55);color:#071016;font:800 14px/1.2 system-ui;box-shadow:0 10px 32px #0007;cursor:pointer}
#tp-guide-panel{position:fixed;right:16px;bottom:150px;z-index:9999;width:min(370px,calc(100vw - 24px));height:min(590px,calc(100dvh - 180px));display:none;flex-direction:column;overflow:hidden;border:1px solid #343b4c;border-radius:20px;background:#10131d;color:#f7f8fc;box-shadow:0 22px 70px #000a;font:14px/1.45 system-ui}
#tp-guide-panel[data-open="true"]{display:flex}
.tp-guide-head{display:flex;align-items:center;justify-content:space-between;padding:15px 16px;background:linear-gradient(110deg,#162e35,#241823);border-bottom:1px solid #343b4c}
.tp-guide-head strong{display:block;font-size:15px}.tp-guide-head small{color:#b8c1cf}
#tp-guide-close{border:0;background:#ffffff18;color:white;border-radius:50%;width:34px;height:34px;font-size:22px;cursor:pointer}
#tp-guide-messages{padding:14px;overflow:auto;flex:1;display:flex;flex-direction:column;gap:10px}
.tp-guide-msg{max-width:92%;padding:10px 12px;border-radius:14px;background:#202737;color:#f4f6fa;white-space:pre-wrap;overflow-wrap:anywhere}
.tp-guide-msg.user{align-self:flex-end;background:#164b50}.tp-guide-msg a{color:#55e9e4;font-weight:700;text-decoration:underline}
.tp-guide-quick{display:flex;flex-wrap:wrap;gap:7px;padding:0 12px 10px}
.tp-guide-quick button{border:1px solid #41495a;background:#171d29;color:#e9edf5;border-radius:999px;padding:7px 10px;font-size:12px;cursor:pointer}
.tp-guide-form{display:flex;gap:8px;padding:11px;border-top:1px solid #343b4c;background:#151a25}
#tp-guide-input{min-width:0;flex:1;border:1px solid #41495a;border-radius:12px;padding:11px;background:#0c1018;color:white;font:inherit}
#tp-guide-send{border:0;border-radius:12px;padding:0 15px;background:#25f4ee;color:#071016;font-weight:800;cursor:pointer}
.tp-guide-note{padding:0 12px 9px;color:#9da8b8;font-size:10px}
@media(max-width:520px){#tp-guide-launcher{right:12px;bottom:84px}#tp-guide-panel{right:8px;bottom:138px;width:calc(100vw - 16px);height:min(600px,calc(100dvh - 160px))}}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const launcher=document.createElement('button');launcher.id='tp-guide-launcher';launcher.type='button';launcher.textContent='✦ Pulse Guide';launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-controls','tp-guide-panel');
const panel=document.createElement('section');panel.id='tp-guide-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Pulse Guide support');
panel.innerHTML='<div class="tp-guide-head"><div><strong>✦ Pulse Guide</strong><small>Your guide to everything on TrendPulse</small></div><button id="tp-guide-close" type="button" aria-label="Close help">×</button></div><div id="tp-guide-messages" aria-live="polite"></div><div class="tp-guide-quick"><button type="button">Can I post comedy?</button><button type="button">What can I upload?</button><button type="button">How do points work?</button><button type="button">How do I join?</button></div><div class="tp-guide-note">Answers explain published features. Never share passwords or private information in chats.</div><form class="tp-guide-form" id="tp-guide-form"><input id="tp-guide-input" maxlength="300" autocomplete="off" placeholder="Ask about TrendPulse…" aria-label="Ask Pulse Guide"><button id="tp-guide-send" type="submit">Send</button></form>';
document.body.append(launcher,panel);
const messages=panel.querySelector('#tp-guide-messages'),input=panel.querySelector('#tp-guide-input');
const links={home:'./',shorts:'./shorts.html',discover:'./discover.html',community:'./community.html',earn:'./earn.html',profile:'./profile.html',battles:'./battles.html',challenge:'./challenge.html',members:'./members.html',watchlist:'./watchlist.html',messages:'./messages.html',reviews:'./reviews.html'};
const labels={home:'Home',shorts:'Short Films',discover:'Discover',community:'Community',earn:'Earn · Points',profile:'Profile',battles:'Battles',challenge:'Daily Challenge',members:'Join TrendPulse',watchlist:'Watchlist',messages:'Messages',reviews:'Reviews'};
function add(text,who='bot',link){const row=document.createElement('div');row.className='tp-guide-msg '+who;row.textContent=text;if(link&&links[link]){const a=document.createElement('a');a.href=links[link];a.textContent=' Open '+labels[link]+' →';row.append(document.createElement('br'),a)}messages.appendChild(row);messages.scrollTop=messages.scrollHeight}
function answer(q){const s=q.toLowerCase().replace(/[’']/g,"'");
if(/^(hi|hello|hey|good morning|good evening)\b/.test(s))return ['Welcome to TrendPulse! I can help with posting short films, genres, Discover, community, Battles, Daily Challenges, points and your account. What would you like to know?','home'];
if(/can i post|post.*(comedy|funny|drama|action|animation|romance|horror|thriller|documentary)|genre|what.*(kind|type).*(video|film|content)/.test(s))return ['Yes! Comedy is welcome as a short film or comedy skit. You can also choose Drama, Action, Romance, Thriller, Animation, Science Fiction, Horror, Documentary, Family or Other as the genre when posting. TrendPulse Shorts is specifically for short films: upload an MP4 or WebM video up to 10 minutes long and 50 MB. Please post content you created or have permission to share, and keep it respectful and suitable for the community.','shorts'];
if(/what can i upload|upload|post a short|how.*post|how.*upload|short film|shorts|video/.test(s))return ['To post: open Shorts, choose “Upload a Short Film”, select an MP4 or WebM video (maximum 10 minutes and 50 MB), then add a title, description and genre. Choose whether it is public, followers-only or private, then post it. You need to sign in. You can manage your uploads from your Profile. Shorts is for short films, not ordinary long-form videos.','shorts'];
if(/can i post.*(picture|photo|image)|meme|text post/.test(s))return ['The current Shorts uploader is for video short films (MP4 or WebM), not photo-only uploads or text posts. You can share your thoughts and discuss films in Community.','community'];
if(/genre|category|comedy|action|romance|animation|documentary/.test(s))return ['Short Film genres currently include Drama, Action, Comedy, Romance, Thriller, Animation, Science Fiction, Horror, Documentary, Family and Other. Pick the closest match when you upload.','shorts'];
if(/earn|money|paid|withdraw|payment|cash|creator points|pulse points|xp|level|streak|badge|reward/.test(s))return ['Earn is now the points and creator-progress hub — the old service marketplace is no longer part of TrendPulse. Complete daily challenges to collect Pulse Points, build your progress, maintain streaks, move through XP levels (Newcomer → Explorer → Rising Star → Trend Hunter → Pulse Legend), and work towards badges and profile rewards. These are in-app progress points, not cash: purchases, withdrawals and guaranteed cash rewards are not active.','earn'];
if(/show me around|how.*work|what.*trendpulse|start|guide|where.*(find|go)|feature/.test(s))return ['Here is a quick tour: Discover helps you explore entertainment; Shorts is for short films; Community is for fan conversations; Battles lets members vote; Daily Duel has daily questions; Earn tracks Pulse Points and creator progress; Profile manages your account and uploads.','discover'];
if(/battle|vote|versus/.test(s))return ['Pulse Battles lets members take part in head-to-head entertainment matchups and vote. Open Battles to browse what is active.','battles'];
if(/daily|challenge|duel|question|quiz/.test(s))return ['Daily Duel gives you a set of entertainment and trend questions. Complete the available questions to test your knowledge. Earn is where you can see your Pulse Points and progress.','challenge'];
if(/community|group|chat|message|talk/.test(s))return ['Community is for fan groups and conversations. Open a group to join the discussion. You can also use Messages to contact another member. Be respectful and do not share passwords, one-time codes, your home address or school details.','community'];
if(/profile|follow|follower|watchlist|save|delete.*(upload|video|short)/.test(s))return ['Your Profile brings together your creator identity, followers, uploads and account settings. You can manage and delete your own Shorts from the upload-management area in Profile Settings. Save entertainment titles to your Watchlist for later.','profile'];
if(/discover|find.*(film|movie|anime|series|show)|search/.test(s))return ['Open Discover to search and explore films, anime, series and dramas. You can also save titles to your Watchlist.','discover'];
if(/review|rating/.test(s))return ['You can write and manage reviews and ratings for films, series, anime and dramas on the Reviews page. Mark spoilers clearly so other members know.','reviews'];
if(/account|sign.?in|login|register|join|password/.test(s))return ['Open Members to sign in or create a TrendPulse account. Some features, including posting Shorts and interacting with the community, require you to be signed in. Never share your password or one-time code in a chat.','members'];
if(/support|human|problem|report|help|unsafe/.test(s))return ['I can explain the published features, but I cannot access private account records or resolve account-specific problems. Use the available reporting controls for content concerns, and visit the community for general discussion.','community'];
return ['I do not want to guess. You can ask me things like “Can I post comedy?”, “What genres can I upload?”, “How do I post a short film?”, “How do Pulse Points work?”, “How do I join a group?” or “How do I delete my Short?”.','home']}
function ask(q){const clean=String(q||'').trim().slice(0,300);if(!clean)return;add(clean,'user');const [reply,link]=answer(clean);window.setTimeout(()=>add(reply,'bot',link),120)}
function open(){panel.dataset.open='true';launcher.setAttribute('aria-expanded','true');input.focus()}
function close(){panel.dataset.open='false';launcher.setAttribute('aria-expanded','false');launcher.focus()}
launcher.addEventListener('click',()=>panel.dataset.open==='true'?close():open());
panel.querySelector('#tp-guide-close').addEventListener('click',close);
panel.querySelector('#tp-guide-form').addEventListener('submit',e=>{e.preventDefault();ask(input.value);input.value=''});
panel.querySelectorAll('.tp-guide-quick button').forEach(b=>b.addEventListener('click',()=>ask(b.textContent)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.dataset.open==='true')close()});
add('Hi! I’m Pulse Guide. Ask me anything about TrendPulse — including what kinds of short films you can post. For example: comedy, action, animation or drama.');
})();