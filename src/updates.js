EXP.Updates = (() => {
  const ENDPOINT = 'https://api.github.com/repos/ExtraPotions/WARD/releases/latest';
  const CACHE_KEY = 'exp:v3:ward:update-cache';
  let last = { state:'idle', available:false, latest:null, details:[] };
  const newer = (left, right) => {
    const a=String(left).replace(/^v/,'').split('.').map(Number), b=String(right).replace(/^v/,'').split('.').map(Number);
    for(let i=0;i<3;i+=1)if((a[i]||0)!==(b[i]||0))return(a[i]||0)>(b[i]||0);
    return false;
  };
  function releaseDetails(body) {
    const details=[];
    let section=false;
    for(const line of String(body||'').split(/\r?\n/)){
      if(/^##\s+/.test(line)){if(section)break;section=true;continue;}
      if(!section)continue;
      const match=line.match(/^\s*[-*]\s+(.+)/);
      if(!match)continue;
      const detail=match[1].replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[`*_]/g,'').trim();
      if(detail)details.push(detail.slice(0,220));
      if(details.length===4)break;
    }
    return details;
  }
  function request() {
    return new Promise((resolve,reject) => {
      if(typeof GM_xmlhttpRequest!=='function')return reject(new Error('Update transport unavailable'));
      GM_xmlhttpRequest({method:'GET',url:ENDPOINT,headers:{Accept:'application/vnd.github+json'},timeout:8000,onload:(response)=>response.status>=200&&response.status<300?resolve(JSON.parse(response.responseText)):reject(new Error('Update metadata unavailable')),onerror:()=>reject(new Error('Update metadata unavailable')),ontimeout:()=>reject(new Error('Update metadata timed out'))});
    });
  }
  async function check(force=false) {
    if(!EXP.Settings.snapshot().updateNotifications&&!force)return last={state:'disabled',available:false,latest:null,details:[]};
    try{
      const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');
      let latest,details;
      if(!force&&cached?.checkedAt&&Date.now()-cached.checkedAt<900000){latest=cached.latest;details=Array.isArray(cached.details)?cached.details:[];}
      else{const data=await request();latest=String(data.tag_name||'').replace(/^v/,'');details=releaseDetails(data.body);localStorage.setItem(CACHE_KEY,JSON.stringify({checkedAt:Date.now(),latest,details}));}
      return last={state:'checked',available:newer(latest,EXP.VERSION),latest,details};
    }catch(error){EXP.Core.safeError(Object.assign(error,{code:'UPDATE_CHECK'}),'ward.updates');return last={state:'failed',available:false,latest:null,details:[]};}
  }
  return Object.freeze({ check, status:()=>({...last,details:last.details.slice()}), ENDPOINT });
})();
