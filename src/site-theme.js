// Page paint is transformed by role; transparent layers and media pixels are not surfaces.
EXP.SiteTheme = (() => {
  const obsidian={bg:'#03060a',panel:'#03060a',raised:'#1a2530',inset:'#1a2530',line:'#495a68',text:'#c9d7df',muted:'#899ca7',accent:'#c9d7df',onAccent:'#03060a'};
  const extra=[{id:'obsidian',name:'Obsidian',dark:obsidian,light:obsidian}];
  const owned='[id^="exp-"],[data-exp-owned]';
  const marker='data-exp-ward-paint',records=new Map();
  const C=EXP.SiteColor;
  let colors,sequence=0,roots=[document],key='',listening=false,timer=0,rendering=false,observer=null;
  const stats={passes:0,nodes:0,lastMs:0,maxMs:0};
  const theme=p=>({...p,id:p.id+'-'+p.mode,page:p.bg,surface:p.panel,overlay:p.panel,input:p.inset});
  const visible=node=>{const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>=-500&&r.top<=innerHeight+500;};
  const neutral=color=>color&&C.saturation(color)<.15;
  const transparent=color=>!color||color.a<.001;
  const cssColor=(value,alpha)=>{const c=C.parse(value);return c?C.rgba({...c,a:alpha}):value;};
  function sourceBackground(node,cache){
    if(!node)return 'rgb(255, 255, 255)';
    if(cache.has(node))return cache.get(node);
    const p=C.parse(getComputedStyle(node).backgroundColor),parent=node.parentElement;
    const result=p&&!transparent(p)?C.effectiveBackground(C.rgba(p),sourceBackground(parent,cache)):sourceBackground(parent,cache);
    cache.set(node,result);return result;
  }
  function mediaContext(node,cs,cache){
    if(cache.has(node))return cache.get(node);
    if(cache.get(node.parentElement)){cache.set(node,true);return true;}
    // Amazon's video-card headers sit above the video's measured rectangle.
    // Their native black/white choice belongs to the artwork, not the page.
    if(node.closest('[class*="single-video-card_style_themingTextColor"],[class*="live-events-streaming-widget_style_themingTextColor"]')){cache.set(node,true);return true;}
    const pageRoot=n=>n===document.documentElement||n===document.body;
    let artwork=!pageRoot(node)&&/url\(/i.test(cs.backgroundImage);
    for(let anchor=node,depth=0;anchor&&depth<6&&!artwork;anchor=anchor.parentElement,depth++){
      const paint=anchor===node?cs:getComputedStyle(anchor);
      if(!pageRoot(anchor)&&/url\(/i.test(paint.backgroundImage)){artwork=true;break;}
      // An absolutely positioned card is layout. A text-only layer over media is an overlay.
      if(!['absolute','fixed'].includes(paint.position)||anchor.querySelector('img,video,canvas'))continue;
      const r=anchor.getBoundingClientRect();if(!r.width||!r.height)continue;
      for(const media of anchor.parentElement?.querySelectorAll('img,video,canvas')||[]){
        const m=media.getBoundingClientRect(),area=Math.max(0,Math.min(r.right,m.right)-Math.max(r.left,m.left))*Math.max(0,Math.min(r.bottom,m.bottom)-Math.max(r.top,m.top));
        if(m.width>30&&m.height>30&&area>r.width*r.height*.5){artwork=true;break;}
      }
    }
    cache.set(node,artwork);return artwork;
  }
  function surface(value,p,t){
    const c=C.parse(value);if(transparent(c))return value;
    // Keep semantic fills (purchase buttons, deal/status colors), with their text paired below.
    if(!neutral(c)&&C.luminance(c)<.8)return value;
    return C.background(value,t,p.bg);
  }
  function gradient(value,p,t){
    if(!/gradient\(/i.test(value))return value;
    // URL payloads are opaque; convert only CSS color stops and retain every stop's alpha.
    const urls=[];const masked=value.replace(/url\((?:[^"')]|"[^"]*"|'[^']*')*\)/gi,s=>'__WARD_URL_'+(urls.push(s)-1)+'__');
    return masked.replace(/rgba?\([^)]*\)|#[\da-f]{3,8}\b/gi,token=>{
      const c=C.parse(token);if(!c)return token;
      const solid=C.rgba({...c,a:1});return cssColor(C.background(solid,t,p.bg),c.a);
    }).replace(/__WARD_URL_(\d+)__/g,(_,i)=>urls[Number(i)]);
  }
  function iconImage(value,color){
    return value.replace(/url\(["']?(data:image\/svg\+xml,.*?)["']?\)/gi,(whole,url)=>{
      try{let svg=decodeURIComponent(url);svg=svg.replace(/(fill|stroke)=(['"])([^'"]+)\2/gi,(match,property,quote,paint)=>{const c=C.parse(paint);return c&&neutral(c)?property+'='+quote+color+quote:match;});return 'url("'+encodeURI(svg).replace(/#/g,'%23').replace(/"/g,'%22')+'")';}catch{return whole;}
    });
  }
  function shadow(value,p,t){
    // Retailers also use huge, zero-blur shadows as page backdrops. Convert
    // light neutral paint; retain ordinary dark depth shadows and their alpha.
    return value.replace(/rgba?\([^)]*\)/gi,token=>{
      const color=C.parse(token);return neutral(color)&&C.luminance(color)>.6?cssColor(C.background(C.rgba({...color,a:1}),t,p.bg),color.a):token;
    });
  }
  function remember(node){
    let row=records.get(node);
    if(!row){row={id:'w'+(++sequence),attribute:node.getAttribute(marker),css:'',inline:new Map(),effective:null};records.set(node,row);}
    return row;
  }
  function restore(node,row){
    for(const [property,entry]of row.inline){if(node.style.getPropertyValue(property)!==entry.patched)continue;if(entry.value)node.style.setProperty(property,entry.value,entry.priority);else node.style.removeProperty(property);}
    if(row.attribute===null||/^w\d+$/.test(row.attribute))node.removeAttribute(marker);else node.setAttribute(marker,row.attribute);
  }
  function declarations(node,values,row){
    const output=[];
    for(const [property,value]of Object.entries(values)){
      output.push(property+':'+value+'!important');
      // Inline !important wins over any selector. A scoped variable overrides it while
      // its original value remains the fallback during native reads and after scope removal.
      let entry=row.inline.get(property);
      const current=node.style.getPropertyValue(property),priority=node.style.getPropertyPriority(property);
      if(priority==='important'||entry){
        if(!entry||current!==entry.patched){entry={value:current,priority,name:'--exp-ward-'+row.id+'-'+property};row.inline.set(property,entry);}
        entry.patched='var('+entry.name+','+entry.value+')';output.push(entry.name+':'+value+'!important');
      }
    }
    return output.join(';');
  }
  function render(p,scope){
    if(rendering)return '';rendering=true;
    const start=performance.now(),html=document.documentElement,saved=html.getAttribute('data-exp-site-colors'),t=theme(p),nextKey=p.id+'-'+p.mode;
    if(key!==nextKey){roots=[document];key=nextKey;for(const row of records.values()){row.css='';row.effective=null;row.semantic=false;}}
    if(saved==='ward')html.removeAttribute('data-exp-site-colors');
    const nativeBg=new WeakMap(),mediaCache=new WeakMap(),planned=new WeakMap(),semantics=new WeakMap(),writes=[];
    try{
      const nodes=new Set();
      for(const root of roots){if(root.nodeType===1)nodes.add(root);for(const n of root.querySelectorAll?.('*')||[])nodes.add(n);}
      // Read in document order so text is paired with its parent's planned surface.
      const sorted=[...nodes].filter(n=>n.nodeType===1&&!n.closest(owned)&&!n.matches('script,style,link,meta,head,title,source,track,iframe')).sort((a,b)=>a===b?0:a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
      for(const node of sorted){
        if(!visible(node)&&node!==html&&node!==document.body)continue;
        const cs=getComputedStyle(node);if(cs.display==='none'||cs.visibility==='hidden')continue;
        const row=remember(node),values={},isMedia=node.matches('img,picture,video,canvas'),isSvg=node instanceof SVGElement;
        const r=node.getBoundingClientRect(),icon=node.matches('a,button,[role="button"]')&&r.width<=128&&r.height<=200&&/data:image\/svg\+xml/i.test(cs.backgroundImage);
        const control=node.closest('button,[role="button"],input,select,textarea');
        const artwork=!icon&&!control&&mediaContext(node,cs,mediaCache),native=sourceBackground(node,nativeBg);
        let parent=node.parentElement,parentBg=p.bg,inheritedSemantic=false;
        for(let depth=0;parent&&depth<32;parent=parent.parentElement,depth++){
          if(planned.has(parent)){parentBg=planned.get(parent);inheritedSemantic=semantics.get(parent)||false;break;}
          if(records.get(parent)?.effective){parentBg=records.get(parent).effective;inheritedSemantic=records.get(parent).semantic||false;break;}
        }
        const own=C.parse(cs.backgroundColor),semantic=own&&!transparent(own)&&((!neutral(own)&&C.luminance(own)<.8)||(node.matches('[class*="badge" i],[role="status"]')&&C.luminance(own)<.25));
        let bg=artwork?native:parentBg;
        if(isMedia){
          // Keep the native backplate on the image rectangle, not its whole gallery/card.
          // Normalize multiply compositing against the retained native backplate, as on a light page.
          if(node.matches('img')&&cs.mixBlendMode==='multiply'){
            values['background-color']=native;values['mix-blend-mode']='normal';
          }
        }else if(!isSvg){
          let fill=artwork||semantic?cs.backgroundColor:surface(cs.backgroundColor,p,t);
          if(!artwork&&!transparent(own)&&neutral(own)&&node.matches('button,[role="button"],input,select,textarea'))fill=node.matches(':hover')?C.mix(p.raised,p.text,.12):node.matches('input,select,textarea')?p.inset:p.raised;
          if(!transparent(own)&&fill!==cs.backgroundColor)values['background-color']=fill;
          if(artwork&&/url\(/i.test(cs.backgroundImage)&&transparent(own)){const r=node.getBoundingClientRect();if(r.width<=250&&r.height<=120)values['background-color']=native;}
          if(node===html||node===document.body||node.matches('main')){values['background-color']=p.bg;bg=p.bg;}
          else if(!transparent(own))bg=C.effectiveBackground(fill,parentBg);
          const image=icon?iconImage(cs.backgroundImage,p.text):artwork?cs.backgroundImage:gradient(cs.backgroundImage,p,t);
          if(image!==cs.backgroundImage)values['background-image']=image;
          // A repeated canvas texture (e.g. eBay's imgbg.jpg) is page chrome.
          // Blend it with the palette; keep its URL and all content images intact.
          if((node===html||node===document.body)&&/url\(/i.test(cs.backgroundImage)&&/repeat/.test(cs.backgroundRepeat)&&cs.backgroundSize==='auto')values['background-blend-mode']='multiply';
          if(!artwork){const paint=shadow(cs.boxShadow,p,t);if(paint!==cs.boxShadow)values['box-shadow']=paint;}
          // Text/controls blended into the page become unreadable on dark surfaces.
          if(cs.mixBlendMode!=='normal')values['mix-blend-mode']='normal';
          const paintsText=[...node.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())||node.matches('input,textarea,select,option');
          if(paintsText){
            const fg=artwork?cs.color:node.matches('a[href]')&&!semantic&&!inheritedSemantic?C.ensureContrast(p.accent,bg,t):(semantic||transparent(own)&&inheritedSemantic)?C.ensureContrast(cs.color,bg,t):C.foreground(cs.color,t,bg);
            values.color=fg;
            const webkit=cs.webkitTextFillColor;if(C.parse(webkit)?.a>0)values['-webkit-text-fill-color']=artwork?webkit:fg;
          }
          for(const property of ['border-top-color','border-right-color','border-bottom-color','border-left-color','outline-color']){
            const value=cs.getPropertyValue(property),color=C.parse(value);if(!artwork&&!transparent(color)&&neutral(color))values[property]=p.line;
          }
        }else if(!artwork&&node.getBoundingClientRect().width<=48&&node.getBoundingClientRect().height<=48){
          values.color=C.ensureContrast(p.text,bg,t,3);
          for(const prop of ['fill','stroke']){const color=C.parse(cs.getPropertyValue(prop));if(!transparent(color)&&neutral(color))values[prop]=C.ensureContrast(p.text,bg,t,3);}
        }
        // These Amazon control assets are monochrome image sprites, not media.
        // Invert only their own pixels when their themed parent is dark.
        if(node.matches('.ssf-share-trigger,i.a-icon-dropdown,i.a-icon-popover,i.a-icon-section-expand,i.a-icon-section-collapse,i.a-icon-map-marker')&&/url\(/i.test(cs.backgroundImage)&&C.luminance(C.parse(parentBg))<.5)values.filter=(cs.filter==='none'?'':cs.filter+' ')+'invert(1)';
        planned.set(node,bg);row.effective=bg;row.semantic=semantic||transparent(own)&&inheritedSemantic;semantics.set(node,row.semantic);
        // Retailer utility rules can contain IDs as well as !important. Keep the
        // override scoped, but give each painted node enough specificity to win.
        const target=node===html?scope:`${scope} :is(#exp-ward-paint,[${marker}="${row.id}"]):is(#exp-ward-paint,[${marker}="${row.id}"])`;
        let text=declarations(node,values,row),rules=text?`${target}{${text}}`:'';
        if(!isMedia&&!isSvg)for(const pseudo of ['::before','::after']){
          const pc=getComputedStyle(node,pseudo);if(pc.content==='none'||pc.content==='normal'||pc.display==='none')continue;
          const changed={},pb=artwork?pc.backgroundColor:surface(pc.backgroundColor,p,t),pi=artwork?pc.backgroundImage:gradient(pc.backgroundImage,p,t);
          if(pb!==pc.backgroundColor)changed['background-color']=pb;
          if(pi!==pc.backgroundImage)changed['background-image']=pi;
          if(!artwork){const paint=shadow(pc.boxShadow,p,t);if(paint!==pc.boxShadow)changed['box-shadow']=paint;}
          if(!artwork&&pc.color!==cs.color)changed.color=C.foreground(pc.color,t,C.effectiveBackground(pb,bg));
          if(!artwork)for(const property of ['border-top-color','border-right-color','border-bottom-color','border-left-color']){const color=C.parse(pc.getPropertyValue(property));if(!transparent(color)&&neutral(color))changed[property]=p.line;}
          if(Object.keys(changed).length)rules+=`${target}${pseudo}{${Object.entries(changed).map(([k,v])=>k+':'+v+'!important').join(';')}}`;
        }
        row.css=rules;writes.push([node,row]);
      }
      for(const [node,row]of records)if(!node.isConnected){restore(node,row);records.delete(node);}
      // All geometry/color reads finish before DOM writes, to avoid read/write layout thrashing.
      for(const [node,row]of writes){if(node.getAttribute(marker)!==row.id)node.setAttribute(marker,row.id);for(const [property,entry]of row.inline)if(node.style.getPropertyValue(property)!==entry.patched)node.style.setProperty(property,entry.patched,'important');}
      stats.passes++;stats.nodes=writes.length;
      return `${scope}{color-scheme:${p.id==='obsidian'?'dark':p.mode};background-color:${p.bg}!important;color:${p.text}!important}${scope} body{background-color:${p.bg}!important;color:${p.text}!important}${scope} ::selection{background:${p.line};color:${p.text}}${[...records.values()].map(r=>r.css).join('')}`;
    }finally{if(saved==='ward')html.setAttribute('data-exp-site-colors',saved);rendering=false;stats.lastMs=Math.round(performance.now()-start);stats.maxMs=Math.max(stats.maxMs,stats.lastMs);}
  }
  function schedule(event){
    if(timer||!listening)return;
    if(event?.type==='load'&&!event.target?.matches?.('link[rel~="stylesheet"],img'))return;
    timer=setTimeout(()=>{timer=0;if(listening)apply();},80);
  }
  const events=['scroll','resize','pointerover','pointerout','focusin','focusout','load'];
  const controller=()=>colors??=ExtraPotionsCore.createSiteColors({product:'ward',extra,css:render,inject:(text,data)=>EXP.Core.injectStyle(document,text,data)});
  function clear(){
    listening=false;clearTimeout(timer);timer=0;for(const event of events)document.removeEventListener(event,schedule,true);
    observer?.disconnect();observer=null;removeEventListener('resize',schedule);colors?.clear();for(const [node,row]of records)restore(node,row);records.clear();key='';
  }
  function apply(settings=EXP.Settings.snapshot(),changed=[document]){
    if(!settings.enabled||settings.siteColors==='off'||settings.safeMode||!EXP.Retailer.enabled(settings)||ExtraPotionsCore.suiteSitePaused()){clear();return;}
    roots=changed;
    controller().apply(settings.siteColors);
    if(!listening){listening=true;addEventListener('resize',schedule,{passive:true});for(const event of events)document.addEventListener(event,schedule,{capture:true,passive:true});observer=new MutationObserver(items=>{if(items.some(m=>!m.target.closest?.(owned)))schedule();});observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','style','hidden','open','disabled']});}
  }
  const choices=()=>[['off','Off'],...[...extra,...ExtraPotionsCore.sitePalettes].map(p=>[p.id,p.name])];
  return Object.freeze({apply,clear,choices,ids:()=>choices().map(([id])=>id),health:()=>({...stats,records:records.size})});
})();
