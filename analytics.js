/* TrendPulse first-party traffic analytics.
 * Stores random anonymous visitor/session IDs only; never records names, emails,
 * full referrers, query strings, or page content.
 */
(()=>{'use strict';
 const cfg=window.TRENDPULSE_SUPABASE_URL&&window.TRENDPULSE_SUPABASE_PUBLISHABLE_KEY;
 if(!cfg||!window.supabase)return;
 const uuid=()=>crypto.randomUUID?crypto.randomUUID(): 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)});
 const get=(key,store)=>{try{let value=store.getItem(key);if(!value){value=uuid();store.setItem(key,value)}return value}catch(e){return uuid()}};
 const visitor=get('tp_analytics_visitor_v1',localStorage);
 const session=get('tp_analytics_session_v1',sessionStorage);
 const path=location.pathname.replace(/\\/{2,}/g,'/').slice(0,300)||'/';
 const dedupe='tp_analytics_last_'+path;
 try{const last=Number(sessionStorage.getItem(dedupe)||0);if(Date.now()-last<30000)return;sessionStorage.setItem(dedupe,String(Date.now()))}catch(e){}
 const referrer=(()=>{try{return document.referrer?new URL(document.referrer).hostname.slice(0,255):null}catch(e){return null}})();
 const send=async()=>{
  try{
   const client=window.TPBackend?.client||window.supabase.createClient(window.TRENDPULSE_SUPABASE_URL,window.TRENDPULSE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
   await client.from('site_analytics_events').insert({visitor_id:visitor,session_id:session,event_type:'page_view',page_path:path,referrer_host:referrer});
  }catch(e){/* Analytics must never interrupt the site. */}
 };
 if(document.readyState==='complete')send();else window.addEventListener('load',send,{once:true});
})();