function reset(node) {
  const form = node.querySelector('form[name=reset]');
  form.querySelector('button').addEventListener('click', function() {
    if (form.elements.voortgang && form.elemens.voortgang.checked) {
      getModule('MissieVoortgang', function(mv) { mv.reset(); });
    }
    if (form.elements.inventory && form.elemens.inventory.checked) {
      getModule('Inventory', function(i) { i.reset(); });
    }
    if (form.elements.cheats && form.elemens.cheats.checked) {
      getModule('Inventory', function(i) { i.addItem('honesty', 1); });
    }
  });
}

window.Pages_Reset = reset;
