(()=>{'use strict';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(n,c)=>new Intl.NumberFormat(undefined,{style:'currency',currency:c||'NGN',maximumFractionDigits:2}).format(Number(n)||0);
const client=()=>window.TPBackend?.client;
const loading=$('#admin-loading'),denied=$('#admin-denied'),app=$('#admin-app'),signout=$('#admin-signout');
function deny(msg){loading.hidden=true;app.hidden=true;denied.hidden=false;$('#admin-denied-message').textContent=msg;}
async function boot(){
 try{
  if(!window.TPBackend?.ready)throw Error('Supabase is not configured. Please try again after the backend is available.');
  const user=await window.TPBackend.currentUser();
  if(!user){deny('You are not signed in. Sign in with the owner account first.');return}
  const {data:allowed,error}=await client().rpc('is_trendpulse_admin');
  if(error)throw error;
  if(!allowed){deny('This account is not on the TrendPulse owner allowlist. Ask the owner setup step to authorise this account.');return}
  loading.hidden=true;denied.hidden=true;app.hidden=false;signout.hidden=false;
  await refresh();
 }catch(e){deny(e.message||'Could not verify owner access.')}
}
async function refresh(){
 const db=client();
 const [{data:entries,error:e1},{data:services,error:e2}]=await Promise.all([
  db.from('admin_finance_entries').select('*').order('entry_date',{ascending:false}).limit(300),
  db.from('admin_services').select('*').order('updated_at',{ascending:false})
 ]);
 if(e1)throw e1;if(e2)throw e2;
 const totals={income:0,expense:0,ads:0,tools:0,points:0};
 for(const x of entries){const amount=Number(x.amount)||0;if(x.entry_type==='income'){totals.income+=amount;if(x.source in totals)totals[x.source]+=amount}else totals.expense+=amount}
 // Totals are separated by currency; show a total only when the ledger uses one currency.
 const currencies=[...new Set(entries.map(x=>x.currency))];
 const fmt=(key)=>currencies.length>1?'Multiple currencies':money(totals[key],currencies[0]||'NGN');
 $('#total-income').textContent=fmt('income');$('#ads-income').textContent=fmt('ads');$('#tools-income').textContent=fmt('tools');$('#points-income').textContent=fmt('points');$('#total-expenses').textContent=fmt('expense');$('#net-balance').textContent=currencies.length>1?'Multiple currencies':money(totals.income-totals.expense,currencies[0]||'NGN');
 $('#finance-rows').innerHTML=entries.length?entries.map(x=>'<tr><td>'+esc(x.entry_date)+'</td><td><span class="pill '+esc(x.entry_type)+'">'+esc(x.entry_type)+'</span></td><td>'+esc(x.source)+'</td><td>'+esc(x.note||'—')+'</td><td class="amount">'+(x.entry_type==='expense'?'−':'+')+money(x.amount,x.currency)+'</td></tr>').join(''):'<tr><td colspan="5">No financial entries yet. Add your first record above.</td></tr>';
 $('#service-list').innerHTML=services.length?services.map(x=>{const low=Number(x.points_remaining)<=Number(x.low_points_at);return '<article class="service-item '+(low?'low':'')+'"><div><strong>'+esc(x.service_name)+'</strong><small>'+(x.website_url?'<a href="'+esc(x.website_url)+'" target="_blank" rel="noopener">Open website ↗</a>':'No website link')+'</small><p>'+esc(x.notes||'')+'</p></div><div class="service-balance"><b>'+Number(x.points_remaining).toLocaleString()+' pts</b><span>'+ (low?'LOW BALANCE':'Balance OK')+'</span><small>Alert at '+Number(x.low_points_at).toLocaleString()+' pts</small><small>Top-up estimate: '+money(x.topup_cost,x.currency)+'</small></div><button type="button" class="remove-service" data-delete-service="'+x.id+'" aria-label="Remove '+esc(x.service_name)+'">×</button></article>'}).join(''):'<p class="empty-admin">No services added yet.</p>';
 document.querySelectorAll('[data-delete-service]').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this service from monitoring?'))return;const {error}=await db.from('admin_services').delete().eq('id',b.dataset.deleteService);if(error)alert(error.message);else refresh()});
}
$('#finance-form').addEventListener('submit',async e=>{e.preventDefault();const status=$('#finance-status');status.textContent='Saving…';try{const {error}=await client().from('admin_finance_entries').insert({entry_type:$('#entry-type').value,source:$('#entry-source').value,amount:Number($('#entry-amount').value),currency:$('#entry-currency').value,note:$('#entry-note').value.trim(),entry_date:$('#entry-date').value||new Date().toISOString().slice(0,10)});if(error)throw error;e.target.reset();$('#entry-date').value=new Date().toISOString().slice(0,10);status.textContent='Financial record saved.';await refresh()}catch(err){status.textContent=err.message}});
$('#service-form').addEventListener('submit',async e=>{e.preventDefault();const status=$('#service-status');status.textContent='Saving…';try{const {error}=await client().from('admin_services').insert({service_name:$('#service-name').value.trim(),website_url:$('#service-url').value.trim(),points_remaining:Number($('#service-points').value),low_points_at:Number($('#service-threshold').value),topup_cost:Number($('#service-cost').value),currency:$('#service-currency').value,notes:$('#service-notes').value.trim(),updated_by:(await window.TPBackend.currentUser()).id});if(error)throw error;e.target.reset();$('#service-points').value='0';$('#service-threshold').value='100';$('#service-cost').value='0';status.textContent='Service added to monitoring.';await refresh()}catch(err){status.textContent=err.message}});
$('#admin-refresh').onclick=()=>refresh().catch(e=>alert(e.message));
signout.onclick=async()=>{await window.TPBackend.signOut();location.href='./profile.html'};
$('#entry-date').value=new Date().toISOString().slice(0,10);
boot();
})();