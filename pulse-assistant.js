(()=>{'use strict';
if(document.getElementById('tp-guide-launcher'))return;
const css=`
#tp-guide-launcher{position:fixed;right:18px;bottom:92px;z-index:9998;border:0;border-radius:999px;padding:13px 17px;background:linear-gradient(135deg,#25f4ee,#fe2c55);color:#071016;font:800 14px/1.2 system-ui;box-shadow:0 10px 32px #0007;cursor:pointer}
#tp-guide-panel{position:fixed;right:16px;bottom:150px;z-index:9999;width:min(370px,calc(100vw - 24px));height:min(560px,calc(100dvh - 180px));display:none;flex-direction:column;overflow:hidden;border:1px solid #343b4c;border-radius:20px;background:#10131d;color:#f7f8fc;box-shadow:0 22px 70px #000a;font:14px/1.45 system-ui}
#tp-guide-panel[ data-open="true"]{display:flex}
.tp-guide-head{display:flex;align-items:center;justify-content:space-between;padding:15px 16px;background:linear-gradient(110deg,#162e35,#241823);border-bottom:1px solid #343b4c}
.tp-guide-head strong{display:block;font-size:15px}.tp-guide-head small{color:#b8c1cf}
#tp-guide-close{border:0;background:#ffffff18;color:white;border-radius:50%;width:34px;height:34px;font-size:22px;cursor:pointer}
#tp-guide-messages{padding:14px;overflow:auto;flex:1;display:flex;flex-direction:column;gap:10px}
.tp-guide-msg{max-width:90%;padding:10px 12px;border-radius:14px;background:#202737;color:#f4f6fa;white-space:pre-wrap;overflow-wrap:anywhere}
.tp-guide-msg.user{align-self:flex-end;background:#164b50}.tp-guide-msg a{color:#55e9e4;font-weight:700;text-decoration:underline}
.tp-guide-quick{display:flex;flex-wrap:wrap;gap:7px;padding:0 12px 10px}
.tp-guide-quick button{border:1px solid #41495a;background:#171d29;color:#e9edf5;border-radius:999px;padding:7px 10px;font-size:12px;cursor:pointer}
.tp-guide-form{display:flex;gap:8px;padding:11px;border-top:1px solid #343b4c;background:#151a25}
#tp-guide-input{min-width:0;flex:1;border:1px solid #41495a;border-radius:12px;padding:11px;background:#0c1018;color:white;font:inherit}
#tp-guide-send{border:0;border-radius:12px;padding:0 15px;background:#25f4ee;color:#071016;font-weight:800;cursor:pointer}
.tp-guide-note{padding:0 12px 9px;color:#9da8b8;font-size:10px}
@media(max-width:520px){#tp-guide-launcher{right:12px;bottom:84px}#tp-guide-panel{right:8px;bottom:138px;width:calc(100vw - 16px);height:min(570px,calc(100dvh - 160px))}}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const launcher=document.createElement('button');launcher.id='tp-guide-launcher';launcher.type='button';launcher.textContent='✦ Pulse Guide';launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-controls','tp-guide-panel');
const panel=document.createElement('section');panel.id='tp-guide-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Pulse Guide support');
panel.innerHTML='<div class="tp-guide-head"><div><strong>✦ Pulse Guide</strong><small>Your guide to everything on TrendPulse</small></div><button id="tp-guide-close" type="button" aria-label="Close help">×</button></div><div id="tp-guide-messages" aria-live="polite"></div><div class="tp-guide-quick"><button type="button">Show me around</button><button type="button">How can I earn?</button><button type="button">Find a service</button><button type="button">Create a Short</button></div><div class="tp-guide-note">Guide answers use current published features. It cannot access private account details.</div><form class="tp-guide-form" id="tp-guide-form"><input id="tp-guide-input" maxlength="300" autocomplete="off" placeholder="Ask about TrendPulse…" aria-label="Ask Pulse Guide"><button id="tp-guide-send" type="submit">Send</button></form>';
document.body.append(launcher,panel);
const messages=panel.querySelector('#tp-guide-messages'),input=panel.querySelector('#tp-guide-input');
const links={home:'./',shorts:'./shorts.html',discover:'./discover.html',community:'./community.html',market:'./services.html',earn:'./earn.html',profile:'./profile.html',battles:'./battles.html',challenge:'./challenge.html',members:'./members.html',watchlist:'./watchlist.html',messages:'./messages.html'};
function add(text,who='bot',link){const row=document.createElement('div');row.className='tp-guide-msg '+who;row.textContent=text;if(link&&links[link]){const a=document.createElement('a');a.href=links[link];a.textContent=' Open '+({home:'Home',shorts:'Shorts',discover:'Discover',community:'Community',market:'Marketplace',earn:'Earn',profile:'Profile',battles:'Battles',challenge:'Daily Challenge',members:'Sign in / Join',watchlist:'Watchlist',messages:'Messages'}[link]||'page')+' →';row.append(document.createElement('br'),a)}messages.appendChild(row);messages.scrollTop=messages.scrollHeight}
function answer(q){const s=q.toLowerCase();
if(/^(hi|hello|hey|good morning|good evening)\b/.test(s))return ['Welcome to TrendPulse! You can discover entertainment, watch Shorts, meet communities, join fan battles and explore service opportunities. What would you like to try?', 'home'];
if(/show me around|how.*work|what.*trendpulse|start|guide|opportunit/.test(s))return ['TrendPulse brings several experiences together: discover trending entertainment, watch and share Shorts, follow creators, join communities and battles, take daily challenges, and explore the services marketplace. Start with Discover, then explore Shorts and Community. Your profile keeps your creator activity together.', 'discover'];
if(/short|video|upload|creator|post/.test(s))return ['Shorts is where you watch short videos and discover creators. Sign in to upload your own Short, add a title and caption, and manage your uploads from your profile. You can also comment, like, follow creators and save Shorts to your Watchlist.', 'shorts'];
if(/market|service|hire|provider|customer|request/.test(s))return ['The Marketplace lets people browse community service listings, search by service or category, and send a request to a provider. If you offer a service, use Earn to create and manage your listing. Check the provider details before agreeing to work. TrendPulse does not process service payments yet.', 'market'];
if(/earn|money|paid|withdraw|payment|reward|income/.test(s))return ['Earn currently supports service listings, incoming and outgoing service requests, and order progress tracking. These tools help customers and providers organise work, but payment processing, automatic payouts, platform commissions and cash rewards are not active. Do not treat an order status as proof of payment.', 'earn'];
if(/battle|vote|versus|versus|challenge|daily duel/.test(s))return ['Pulse Battles lets members create head-to-head topics and vote. Daily challenges give the community a shared prompt to take part in. Open either page to see what is currently available.', /battle|vote/.test(s)?'battles':'challenge'];
if(/community|group|chat|message|talk/.test(s))return ['Community is where members join fan groups and take part in conversations. Messages lets you contact other members. Be respectful and never share passwords or one-time codes.', 'community'];
if(/profile|follow|follower|watchlist|save/.test(s))return ['Your profile brings together your creator identity, followers, uploads and activity. Follow creators to keep up with them, and save Shorts or entertainment titles to your Watchlist for later.', 'profile'];
if(/account|sign.?in|login|register|password/.test(s))return ['Use Members to sign in or create an account. If you cannot access your account, use the account recovery options shown there. Never share your password or one-time code in a chat.', 'members'];
if(/support|human|problem|report|help/.test(s))return ['I can explain the published features, but I cannot access private account records or fix account-specific issues. For a problem with content or safety, use the reporting controls where available; for general information, visit About.', 'home'];
return ['I am still learning the full TrendPulse help library, so I do not want to guess. Try asking about Shorts, creators, Marketplace, Earn, Battles, Challenges, Community, Watchlist or your account.', 'home']}
function ask(q){const clean=String(q||'').trim().slice(0,300);if(!clean)return;add(clean,'user');const [reply,link]=answer(clean);window.setTimeout(()=>add(reply,'bot',link),180)}
function open(){panel.dataset.open='true';launcher.setAttribute('aria-expanded','true');input.focus()}
function close(){panel.dataset.open='false';launcher.setAttribute('aria-expanded','false');launcher.focus()}
launcher.addEventListener('click',()=>panel.dataset.open==='true'?close():open());
panel.querySelector('#tp-guide-close').addEventListener('click',close);
panel.querySelector('#tp-guide-form').addEventListener('submit',e=>{e.preventDefault();ask(input.value);input.value=''});
panel.querySelectorAll('.tp-guide-quick button').forEach(b=>b.addEventListener('click',()=>ask(b.textContent)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.dataset.open==='true')close()});
add('Hi! I’m Pulse Guide. Ask me how TrendPulse works or what you can explore here. I’ll point you to the right place and be clear about which opportunities are currently active.');
})();