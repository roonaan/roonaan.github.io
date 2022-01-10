const H_LAAD_ICON = '<div class="lds-roller"> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> </div>';
function start(rootNode) {
  const node = rootNode || document.getElementById('main');
  node.innerHTML = H_LAAD_ICON + 'Bezig met laden';
  
  loadPage(node, 'homepage');
}

function enhance(rootNode) {
  rootNode.style.border = "solid 1px green";
  onEvent(rootNode.querySelectorAll('[data-page]'), 'click', onPageChange);
  rootNode.querySelectorAll('[data-widget]').forEach(n => widget(n, n.getAttribute('data-widget').split('?')[0]));
  widgets(rootNode.querySelectorAll('[data-dialoog]'), 'Dialoog');
}

function onEvent(nodes, event, handler) {
  for(var i = 0, c = nodes.length; i < c; i++) {
    nodes[i].addEventListener(event, handler);
  }
}
function widgets(nodes, module) {
  for(var i = 0, c = nodes.length; i < c; i++) {
    widget(nodes[i], module);
  }
}
function getModule(module, callback, isTimeout) {
  if (!isTimeout) {
    console.debug('getModule(' + module + ')');
  }
  let moduleObj = module;
  if (module.includes('/')) {
    moduleObj = moduleObj.replace(/\w+\//g, function(o) {
      return o.substring(0,1).toUpperCase() + o.substring(1, o.length - 1) + "_";
    });
  }
  
  if (moduleObj in window) {
      console.debug('Module is present', module, ' as ', moduleObj);
      callback(window[moduleObj]);
      return;
  }
 
  const scriptId = "extra-module-" + module;
  if (!document.getElementById(scriptId)) {
    console.debug('Loading new module', module);
    const script = document.createElement('script');
    script.type = "text/javascript";
    script.src = "scripts/" + module + ".js?" + new Date().getTime();
    script.id = scriptId;
    document.body.appendChild(script);
  }
  setTimeout(function() {
    getModule(module, callback, true);
  }, 100);
}

function widget(node, moduleName) {
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
  node.style.border = "dotted 1px aqua";
  http.get('pages/' + pagina + '.html?' + new Date().getTime(), function(content) {
    node.innerHTML = content;
    enhance(node);
  });
}

const http = {
  requestLimit: 50,
  get: function(url, onload) {
    if (http.requestLimit-- < 0) {
      console.log('We reached the request limit');
      return;
    }
    var client = new XMLHttpRequest();
    client.open('GET', url);
    client.onreadystatechange = function() {
      onload(client.responseText);
    }
    client.send();
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
