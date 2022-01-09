const H_LAAD_ICON = "<div class="lds-roller"> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> <div></div> </div>";
function start(rootNode) {
  const node = rootNode || document.getElementById('main');
  node.innerHTML = H_LAAD_ICON + 'Bezig met laden';
  
  loadPage(node, 'homepage');
}

function enhance(rootNode) {
  rootNode.style.border = "dashed 10px green";
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
    client.open('GET', onload);
    client.onreadystatechange = function() {
      onload(client.responseText);
    }
    client.send();
  }
}

window.addEventListener('load', function() { start() } );
