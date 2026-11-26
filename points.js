(()=>{'use strict';
const today=new Date().toISOString().slice(0,10);
const labels={trend:'Trend IQ',screen:'Screen Test',brain:'Brain Circuit',expert:'Expert Arena'};
let serverMode=false,serverChallenges=[],serverAnswered=new Set(),backend=window.TPBackend;
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderTotal(total){const n=Math.min(1000,Math.max(0,Number(total)||0));$('#points-total').textContent=Number(total||0).toLocaleString();$('#points-fill').style.width=n/10+'%';$('#points-progress').setAttribute('aria-valuenow',String(n));$('#points-percent').textContent=Math.round(n/10)+'% complete';$('#points-left').textContent=Math.max(0,1000-n).toLocaleString()+' to go'}
function renderHistory(rows){const hist=$('#points-history');hist.innerHTML=rows.length?rows.slice(0,8).map(x=>'<div><span>'+esc(labels[x.challenge_id?.split('-')[0]]||x.name||'Challenge')+' · '+esc(x.challenge_date||x.date||'')+'</span><b>+'+Number(x.points_awarded??x.points??0)+' pts</b></div>').join(''):'<p class="points-muted">No challenges completed yet.</p>'}
function renderServerStats(stats){renderTotal(stats.total_points);$('#streak-count').textContent=stats.current_streak||0;$('#streak-best').textContent=stats.best_streak||0;$('#streak-message').textContent='Your daily check-in is saved to your TrendPulse account.'}
function notice(mode,text){$('#points-mode-notice').innerHTML='<b>'+mode+'</b> '+text}
function start(type){if(!serverMode)return;const q=serverChallenges.find(x=>x.category===type);if(!q)return;const panel=$('#quiz-panel');panel.hidden=false;panel.dataset.type=type;panel.dataset.challengeId=q.challenge_id||'';const options=q.options||q.a;panel.innerHTML='<span class="tag">QUESTION · '+Number(q.points??q.p)+' POINTS</span><h3>'+esc(q.question||q.q)+'</h3><div class="points-options">'+options.map((v,i)=>'<button type="button" data-answer="'+i+'">'+esc(v)+'</button>').join('')+'</div><p class="points-feedback" id="quiz-feedback" role="status"></p>';panel.querySelectorAll('[data-answer]').forEach(btn=>btn.addEventListener('click',()=>answer(type,q,+btn.dataset.answer)))}
async function refreshServer(){const [statsResult,historyResult]=await Promise.all([backend.client.rpc('get_my_pulse_points'),backend.client.rpc('get_my_pulse_history')]);if(statsResult.error)throw statsResult.error;if(historyResult.error)throw historyResult.error;const stats=Array.isArray(statsResult.data)?statsResult.data[0]:statsResult.data;renderServerStats(stats||{});renderHistory(historyResult.data||[])}
async function answer(type,q,choice){
const panel=$('#quiz-panel'),buttons=panel.querySelectorAll('button');
buttons.forEach(b=>b.disabled=true);
if(!serverMode){$('#quiz-feedback').textContent='Sign in to save a verified answer.';return}
try{
 const {data,error}=await backend.client.rpc('submit_pulse_answer',{p_challenge_id:q.challenge_id,p_selected_option:choice});
 if(error)throw error;
 const result=Array.isArray(data)?data[0]:data;
 if(!result)throw new Error('No result was returned.');
 const feedback=$('#quiz-feedback');
 if(result.already_answered){feedback.textContent='You have already answered this challenge today.';serverAnswered.add(type)}
 else{feedback.textContent=(result.correct?'Correct — +'+result.points_awarded+' points. ':'Not quite — no points this time. ')+result.explanation;serverAnswered.add(type)}
 await refreshServer();
 document.querySelectorAll('[data-start]').forEach(btn=>{if(serverAnswered.has(btn.dataset.start)){btn.disabled=true;btn.textContent='Completed today'}});
}catch(e){$('#quiz-feedback').textContent=e.message||'Your answer could not be saved. Please try again.';buttons.forEach(btn=>btn.disabled=false)}
}
async function init(){
 document.querySelectorAll('[data-start]').forEach(btn=>btn.addEventListener('click',()=>start(btn.dataset.start)));
 if(!backend?.ready){
   notice('Points unavailable:','TrendPulse could not connect to its live points service. Please try again later.');
   document.querySelectorAll('[data-start]').forEach(btn=>{btn.disabled=true;btn.textContent='Unavailable'});
   $('#streak-message').textContent='Live points could not be loaded.';
   return;
 }
 try{
   const user=await backend.currentUser();
   if(!user){
     notice('Sign in required:','Your Pulse Points belong to your TrendPulse account. <a href="./profile.html" style="color:#25f4ee;text-decoration:underline">Sign in or create an account</a> to take challenges and save points.');
     document.querySelectorAll('[data-start]').forEach(btn=>{btn.disabled=true;btn.textContent='Sign in to play'});
     $('#streak-message').textContent='Sign in to build your account streak.';
     renderTotal(0);
     return;
   }
   serverMode=true;
   notice('Live account points:','Your scores and streak are saved to your TrendPulse account and sync across devices. Points are for in-app progression, not cash.');
   const [challengeResult,statsResult]=await Promise.all([backend.client.rpc('get_daily_pulse_challenges'),backend.client.rpc('get_my_pulse_points')]);
   if(challengeResult.error)throw challengeResult.error;
   if(statsResult.error)throw statsResult.error;
   serverChallenges=challengeResult.data||[];
   const stats=Array.isArray(statsResult.data)?statsResult.data[0]:statsResult.data;
   renderServerStats(stats||{});
   const history=await backend.client.rpc('get_my_pulse_history');
   if(history.error)throw history.error;
   (history.data||[]).filter(x=>x.challenge_date===today).forEach(x=>serverAnswered.add(x.challenge_id.split('-')[0]));
   document.querySelectorAll('[data-start]').forEach(btn=>{
     const exists=serverChallenges.some(x=>x.category===btn.dataset.start);
     btn.disabled=!exists||serverAnswered.has(btn.dataset.start);
     btn.textContent=serverAnswered.has(btn.dataset.start)?'Completed today':exists?'Start challenge':'Coming soon';
   });
   renderHistory(history.data||[]);
 }catch(e){
   serverMode=false;
   notice('Live points connection issue:',esc(e.message||'Verified scoring is temporarily unavailable. Please try again.'));
   document.querySelectorAll('[data-start]').forEach(btn=>{btn.disabled=true;btn.textContent='Unavailable'});
   renderTotal(0);
   $('#streak-message').textContent='Unable to load your verified streak.';
 }
}
init();
})();