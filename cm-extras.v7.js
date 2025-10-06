/* cm-extras.js – v7 */

(function(){
  'use strict';
  
/* 1 - Yapılandırma sabitleri ---------------------------------------------- */
  var WATCH_PCT = 0.80;
  var WATCH_KEY = 'cm-watched';
/* Bölüm sonu --------------------------------------------------------------- */

/* 2 - Yardımcı fonksiyonlar ----------------------------------------------- */
  function $(s,el){return (el||document).querySelector(s)}
  function $all(s,el){return Array.prototype.slice.call((el||document).querySelectorAll(s))}
  function ce(t,c){var e=document.createElement(t); if(c) e.className=c; return e}
/* Bölüm sonu --------------------------------------------------------------- */

/* 3 - Global değişkenler -------------------------------------------------- */
  var players = {};
  var progById = {};
  var apiReady = !!(window.YT && window.YT.Player);
  var gridObservers = [];
  var pageVisible = !document.hidden;
/* Bölüm sonu --------------------------------------------------------------- */

/* 4 - YouTube API yükleme ------------------------------------------------- */
  if(!document.querySelector('script[src*="youtube.com/iframe_api"]')){
    var ap=document.createElement('script'); ap.src='https://www.youtube.com/iframe_api'; ap.async=true; document.head.appendChild(ap);
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 5 - Video ID ve API parametreleri --------------------------------------- */
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

/* 6 - İzlenmiş video yönetimi --------------------------------------------- */
  function getWatched(){ try{return JSON.parse(localStorage.getItem(WATCH_KEY)||'[]')}catch(_){return[]} }
  function saveWatched(a){ try{localStorage.setItem(WATCH_KEY,JSON.stringify(a))}catch(_){ } }
  function addWatched(v){ if(!v) return; var a=getWatched(); if(a.indexOf(v)===-1){a.push(v); saveWatched(a)}; $all('.cm-thumb iframe[data-vid="'+v+'"]').forEach(function(f){var c=f.closest?f.closest('.cm-card'):f.parentNode; if(c) c.classList.add('watched')}) }
  function applyWatched(){ var s=getWatched(); $all('.cm-thumb iframe').forEach(function(f){ if(s.indexOf(getVid(f))>-1){ var c=f.closest?f.closest('.cm-card'):f.parentNode; if(c) c.classList.add('watched') } }) }
/* Bölüm sonu --------------------------------------------------------------- */

/* 7 - İzlenme ilerlemesi takibi ------------------------------------------- */
  function startProg(id,p){
    stopProg(id);
    progById[id]=setInterval(function(){
      if(!pageVisible) return;
      try{
        var d=p.getDuration?p.getDuration():0, c=p.getCurrentTime?p.getCurrentTime():0;
        if(d>0 && c/d>=WATCH_PCT){ var f=document.getElementById(id); addWatched(getVid(f)); stopProg(id) }
      }catch(_){}
    },1500);
  }
  function stopProg(id){ var t=progById[id]; if(t){clearInterval(t); delete progById[id]} }
/* Bölüm sonu --------------------------------------------------------------- */

/* 8 - Page Visibility API ------------------------------------------------- */
  document.addEventListener('visibilitychange', function(){
    pageVisible = !document.hidden;
    if(!pageVisible){
      for(var id in progById){ stopProg(id); }
    }
  });
/* Bölüm sonu --------------------------------------------------------------- */

/* 9 - Back to top butonu -------------------------------------------------- */
  function ensureBackTop(){
    var root=document.getElementById('cm-root')||document.body;
    if(!document.getElementById('cm-backtop')){
      var b=ce('button'); b.id='cm-backtop'; b.title='Yukarı çık'; b.setAttribute('aria-label','Yukarı çık');
      b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m0 0l-6 6m6-6l6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      root.appendChild(b); b.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});
    }
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 10 - YouTube Player başlatma -------------------------------------------- */
  function initPlayers(){
    $all('.cm-thumb iframe').forEach(function(ifr){
      ensureApiParams(ifr);
      if(players[ifr.id]) return;
      try{
        players[ifr.id]=new YT.Player(ifr,{events:{
          'onStateChange':function(e){
            var f=e.target.getIframe?e.target.getIframe():ifr; if(!f) return;
            var vid=getVid(f);
            if(e.data===YT.PlayerState.PLAYING){
              for(var k in players){ if(players[k]!==e.target){ try{players[k].pauseVideo()}catch(_){ } } }
              startProg(f.id,e.target);
            } else if(e.data===YT.PlayerState.PAUSED){
              stopProg(f.id);
            } else if(e.data===YT.PlayerState.ENDED){
              stopProg(f.id); addWatched(vid);
            }
          }
        }});
      }catch(_){}
    });
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 11 - DOM ve scroll olayları --------------------------------------------- */
  function observeGrids(){ 
    $all('.cm-vgrid').forEach(function(g){ 
      if(g.hasAttribute('data-observed')) return;
      var obs = new MutationObserver(function(){ wireAll() });
      obs.observe(g, {childList:true});
      gridObservers.push(obs);
      g.setAttribute('data-observed', 'true');
    }) 
  }
  function onScroll(){ var bt=document.getElementById('cm-backtop'); if(bt) bt.classList.toggle('show', window.scrollY>400) }
/* Bölüm sonu --------------------------------------------------------------- */

/* 12 - API hazırlık ve polling -------------------------------------------- */
  var prior=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=function(){ apiReady=true; if(typeof prior==='function'){try{prior()}catch(_){}} initPlayers() };
  if(apiReady) setTimeout(initPlayers,0);
  var poll, pollAttempts=0, MAX_POLL=50;
  poll=setInterval(function(){ 
    if(window.YT && window.YT.Player || ++pollAttempts>=MAX_POLL){ 
      clearInterval(poll); 
      if(window.YT && window.YT.Player){
        apiReady=true; 
        initPlayers();
      }
    } 
  },400);
/* Bölüm sonu --------------------------------------------------------------- */

/* 13 - Ana başlatma sistemi ----------------------------------------------- */
  function wireAll(){
    ensureBackTop(); applyWatched();
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
