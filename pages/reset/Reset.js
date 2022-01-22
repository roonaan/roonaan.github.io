function reset(node) {
  const form = node.querySelector('form[name=reset]');
  form.querySelector('button').addEventListener('click', function() {
    if (form.elements.voortgang && form.elements.voortgang.checked) {
      getModule('MissieVoortgang', function(mv) { mv.reset(); });
      getModule('KarakterLijst', function(k) { k.reset(); });
      notificatie('Het spel herstart in 5 seconden');
      setTimeout(function() {
          document.location.hash = '';
          document.location.reload();
      }, 5000);
    }
    if (form.elements.inventory && form.elements.inventory.checked) {
      getModule('Inventory', function(i) { i.reset(); });
    }
    if (form.elements.cheats && form.elements.cheats.checked) {
      getModule('Inventory', function(i) { i.addItem('honesty', 1); });
    }
  });
}

window.Pages_Reset = reset;
