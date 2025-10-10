/* cm-router.v1.js - SPA Router System */

(function(){
  'use strict';

/* 1 - Yapılandırma -------------------------------------------------------- */
  var ROUTES = {
    '': 'home',           // Ana sayfa (video grid)
    'home': 'home',
    'coach': 'coach',
    'rook': 'rook',
    'bishop': 'bishop',
    'queen': 'queen',
    'knight': 'knight'
  };

  var CONTENT_PATHS = {
    home: '/wp-content/uploads/anasayfa/modes/home.html',
    coach: '/wp-content/uploads/anasayfa/modes/coach.html',
    rook: '/wp-content/uploads/anasayfa/modes/rook.html',
    bishop: '/wp-content/uploads/anasayfa/modes/bishop.html',
    queen: '/wp-content/uploads/anasayfa/modes/queen.html',
    knight: '/wp-content/uploads/anasayfa/modes/knight.html'
  };

  var currentRoute = null;
  var contentContainer = null;
/* Bölüm sonu --------------------------------------------------------------- */

/* 2 - Yardımcı fonksiyonlar ----------------------------------------------- */
  function $(sel, el){ return (el||document).querySelector(sel); }
  function ce(tag, cls){ var e=document.createElement(tag); if(cls) e.className=cls; return e; }
  
  function getHash(){
    var h = location.hash.slice(1);
    return h.split('?')[0]; // Query parametrelerini kaldır
  }
  
  function setHash(route){
    var lang = localStorage.getItem('cm-lang') || 'en';
    location.hash = route ? route + '?lang=' + lang : '';
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 3 - Content container oluşturma ----------------------------------------- */
  function ensureContainer(){
    if(contentContainer) return contentContainer;
    
    var root = $('#cm-root');
    if(!root) return null;
    
    // Header'ı bul (zaten cm-site.js tarafından oluşturulmuş)
    var header = $('.cm-nav', root);
    if(!header){
      console.error('Header not found!');
      return null;
    }
    
    // Content container'ı oluştur
    contentContainer = ce('div', 'cm-content-container');
    contentContainer.id = 'cm-content';
    contentContainer.setAttribute('role', 'main');
    
    // Header'dan sonra ekle
    if(header.nextSibling){
      root.insertBefore(contentContainer, header.nextSibling);
    } else {
      root.appendChild(contentContainer);
    }
    
    return contentContainer;
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 4 - Content temizleme --------------------------------------------------- */
  function clearContent(){
    if(!contentContainer) return;
    
    // Tüm dinamik script'leri temizle
    var scripts = document.querySelectorAll('script[data-dynamic]');
    scripts.forEach(function(s){ 
      if(s.parentNode) s.parentNode.removeChild(s); 
    });
    
    // Tüm dinamik style'ları temizle
    var styles = document.querySelectorAll('link[data-dynamic], style[data-dynamic]');
    styles.forEach(function(s){ 
      if(s.parentNode) s.parentNode.removeChild(s); 
    });
    
    // Content'i temizle
    contentContainer.innerHTML = '';
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 5 - HTML içerik yükleme ------------------------------------------------- */
  function loadContent(route, callback){
    var path = CONTENT_PATHS[route];
    if(!path){
      console.error('Route not found:', route);
      if(callback) callback(new Error('Route not found'));
      return;
    }
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', path + '?v=' + Date.now(), true);
    xhr.onreadystatechange = function(){
      if(xhr.readyState === 4){
        if(xhr.status === 200){
          if(callback) callback(null, xhr.responseText);
        } else {
          console.error('Failed to load:', path, xhr.status);
          if(callback) callback(new Error('Load failed: ' + xhr.status));
        }
      }
    };
    xhr.send();
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 6 - HTML parse ve inject ------------------------------------------------ */
  function injectContent(html){
    if(!contentContainer) return;
    
    var temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Header ve Footer'ı kaldır (sadece main içeriği al)
    var header = temp.querySelector('header');
    var footer = temp.querySelector('footer');
    if(header && header.parentNode) header.parentNode.removeChild(header);
    if(footer && footer.parentNode) footer.parentNode.removeChild(footer);
    
    // Style'ları head'e taşı
    var links = temp.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(function(link){
      if(!document.querySelector('link[href="' + link.href + '"]')){
        link.setAttribute('data-dynamic', 'true');
        document.head.appendChild(link);
      }
    });
    
    var styles = temp.querySelectorAll('style');
    styles.forEach(function(style){
      style.setAttribute('data-dynamic', 'true');
      document.head.appendChild(style);
    });
    
    // Script'leri kaldır (sonra inject edeceğiz)
    var scripts = temp.querySelectorAll('script');
    var scriptContents = [];
    scripts.forEach(function(script){
      if(script.src){
        scriptContents.push({type: 'external', src: script.src});
      } else if(script.textContent.trim()){
        scriptContents.push({type: 'inline', content: script.textContent});
      }
      if(script.parentNode) script.parentNode.removeChild(script);
    });
    
    // Kalan HTML'i container'a ekle
    contentContainer.innerHTML = temp.innerHTML;
    
    // Script'leri sırayla inject et
    injectScripts(scriptContents);
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 7 - Script injection ---------------------------------------------------- */
  function injectScripts(scripts){
    if(!scripts || scripts.length === 0) return;
    
    function loadNext(index){
      if(index >= scripts.length) return;
      
      var item = scripts[index];
      var script = document.createElement('script');
      script.setAttribute('data-dynamic', 'true');
      
      if(item.type === 'external'){
        script.src = item.src;
        script.onload = function(){ loadNext(index + 1); };
        script.onerror = function(){ 
          console.error('Failed to load script:', item.src); 
          loadNext(index + 1); 
        };
        document.body.appendChild(script);
      } else {
        script.textContent = item.content;
        document.body.appendChild(script);
        setTimeout(function(){ loadNext(index + 1); }, 10);
      }
    }
    
    loadNext(0);
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 8 - Route handler ------------------------------------------------------- */
  function handleRoute(){
    var hash = getHash();
    var route = ROUTES[hash] || 'home';
    
    // Aynı route'a tekrar gelirse skip
    if(route === currentRoute) return;
    
    console.log('Navigating to:', route);
    currentRoute = route;
    
    // Container'ı hazırla
    if(!ensureContainer()){
      console.error('Failed to create content container');
      return;
    }
    
    // Loading state
    contentContainer.innerHTML = '<div class="cm-loading">Loading...</div>';
    
    // Home için özel durum (zaten yüklenmiş içerik)
    if(route === 'home'){
      clearContent();
      
      // cm-site.js'in oluşturduğu içeriği göster
      var hero = $('.cm-hero');
      var videos = $('#videos');
      var footer = $('.cm-footer');
      
      if(hero && videos && footer){
        contentContainer.appendChild(hero);
        contentContainer.appendChild(videos);
        contentContainer.appendChild(footer);
        
        // Video yükleme tetikle (eğer henüz yüklenmediyse)
        if(window.loadAndRender){
          window.loadAndRender();
        }
      }
      return;
    }
    
    // Diğer mode'lar için HTML yükle
    loadContent(route, function(err, html){
      if(err){
        contentContainer.innerHTML = '<div class="cm-error">Failed to load content. <button onclick="location.reload()">Retry</button></div>';
        return;
      }
      
      clearContent();
      injectContent(html);
    });
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 9 - Drawer link güncelleme ---------------------------------------------- */
  function updateDrawerLinks(){
    // Drawer içindeki linkleri hash-based'e çevir
    var drawerLinks = document.querySelectorAll('.cm-drawer-link');
    drawerLinks.forEach(function(link){
      var href = link.getAttribute('href');
      if(!href) return;
      
      // External URL'leri hash'e çevir
      if(href.indexOf('chess-coach-mode') > -1){
        link.setAttribute('href', '#coach');
      } else if(href.indexOf('chess-rook-mode') > -1){
        link.setAttribute('href', '#rook');
      } else if(href.indexOf('chess-bishop-mode') > -1){
        link.setAttribute('href', '#bishop');
      } else if(href.indexOf('chess-queen-mode') > -1){
        link.setAttribute('href', '#queen');
      } else if(href.indexOf('chess-knight-mode') > -1){
        link.setAttribute('href', '#knight');
      } else if(href.indexOf('chessmate.ink/?') > -1 || href === '/'){
        link.setAttribute('href', '#home');
      }
      
      // Click event
      link.addEventListener('click', function(e){
        e.preventDefault();
        var hash = link.getAttribute('href').replace('#', '');
        setHash(hash);
        
        // Drawer'ı kapat
        var drawer = document.getElementById('cm-drawer');
        var overlay = document.getElementById('cm-drawer-overlay');
        if(drawer) drawer.classList.remove('active');
        if(overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 10 - Event listeners ---------------------------------------------------- */
  function setupRouter(){
    // Hash değişikliğini dinle
    window.addEventListener('hashchange', handleRoute);
    
    // Drawer oluşturulduğunda linkleri güncelle
    var observer = new MutationObserver(function(mutations){
      mutations.forEach(function(mutation){
        if(mutation.addedNodes.length){
          mutation.addedNodes.forEach(function(node){
            if(node.id === 'cm-drawer' || (node.classList && node.classList.contains('cm-drawer'))){
              setTimeout(updateDrawerLinks, 100);
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {childList: true, subtree: true});
    
    // İlk route'u handle et
    handleRoute();
  }
/* Bölüm sonu --------------------------------------------------------------- */

/* 11 - Başlatma ----------------------------------------------------------- */
  function init(){
    // cm-site.js'in hazır olmasını bekle
    if(!window.CM_READY){
      setTimeout(init, 100);
      return;
    }
    
    setupRouter();
    window.CM_ROUTER_READY = true;
    console.log('Router initialized');
  }
  
  // DOM hazır olduğunda başlat
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
/* Bölüm sonu --------------------------------------------------------------- */

})();
