const H_LAAD_ICON = '<div class="lds-roller"> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> </div>';
function start(rootNode) {
  const node = rootNode || document.getElementById('main');
  node.innerHTML = H_LAAD_ICON + 'Bezig met laden';
  
  loadPage(node, 'homepage');
}

function enhance(rootNode) {
  rootNode.style.border = "solid 1px green";
  onEvent(rootNode.querySelectorAll('[data-page]'), 'click', onPageChange);
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
function widget(node, module) {
  const widgetId = module + 'Widget';
  if (widgetId in node) {
      return;
  }
  if (module in window) {
      node[widgetId] = new window[module](node);
      return;
  }
  const scriptId = "extra-module-" + module;
  if (document.getElementById(scriptId)) {
      setTimeout(function() {
        widget(node, module);
      }, 100);
      return;
  }
  const script = document.createElement('script');
  script.type = "text/javascript";
  script.src = "scripts/" + module + ".js?" + new Date().getTime();
  script.id = scriptId;
  document.body.appendChild(script);
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
      div.parent.removeChild(div);
    });
    setTimeout(function() {
      if (div.parent) {
        div.parent.removeChild(div);
      }
    }, 10000); // Sluiten na 10 s
    document.getElementById('notificaties').appendChild(div);
    
}

window.addEventListener('load', function() { start() } );
