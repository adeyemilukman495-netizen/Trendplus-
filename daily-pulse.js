(()=>{'use strict';
const dateNode=document.getElementById('daily-pulse-date');
if(!dateNode)return;
const now=new Date();
const day=now.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
dateNode.textContent=day+' · Your daily starting point';
})();