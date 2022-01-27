const H_LAAD_ICON = '<div class="lds-roller"> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> </div>';

const NOOP = function() {};

function start(rootNode) {
  const node = rootNode || document.getElementById('main');
  node.innerHTML = H_LAAD_ICON + 'Bezig met laden';
  
  const hash = (document.location.hash || '').replace(/^#/, '').replace(/([a-z_]+)(.*?)$/, '$1');
  if (/^(demo_)?\w+$/.test(hash)) {
    loadPage(node, hash, function() {
      loadPage(node, 'homepage');
    });
  } else {
    loadPage(node, 'homepage');
  }
}

function enhance(rootNode) {
  rootNode.style.border = "solid 1px green";
  onEvent(rootNode.querySelectorAll('[data-page]'), 'click', onPageChange);
  applyAll(rootNode, 'data-widget', widget);
  applyAll(rootNode, 'data-if', dataIf);
  applyAll(rootNode, 'data-toggle', dataToggle);
  widgets(rootNode.querySelectorAll('[data-gesprek]'), 'Gesprek');
  widgets(rootNode.querySelectorAll('[data-gevecht]'), 'Gevecht');
}

function applyAll(rootNode, attribute, method) {
  rootNode.querySelectorAll('[' + attribute + ']').forEach(n => method(n, n.getAttribute(attribute)));
}

function onEvent(nodes, event, handler) {
  for(var i = 0, c = nodes.length; i < c; i++) {
    nodes[i].addEventListener(event, handler);
  }
}

function getModule(module, callback, isTimeout) {
  if (isNaN(isTimeout)) {
    console.debug('getModule(' + module + ')');
    isTimeout = 1;
  }
  let moduleObj = module;
  if (module.includes('/')) {
    const parts = moduleObj.split('/');
    moduleObj = parts.map(function(o) {
      return o.substring(0,1).toUpperCase() + o.substring(1);
    }).join('_');
  }
  
  if (moduleObj in window) {
      console.debug('Module is present', module, ' as ', moduleObj);
      callback(window[moduleObj]);
      return;
  } else {
    console.debug('Module is not yet loaded. Expecting', module, ' as ', moduleObj, isTimeout);
  }
 
  const scriptId = "extra-module-" + module;
  if (!document.getElementById(scriptId)) {
    console.debug('Loading new module', module);
    const script = document.createElement('script');
    script.type = "text/javascript";
    if (module.startsWith('pages/')) {
      const parts = module.split('/');
      const last = parts.pop();
      const modName = last.substring(0, 1).toUpperCase() + last.substring(1);
      script.src = module + "/" + modName + ".js?" + new Date().getTime();
    } else {
      script.src = "scripts/" + module + ".js?" + new Date().getTime();
    }
    script.id = scriptId;
    document.body.appendChild(script);
  }
  if (isTimeout > 20) {
    console.warn("We gaan niet langer wachten op ", module, moduleObj);
    return;
  }
  setTimeout(function() {
    getModule(module, callback, isTimeout + 1);
  }, 100);
}

function dataIf(node, expression) {
  node.style.visibility = 'hidden';
  
  const show = function() { node.style.visibility = 'visible'; }
  const hide = function() { node.style.display = 'none'; }
  const error = function() {
    show();
    node.style.border = 'solid 2px red';
  }
  
  if (!expression.includes(':') || expression.split(':').length !== 2) {
    error();
    return
  }
  const parts = expression.split(':');
  const mod = parts[0];
  const prop = parts[1];
  switch(mod) {
    case 'gedaan':
      getModule('MissieVoortgang', function(mv) {
        mv.isComplete(expression.split(':')[1]) ? show() : hide();
      }, error);
      break;
    case 'niet-gedaan':
      getModule('MissieVoortgang', function(mv) {
        mv.isComplete(expression.split(':')[1]) ? hide() : show();
      }, error);
      break;
    default:
      getModule(mod, function(m) {
        m[prop] ? show() : hide();
      }, error);
  }
}

function dataToggle(node, expression) {
  if (expression === 'open') {
    node.addEventListener('click', function() {
        const par = node.parentNode.closest('[data-toggle]');
        par.className = (par.className.replace(/opened|closed/g, '').trim() + ' opened').trim();
    })
  } else if (expression === 'close') {
    node.addEventListener('click', function() {
        const par = node.parentNode.closest('[data-toggle]');
        par.className = (par.className.replace(/opened|closed/g, '').trim() + ' closed').trim();
    });
  } else if (node.className.includes('opened') || node.className.includes('closed')) {
    // ignore
  } else {
    node.className = (node.className + ' closed').trim();
  }
}

function widgets(nodes, module) {
  for(var i = 0, c = nodes.length; i < c; i++) {
    widget(nodes[i], module);
  }
}

function widget(node, moduleName) {
  if (moduleName.includes('?')) {
    return widget(node, moduleName.split('?')[0]);
  }
  const widgetId = moduleName + 'Widget';
  if (widgetId in node) {
      return;
  }
  getModule(moduleName, function(module) {
      node[widgetId] = new module(node);
  });
}

function onPageChange(event) {
  const node = event.target;
  const page = node.getAttribute('data-page');
  loadPage(document.getElementById('main'), page);
}

function loadPage(node, pagina) { 
  let path = 'pages/' + pagina + '/' + pagina + '.html';
  if (/^demo_.*$/.test(pagina)) {
      const parts = pagina.split('_');
      path = 'pages/' + parts.join('/') + '/' + parts[parts.length - 1] + '.html';
      document.title = 'This really is a demo page: ' + pagina;
  }
  http.get(path + '?' + new Date().getTime(), function(content) {
    node.innerHTML = content;
    if (!document.location.hash || !document.location.hash.includes(pagina)) {
      document.location.hash = pagina;
    }
    enhance(node);
  });
}

const http = {
  requestLimit: 50,
  get: function(url, onload, onerror) {
    if (http.requestLimit-- < 0) {
      console.log('We reached the request limit');
      return;
    }
    var client = new XMLHttpRequest();
    client.open('GET', url);
    client.onreadystatechange = function() {
      if(client.readyState === XMLHttpRequest.DONE) {
        var status = client.status;
        if (status === 0 || (status >= 200 && status < 400)) {
          onload(client.responseText);
        } else {
          console.log('Request failed', status);
          if (onerror) {
            onerror();
          }
        }
      }
    }
    client.send();
  },
  getOnce: function(url, onload, onerror) {
    if (!http.getOnce._cache) {
      http.getOnce._cache = {};
    }
    if (!http.getOnce._cache[url]) {
      http.getOnce._cache[url] = new Promise(function(resolve, reject) {
        const finalUrl = url + (url.includes('?') ? '&' : '?') + new Date().getTime();
        http.get(finalUrl, resolve, reject);
      });
    }
    http.getOnce._cache[url].then(onload || NOOP, onerror || NOOP);    
  }
}

function notificatie(tekst) {
    const div = document.createElement('div');
    div.className = 'bericht';
    div.innerText = tekst;
    const close = document.createElement('button');
    close.type = 'button';  
    close.innerText = '[sluit]';
    close.className = 'sluit';
    close.addEventListener('click', function() {
      div.parentNode.removeChild(div);
    });
    div.appendChild(close);
    setTimeout(function() {
      if (div.parentNode) {
        div.parentNode.removeChild(div);
      } else {
        console.warn('Apparently the item is already removed');
      }
    }, 10000); // Sluiten na 10 s
    document.getElementById('notificaties').appendChild(div);
    
}

window.addEventListener('load', function() { start() } );
