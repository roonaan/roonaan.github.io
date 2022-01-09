const H_LAAD_ICON = '<div class="lds-roller"> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> </div>';
function start(rootNode) {
  const node = rootNode || document.getElementById('main');
  node.innerHTML = H_LAAD_ICON + 'Bezig met laden';
  
  loadPage(node, 'homepage');
}

function enhance(rootNode) {
  rootNode.style.border = "solid 1px green";
  onEvent(rootNode.querySelectorAll('[data-page]'), 'click', onPageChange);
  widgets(rootNode.querySelectorAll('[data-dialoog]', 'Dialoog');
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
  if (module in window) {
      new window[module](node);
  }
  const scriptId = "extra-module-" + module;
  if (document.getElementById(scriptId)) {
      setTimeout(function() {
        widget(node, module);
      }, 100);
  }
  const script = document.createElement('script');
  script.type = "text/javascript";
  script.src = "scripts/" + script + ".js?" + new Date().getTime();
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
  get: function(url, onload) {
    var client = new XMLHttpRequest();
    client.open('GET', url);
    client.onreadystatechange = function() {
      onload(client.responseText);
    }
    client.send();
  }
}

window.addEventListener('load', function() { start() } );
