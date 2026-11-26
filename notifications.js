(()=>{'use strict';
const backend=window.TPBackend;
if(!backend?.ready||!backend.client)return;
const client=backend.client;
let currentUser=null,channel=null,items=[],open=false;
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
const safeTarget=value=>typeof value==='string'&&(value.startsWith('./')||value.startsWith('/'))&&!value.startsWith('//')?value:'';
const style=document.createElement('link');style.rel='stylesheet';style.href='./notifications.css?v=20261126-notify1';document.head.append(style);
const launcher=el('button','tp-notification-launcher');launcher.type='button';launcher.setAttribute('aria-label','Notifications');launcher.setAttribute('aria-expanded','false');launcher.innerHTML='<span aria-hidden="true">♧</span><span class="tp-notification-count" hidden>0</span>';
const panel=el('section','tp-notification-panel');panel.hidden=true;panel.setAttribute('aria-label','Notifications');
const head=el('div','tp-notification-head');head.append(el('div','','Notifications'));
const actions=el('div','tp-notification-actions');
const markAll=el('button','tp-notification-markall','Mark all read');markAll.type='button';
const close=el('button','tp-notification-close','×');close.type='button';close.setAttribute('aria-label','Close notifications');
actions.append(markAll,close);head.append(actions);
const list=el('div','tp-notification-list');list.setAttribute('aria-live','polite');panel.append(head,list);
document.body.append(launcher,panel);
function setOpen(value){open=value;panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));if(open)refresh().catch(showError);}
function updateBadge(){const count=items.filter(x=>!x.is_read).length;const badge=launcher.querySelector('.tp-notification-count');badge.textContent=count>99?'99+':String(count);badge.hidden=!count;launcher.setAttribute('aria-label',count?count+' unread notifications':'Notifications');}
function render(){
 list.replaceChildren();
 if(!items.length){list.append(el('p','tp-notification-empty','You’re all caught up. New follows, likes, comments and direct messages will appear here.'));updateBadge();return;}
 items.forEach(item=>{
  const button=el('button','tp-notification-item'+(item.is_read?' is-read':''));
  button.type='button';
  const icon=el('span','tp-notification-icon',({follow:'＋',like:'♥',comment:'▤',short_like:'♥',short_comment:'▶',message:'✉',service_request:'↗',service_request_update:'↗',service_order_update:'✓'}[item.kind]||'•'));
  const copy=el('span','tp-notification-copy');
  copy.append(el('b','',item.title||'Notification'),el('span','',item.body||''));
  const time=el('time','',new Date(item.created_at).toLocaleString());
  button.append(icon,copy,time);
  button.addEventListener('click',async()=>{
   try{if(!item.is_read){await backend.markNotificationRead(item.id);item.is_read=true;render();}
    const target=safeTarget(item.target_url);if(target)location.href=target;
   }catch(error){showError(error.message||'Could not open notification.');}
  });
  list.append(button);
 });
 updateBadge();
}
function showError(message){list.replaceChildren(el('p','tp-notification-error',message));}
async function refresh(){
 if(!currentUser)return;
 const {data,error}=await client.from('notifications').select('id,kind,title,body,target_url,is_read,created_at').eq('user_id',currentUser.id).order('created_at',{ascending:false}).limit(50);
 if(error)throw error;items=data||[];render();
}
function disconnect(){if(channel){client.removeChannel(channel);channel=null;}currentUser=null;items=[];launcher.hidden=true;panel.hidden=true;open=false;launcher.setAttribute('aria-expanded','false');updateBadge();}
async function connect(user){
 if(channel){client.removeChannel(channel);channel=null;}
 currentUser=user||null;items=[];
 if(!currentUser){disconnect();return;}
 launcher.hidden=false;
 channel=client.channel('tp-notifications-'+currentUser.id).on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:'user_id=eq.'+currentUser.id},()=>refresh().catch(showError)).subscribe();
 try{await refresh();}catch(error){showError('Notifications are temporarily unavailable.');}
}
launcher.addEventListener('click',()=>setOpen(!open));
close.addEventListener('click',()=>setOpen(false));
markAll.addEventListener('click',async()=>{
 if(!currentUser)return;
 try{const {error}=await client.from('notifications').update({is_read:true}).eq('user_id',currentUser.id).eq('is_read',false);if(error)throw error;items=items.map(x=>({...x,is_read:true}));render();}
 catch(error){showError(error.message||'Could not mark notifications as read.');}
});
document.addEventListener('click',event=>{if(open&&!panel.contains(event.target)&&!launcher.contains(event.target))setOpen(false);});
backend.onAuthChange(user=>connect(user));
backend.currentUser().then(connect).catch(()=>disconnect());
window.addEventListener('pagehide',()=>{if(channel)client.removeChannel(channel);});
})();