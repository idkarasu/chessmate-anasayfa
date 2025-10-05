/* cm-extras.js – v2 */

(function(){
  'use strict';
  
/* 1 - Yapılandırma sabitleri ---------------------------------------------- */
  var DOCK_TOP_RATIO = 0.55;
  var OBS_THRESHOLD  = 0.60;
  var WATCH_PCT      = 0.80;
  var WATCH_KEY      = 'cm-watched';
/* Bölüm sonu --------------------------------------------------------------- */

/* 2 - Yardımcı fonksiyonlar ----------------------------------------------- */
  function $(s,el){return (el||document).querySelector(s)}
  function $all(s,el){return Array.prototype.slice.call((el||document).querySelectorAll(s))}
  function ce(t,c){var e=document.createElement(t); if(c) e.className=c; return e}
/* Bölüm sonu --------------------------------------------------------------- */

/* 3 - Global değişkenler -------------------------------------------------- */
  var players = {};
  var progById = {};
  var dismissedVid = null;
  var currentIframe = null;
  var docked = null;
  var io = null;
  var apiReady = !!(window.YT && window.YT.Player);
/* Bölüm sonu --------------------------------------------------------------- */

/* 4 - YouTube API yükleme ------------------------------------------------- */
  if(!document.querySelector('script[src*="youtube.com/iframe_api"]')){
    var ap=document.createElement('script'); ap.src='https://www.youtube.com/iframe_api'; ap.async=true; document.head.appendChild(ap);
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 5 - Mini player CSS enjeksiyonu ----------------------------------------- */
  function injectMiniCssIfMissing(){
    var mini=document.getElementById('cm-mini');
    var need=!mini || getComputedStyle(mini).position==='static';
    if(!need) return;
    var css=[
      '#cm-mini{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:calc(84px + env(safe-area-inset-bottom));',
      'width:clamp(320px,40vw,520px);aspect-ratio:16/9;background:#000;border:1px solid var(--line);',
      'border-radius:12px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.35);opacity:0;pointer-events:none;',
      'transform:scale(.96);transition:opacity .2s,transform .2s;z-index:10000}',
      '#cm-mini.show{opacity:1;pointer-events:auto;transform:scale(1)}',
      '#cm-mini .cm-mini-inner{position:relative;width:100%;height:100%;z-index:1}',
      '#cm-mini iframe{position:absolute;inset:0;width:100%!important;height:100%!important;border:0;border-radius:0!important;z-index:1}',
      '.cm-docked{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border-radius:0!important}',
      '#cm-mini .cm-mini-close{position:absolute;top:8px;right:8px;width:36px;height:36px;border-radius:9999px;',
      'background:var(--panel,#14171b);color:var(--text,#fff);border:1px solid var(--line,#232831);',
      'display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;line-height:1;',
      'z-index:2147483647;pointer-events:auto}',
      '#cm-mini .cm-mini-close::before{content:"✕"}',
      '#cm-mini .cm-mini-close:hover{background:#FFD700;color:#000}',
      (window.CM_FORCE_MINI?'@media (max-width:768px){#cm-mini{display:block!important}}':'@media (max-width:768px){#cm-mini{display:none!important}}')
    ].join('');
    var tag=ce('style'); tag.id='cm-mini-fallback-css'; tag.textContent=css; document.head.appendChild(tag);
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 6 - Video ID ve API parametreleri --------------------------------------- */
  function getVid(ifr){
    if(!ifr) return '';
    var d=ifr.getAttribute('data-vid'); if(d) return d;
    try{ var u=new URL(ifr.src,location.href), p=u.pathname.split('/'), i=p.indexOf('embed'); return i>-1?p[i+1]:''; }
    catch(_){ return '' }
  }
  function ensureApiParams(ifr){
    if(!ifr || !ifr.src) return;
    try{
      var u=new URL(ifr.src,location.href);
      u.searchParams.set('enablejsapi','1'); u.searchParams.set('playsinline','1'); u.searchParams.set('rel','0');
      try{u.searchParams.set('origin',location.origin)}catch(_){}
      if(ifr.src!==u.toString()) ifr.src=u.toString();
    }catch(_){}
    if(!ifr.id) ifr.id='yt-'+Math.random().toString(36).slice(2);
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 7 - İzlenmiş video yönetimi --------------------------------------------- */
  function getWatched(){ try{return JSON.parse(localStorage.getItem(WATCH_KEY)||'[]')}catch(_){return[]} }
  function saveWatched(a){ try{localStorage.setItem(WATCH_KEY,JSON.stringify(a))}catch(_){ } }
  function addWatched(v){ if(!v) return; var a=getWatched(); if(a.indexOf(v)===-1){a.push(v); saveWatched(a)}; $all('.cm-thumb iframe[data-vid="'+v+'"]').forEach(function(f){var c=f.closest?f.closest('.cm-card'):f.parentNode; if(c) c.classList.add('watched')}) }
  function applyWatched(){ var s=getWatched(); $all('.cm-thumb iframe').forEach(function(f){ if(s.indexOf(getVid(f))>-1){ var c=f.closest?f.closest('.cm-card'):f.parentNode; if(c) c.classList.add('watched') } }) }
  function isPlaying(){ for(var k in players){ try{ if(players[k].getPlayerState()===YT.PlayerState.PLAYING) return true }catch(_){}} return false }
/* Bölüm sonu --------------------------------------------------------------- */

/* 8 - İzlenme ilerlemesi takibi ------------------------------------------- */
  function startProg(id,p){
    stopProg(id);
    progById[id]=setInterval(function(){
      try{
        var d=p.getDuration?p.getDuration():0, c=p.getCurrentTime?p.getCurrentTime():0;
        if(d>0 && c/d>=WATCH_PCT){ var f=document.getElementById(id); addWatched(getVid(f)); stopProg(id) }
      }catch(_){}
    },1500);
  }
  function stopProg(id){ var t=progById[id]; if(t){clearInterval(t); delete progById[id]} }
/* Bölüm sonu --------------------------------------------------------------- */

/* 9 - Mini player yapısı -------------------------------------------------- */
  function ensureMiniAndBack(){
    var root=document.getElementById('cm-root')||document.body;
    if(!document.getElementById('cm-mini')){
      var mini=ce('div'); mini.id='cm-mini';
      mini.innerHTML='<div class="cm-mini-inner"></div>';
      root.appendChild(mini);
      var btn=ce('button','cm-mini-close'); btn.type='button'; btn.setAttribute('aria-label','Kapat');
      mini.appendChild(btn);
      btn.addEventListener('click', function(ev){
        ev.stopPropagation();
        var ifr = mini.querySelector('iframe'), card = ifr && ifr.closest? ifr.closest('.cm-card'): null;
        if(ifr){
          dismissedVid=getVid(ifr); window.CM_DISMISSED_VID=dismissedVid;
          try{ var p=players[ifr.id]; p&&p.pauseVideo&&p.pauseVideo(); }catch(_){}
        }
        if(card && io){ try{ io.unobserve(card) }catch(_){} }
        undock(); currentIframe=null;
      });
      document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ var b=$('#cm-mini .cm-mini-close'); if(b) b.click(); }});
    }
    if(!document.getElementById('cm-backtop')){
      var b=ce('button'); b.id='cm-backtop'; b.title='Yukarı çık'; b.setAttribute('aria-label','Yukarı çık');
      b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m0 0l-6 6m6-6l6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      root.appendChild(b); b.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});
    }
    injectMiniCssIfMissing();
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 10 - Dock mantığı ------------------------------------------------------- */
  function shouldDock(el){
    var r=el.getBoundingClientRect(), vh=window.innerHeight||document.documentElement.clientHeight;
    return (r.top < vh*DOCK_TOP_RATIO) || (r.bottom <= 0);
  }
  function dock(ifr){
    if(dismissedVid && getVid(ifr)===dismissedVid) return;
    var mini=document.getElementById('cm-mini'); if(!mini) return;
    if(docked && docked.iframe===ifr) return;
    undock();
    var ph=ce('div'); ph.style.height=ifr.offsetHeight+'px'; ph.className='cm-iframe-ph';
    ifr.parentNode.insertBefore(ph,ifr);
    ifr.classList.add('cm-docked');
    $('.cm-mini-inner',mini).appendChild(ifr);
    mini.classList.add('show');
    docked={iframe:ifr,placeholder:ph};
  }
  function undock(){
    var mini=document.getElementById('cm-mini'); if(!mini||!docked) return;
    try{ docked.placeholder.replaceWith(docked.iframe) }catch(_){ }
    docked.iframe.classList.remove('cm-docked');
    mini.classList.remove('show'); docked=null;
  }
  function maybeDock(){
    if(!currentIframe) return;
    var v=getVid(currentIframe);
    if(dismissedVid && v===dismissedVid) return;
    var card=currentIframe.closest?currentIframe.closest('.cm-card'):null; if(!card) return;
    if(shouldDock(card)) dock(currentIframe); else undock();
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 11 - YouTube Player başlatma -------------------------------------------- */
  function initPlayers(){
    $all('.cm-thumb iframe').forEach(function(ifr){
      ensureApiParams(ifr);
      if(players[ifr.id]) return;
      try{
        players[ifr.id]=new YT.Player(ifr,{events:{
          'onStateChange':function(e){
            var f=e.target.getIframe?e.target.getIframe():ifr; if(!f) return;
            var vid=getVid(f), card=f.closest?f.closest('.cm-card'):null;
            if(e.data===YT.PlayerState.PLAYING){
              dismissedVid=null; window.CM_DISMISSED_VID=null;
              for(var k in players){ if(players[k]!==e.target){ try{players[k].pauseVideo()}catch(_){ } } }
              currentIframe=f; startProg(f.id,e.target);
              ensureObserverFor(card);
              maybeDock(); setTimeout(maybeDock,120);
            } else if(e.data===YT.PlayerState.PAUSED){
              stopProg(f.id); setTimeout(function(){ if(!isPlaying()) undock() }, 120);
            } else if(e.data===YT.PlayerState.ENDED){
              stopProg(f.id); addWatched(vid);
              if(io && card) try{ io.unobserve(card) }catch(_){}
              dismissedVid=null; window.CM_DISMISSED_VID=null;
              undock(); if(currentIframe===f) currentIframe=null;
            }
          }
        }});
      }catch(_){}
    });
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 12 - Intersection Observer ---------------------------------------------- */
  function ensureObserverFor(card){
    if(!card) return;
    if(!io){
      io=new IntersectionObserver(function(entries){
        entries.forEach(function(ent){
          if(!currentIframe) return;
          if(dismissedVid && getVid(currentIframe)===dismissedVid) return;
          var c=currentIframe.closest?currentIframe.closest('.cm-card'):null;
          if(c && ent.target===c){
            if(ent.intersectionRatio<OBS_THRESHOLD) dock(currentIframe); else undock();
          }
        });
      },{threshold:[0, OBS_THRESHOLD, 1]});
    }
    try{ io.observe(card) }catch(_){}
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 13 - DOM ve scroll olayları --------------------------------------------- */
  function observeGrids(){ $all('.cm-vgrid').forEach(function(g){ new MutationObserver(function(){ wireAll() }).observe(g,{childList:true}) }) }
  function onScroll(){ if(currentIframe) maybeDock(); var bt=document.getElementById('cm-backtop'); if(bt) bt.classList.toggle('show', window.scrollY>400) }
/* Bölüm sonu --------------------------------------------------------------- */

/* 14 - API hazırlık ve polling -------------------------------------------- */
  var prior=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=function(){ apiReady=true; if(typeof prior==='function'){try{prior()}catch(_){}} initPlayers() };
  if(apiReady) setTimeout(initPlayers,0);
  var poll=setInterval(function(){ if(window.YT && window.YT.Player){ clearInterval(poll); apiReady=true; initPlayers(); } },400);
/* Bölüm sonu --------------------------------------------------------------- */

/* 15 - Ana başlatma sistemi ----------------------------------------------- */
  function wireAll(){
    ensureMiniAndBack(); applyWatched();
    $all('.cm-thumb iframe').forEach(ensureApiParams);
    if(window.YT && window.YT.Player) initPlayers();
  }
  function kickoff(){
    if(window.CM_READY){
      wireAll(); observeGrids();
      window.addEventListener('scroll', onScroll, {passive:true});
      window.addEventListener('resize', onScroll);
    } else setTimeout(kickoff,120);
  }
  kickoff();
/* Bölüm sonu --------------------------------------------------------------- */

})();
