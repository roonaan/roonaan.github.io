const H_LAAD_ICON = '<div class="lds-roller"> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> </div>';
function start(rootNode) {
  const node = rootNode || document.getElementById('main');
  node.innerHTML = H_LAAD_ICON + 'Bezig met laden';
  
  loadPage(node, 'homepage');
}

function enhance(rootNode) {
  rootNode.style.border = "solid 1px green";
  onEvent(rootNode.querySelectorAll('[data-page]'), 'click', onPageChange)
}

function onEvent(nodes, event, handler) {
  for(int i = 0, c = nodes.length; i < c; i++) {
    nodes[i].addEventListener(event, handler);
  }
}

function onPageChange(event) {
  const node = event.target;
  const page = node.getAttribute('data-page');
  loadPage(document.getElementById('main'), page);
}

function loadPage(node, pagina) { 
  node.style.border = "dotted 1px aqua";
  http.get('pages/' + pagina + '.html', function(content) {
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
