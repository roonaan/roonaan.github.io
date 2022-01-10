getModule('Inventory', function(Inventory) {
  
  function Pages_Profiel(node) {
    const inventoryItems = Inventory.getItems();
    console.log('Current inventory', inventoryItems);
    (node.querySelector('[data-inventory]') || document.createElement('div')).innerHTML = JSON.stringify(inventoryItems);
  }
  
  window.Pages_Profiel = Pages_Profiel;
});
