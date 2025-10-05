/* cm-site.js — v4 */

(function(){
  'use strict';

/* 1 - Yardımcı fonksiyonlar ----------------------------------------------- */
  function $(sel, el){ return (el||document).querySelector(sel); }
  function $all(sel, el){ return Array.prototype.slice.call((el||document).querySelectorAll(sel)); }
  function ce(tag, cls){ var e=document.createElement(tag); if(cls) e.className=cls; return e; }
/* Bölüm sonu --------------------------------------------------------------- */

/* 2 - Yapılandırma ve metin sabitleri ------------------------------------- */
  var CFG = window.CM_CONFIG || {};
  var COPY = {
    en:{ title:"Everything about chess", sub:"Rules, piece moves, strategy and chess history – clear, multilingual, well-structured lessons.", cta:"Play", search:"Search videos..." },
    tr:{ title:"Satranç hakkında her şey", sub:"Kurallar, taşların hareketleri, strateji ve satranç tarihi – sade, çok dilli ve düzenli derslerle.", cta:"Oyna", search:"Videolarda ara..." },
    de:{ title:"Alles über Schach", sub:"Regeln, Figurenbewegungen, Strategie und Schachgeschichte – klar, mehrsprachig, in geordneten Lektionen.", cta:"Spielen", search:"Videos durchsuchen..." }
  };
/* Bölüm sonu --------------------------------------------------------------- */

/* 3 - Tema yönetimi ------------------------------------------------------- */
  function setupTheme(btn){
    function apply(theme){
      var root=document.documentElement;
      if(theme){ root.setAttribute('data-theme', theme); }
      else{ root.removeAttribute('data-theme'); }
    }
    var saved = localStorage.getItem('cm-theme');
    apply(saved);
    btn.onclick = function(){
      var cur = localStorage.getItem('cm-theme');
      var next = cur==='light' ? 'dark' : (cur==='dark' ? null : 'light');
      if(next) localStorage.setItem('cm-theme', next); else localStorage.removeItem('cm-theme');
      apply(next);
    };
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 4 - Sayfa yapısı oluşturma ---------------------------------------------- */
  function buildShell(root){
    var header = ce('header','cm-nav');
    header.innerHTML =
      '<div class="cm-container cm-nav-inner">'+
        '<div class="cm-brand">'+
          '<img src="'+(CFG.logo||'')+'" alt="ChessMate.ink logo" class="cm-logo-img"/>'+
          '<span>ChessMate.ink</span>'+
        '</div>'+
        '<nav class="cm-menu" aria-label="Primary">'+
          '<div class="cm-lang">'+
            '<a href="?lang=en#videos" data-lang="en" class="cm-flag" title="English" aria-label="Switch to English"><img src="https://flagcdn.com/gb.svg" alt="English flag" loading="lazy"></a>'+
            '<a href="?lang=tr#videos" data-lang="tr" class="cm-flag" title="Türkçe" aria-label="Türkçe\'ye geç"><img src="https://flagcdn.com/tr.svg" alt="Türkiye bayrağı" loading="lazy"></a>'+
            '<a href="?lang=de#videos" data-lang="de" class="cm-flag" title="Deutsch" aria-label="Zu Deutsch wechseln"><img src="https://flagcdn.com/de.svg" alt="Deutschland-Flagge" loading="lazy"></a>'+
          '</div>'+
          '<button id="cm-theme-toggle" class="cm-theme-toggle" title="Tema" aria-label="Tema">☼/☾</button>'+
          '<a id="cm-play-cta" class="cm-cta" href="/play/" target="_blank" rel="noopener">Play</a>'+
        '</nav>'+
      '</div>';
    root.appendChild(header);

    var hero = ce('div','cm-hero');
    hero.innerHTML =
      '<div class="cm-container cm-hero-inner">'+
        '<span class="cm-eyebrow">♟ Chess • EN / TR / DE</span>'+
        '<h1 id="cm-hero-title" class="cm-h1">Everything about chess</h1>'+
        '<p id="cm-hero-sub" class="cm-hero-sub">Kurallar, taşların hareketleri, strateji ve satranç tarihi – sade, çok dilli ve düzenli derslerle.</p>'+
      '</div>';
    root.appendChild(hero);

    var wrap = ce('div'); wrap.id='videos'; wrap.className='cm-container';
    wrap.setAttribute('role','region'); wrap.setAttribute('aria-label','Video Dersleri (EN/TR/DE)');
    wrap.innerHTML =
      '<div class="cm-searchbar"><input id="cm-search" class="cm-search" type="search" placeholder="Search videos..." autocomplete="off"></div>'+
      '<input type="radio" id="cm-en" name="cm-lang" checked>'+
      '<input type="radio" id="cm-tr" name="cm-lang">'+
      '<input type="radio" id="cm-de" name="cm-lang">'+
      '<div class="cm-tabs">'+
        '<div class="cm-tabbar" role="tablist" aria-label="Diller">'+
          '<label for="cm-en" role="tab" aria-controls="panel-en" aria-selected="true">English</label>'+
          '<label for="cm-tr" role="tab" aria-controls="panel-tr" aria-selected="false">Türkçe</label>'+
          '<label for="cm-de" role="tab" aria-controls="panel-de" aria-selected="false">Deutsch</label>'+
        '</div>'+
        '<div id="panel-en" class="cm-tabpanel tab-en" role="tabpanel" aria-labelledby="cm-en"><div class="cm-vgrid" data-lang="en"></div></div>'+
        '<div id="panel-tr" class="cm-tabpanel tab-tr" role="tabpanel" aria-labelledby="cm-tr"><div class="cm-vgrid" data-lang="tr"></div></div>'+
        '<div id="panel-de" class="cm-tabpanel tab-de" role="tabpanel" aria-labelledby="cm-de"><div class="cm-vgrid" data-lang="de"></div></div>'+
      '</div>';
    root.appendChild(wrap);

    var footer = ce('footer','cm-footer'); footer.id='contact';
    footer.innerHTML =
      '<div class="cm-container">'+
        '<div class="cm-social">'+
          '<a class="cm-ico" href="https://www.instagram.com/chessmate.ink/" target="_blank" rel="noopener" title="Instagram"><span class="cm-sr-only">Instagram</span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg></a>'+
          '<a class="cm-ico" href="https://www.tiktok.com/@chessmate.ink" target="_blank" rel="noopener" title="TikTok"><span class="cm-sr-only">TikTok</span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 8.1a6.8 6.8 0 0 1-4-1.3v7.4a5.7 5.7 0 1 1-5.7-5.7c.4 0 .7 0 1 .1v2.5A3.2 3.2 0 1 0 11 16V2h2a6.8 6.8 0 0 0 4 4.1c.6.3 1.3.5 2 .6v2.2c-.7-.1-1.4-.3-2-.6z"/></svg></a>'+
          '<a class="cm-ico cm-yt-footer" href="https://www.youtube.com/@ChessMate-ink" target="_blank" rel="noopener" title="YouTube"><span class="cm-sr-only">YouTube</span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a4 4 0 0 0-2.8-2.8C18.5 4 12 4 12 4s-6.5 0-8.2.4A4 4 0 0 0 1 7.2 41.6 41.6 0 0 0 0 12a41.6 41.6 0 0 0 1 4.8 4 4 0 0 0 2.8 2.8C5.5 20 12 20 12 20s6.5 0 8.2-.4A4 4 0 0 0 23 16.8 41.6 41.6 0 0 0 24 12a41.6 41.6 0 0 0-1-4.8zM9.7 15.3V8.7L15.8 12l-6.1 3.3z"/></svg></a>'+
          '<a class="cm-ico" href="mailto:Chessmate.ink@gmail.com" title="E-posta"><span class="cm-sr-only">E-posta</span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 5h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm1.6 2 8.4 6 8.4-6H3.6zm18.8 1.7-8.9 6.3a2 2 0 0 1-2.4 0L2.2 8.7V17h20.2V8.7z"/></svg></a>'+
        '</div>'+
        '<p class="cm-copy">© ChessMate.ink – Everything About Chess.</p>'+
      '</div>';
    root.appendChild(footer);

    setupTheme($('#cm-theme-toggle', header));
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 5 - Dil yönetimi -------------------------------------------------------- */
  function applyLang(lc){
    var l = COPY[lc] ? lc : 'en';
    var H1 = $('#cm-hero-title'), SUB=$('#cm-hero-sub'), PLAY=$('#cm-play-cta'), SEARCH=$('#cm-search');
    if(H1) H1.textContent = COPY[l].title;
    if(SUB) SUB.textContent = COPY[l].sub;
    if(PLAY){ PLAY.textContent = COPY[l].cta; PLAY.href = (CFG.playUrl||'/play/') + '?lang='+l; }
    if(SEARCH){ SEARCH.placeholder = COPY[l].search; }
    var yt = $('.cm-yt-footer'); if(yt && CFG.channels && CFG.channels[l]) yt.href = CFG.channels[l];

    document.documentElement.setAttribute('lang', l);
    $all('.cm-lang .cm-flag').forEach(function(a){
      a.classList.toggle('active', a.getAttribute('data-lang')===l);
    });
    localStorage.setItem('cm-lang', l);
    var url = new URL(location.href); url.searchParams.set('lang', l); history.replaceState(null,"",url.toString());
    var r = $('#cm-'+l); if(r) r.checked = true;

    var s = $('#cm-search'); if(s){ s.value=''; filterCards(''); }
  }

  function activeLang(){
    if($('#cm-en') && $('#cm-en').checked) return 'en';
    if($('#cm-tr') && $('#cm-tr').checked) return 'tr';
    if($('#cm-de') && $('#cm-de').checked) return 'de';
    return 'en';
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 6 - Arama filtresi ------------------------------------------------------ */
  function filterCards(q){
    var lang = activeLang();
    var grid = document.querySelector('.cm-vgrid[data-lang="'+lang+'"]');
    if(!grid) return;
    var term = (q||'').toLowerCase();
    $all('.cm-card', grid).forEach(function(card){
      var text = (card.innerText||'').toLowerCase();
      card.style.display = term && text.indexOf(term)===-1 ? 'none' : '';
    });
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 7 - Kart HTML üretimi --------------------------------------------------- */
  function esc(s){ 
    return (s||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function cardHTML(v){
    var src = 'https://www.youtube-nocookie.com/embed/'+v.id+'?modestbranding=1&rel=0';
    return ''+
      '<article class="cm-card">'+
        '<div class="cm-thumb"><iframe loading="lazy" src="'+src+'" data-vid="'+v.id+'" title="'+esc(v.title)+'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>'+
        '<div class="cm-body"><h3>'+esc(v.title)+'</h3><p>'+(esc(v.desc||''))+'</p></div>'+
      '</article>';
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 8 - JSON yükleme -------------------------------------------------------- */
  function loadJSON(url, cb){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function(){
      if(xhr.readyState===4){
        try{ cb(null, JSON.parse(xhr.responseText)); }
        catch(e){ cb(e); }
      }
    };
    xhr.send();
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 9 - Video yükleme ve render --------------------------------------------- */
  function loadAndRender(){
    var map = CFG.videosByLang;
    if(!map){ return; }
    var langs = ['en','tr','de'];
    langs.forEach(function(l){
      var grid = document.querySelector('.cm-vgrid[data-lang="'+l+'"]');
      if(!grid) return;
      
      grid.innerHTML = '<div class="cm-loading">Loading videos...</div>';
      
      loadJSON(map[l], function(err, arr){
        if(err){ 
          console.error('JSON load error for', l, err);
          grid.innerHTML = '<div class="cm-error">Failed to load videos. <button onclick="location.reload()">Retry</button></div>';
          return; 
        }
        var html = (arr||[]).map(cardHTML).join('');
        grid.innerHTML = html;
      });
    });
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 10 - Başlatma ----------------------------------------------------------- */
  function init(){
    if(CFG.pageId){ document.body.classList.add('page-id-'+CFG.pageId); }
    var root = document.getElementById('cm-root');
    buildShell(root);

    var EN=$('#cm-en'), TR=$('#cm-tr'), DE=$('#cm-de');
    ;[EN,TR,DE].forEach(function(r){
      if(!r) return;
      r.addEventListener('change', function(){
        var l = r.id.replace('cm-','');
        applyLang(l);
      });
    });
    $all('.cm-lang .cm-flag').forEach(function(a){
      a.addEventListener('click', function(e){
        e.preventDefault();
        applyLang((a.getAttribute('data-lang')||'en').toLowerCase());
      });
    });

    var initLang = (new URLSearchParams(location.search).get('lang') || localStorage.getItem('cm-lang') || (CFG.defaultLang||'en')).toLowerCase();
    applyLang(initLang);

    $('#cm-search').addEventListener('input', function(e){ filterCards(e.target.value); });

    loadAndRender();

    window.CM_READY = true;
  }

  try{ init(); }catch(err){ console.error('init error', err); }
/* Bölüm sonu --------------------------------------------------------------- */

})();

/* 11 - Play CTA yerleştirme ----------------------------------------------- */
(function movePlayToHero(){
  function run(){
    var heroInner=document.querySelector('.cm-hero-inner');
    var eyebrow=document.querySelector('.cm-eyebrow');
    var play=document.getElementById('cm-play-cta');
    if(!heroInner||!eyebrow||!play) return false;
    var row=document.querySelector('.cm-hero-row');
    if(!row){ row=document.createElement('div'); row.className='cm-hero-row'; heroInner.insertBefore(row,eyebrow); }
    row.appendChild(eyebrow); row.appendChild(play); play.classList.add('cm-cta--eyebrow');
    return true;
  }
  if(!run()){
    var tries=0, t=setInterval(function(){ if(run()||++tries>20) clearInterval(t); },150);
  }
})();
/* Bölüm sonu --------------------------------------------------------------- */
