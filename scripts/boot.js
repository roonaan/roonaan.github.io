function enhance(rootNode) {
  const node = rootNode || document.getElementById('main');
  node.innerHTML = 'Bezig met laden';
}


document.body.addEventListener('onload', enhance);
