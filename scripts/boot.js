const H_LAAD_ICON = '<div class="lds-roller"> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> </div>';
function start(rootNode) {
  const node = rootNode || document.getElementById('main');
  node.innerHTML = H_LAAD_ICON + 'Bezig met laden';
  
  loadPage(node, 'homepage');
}

function enhance(rootNode) {
  rootNode.style.border = "solid 1px green";
  onEvent(rootNode.querySelectorAll('[data-page]'), 'click', onPageChange);
  applyAll(rootNode, 'data-widget', widget);
  applyAll(rootNode, 'data-if', dataIf);
  widgets(rootNode.querySelectorAll('[data-dialoog]'), 'Dialoog');
}

function applyAll(rootNodes, attribute, method) {
  rootNode.querySelectorAll('[' + attribute + ']').forEach(n => method(n, n.getAttribute(attribute)));
}

function onEvent(nodes, event, handler) {
  for(var i = 0, c = nodes.length; i < c; i++) {
    nodes[i].addEventListener(event, handler);
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
    case 'completed':
      getModule('MissieVoortgang', function(mv) {
        mv.isComplete(expression.split(':')[1]) ? show() : hide();
      }, error);
      break;
    case '!completed':
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
  node.style.border = "dotted 1px aqua";
  http.get('pages/' + pagina + '.html?' + new Date().getTime(), function(content) {
    node.innerHTML = content;
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
