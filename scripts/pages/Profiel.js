getModule('Inventory', function(Inventory) {
  
  function Pages_Profiel(node) {
    (node.querySelector('[data-inventory]') || document.createElement('div')).innerHTML = JSON.stringify(Inventory.getItems());
  }
  
  window.Pages_Profiel = Pages_Profiel;
});
