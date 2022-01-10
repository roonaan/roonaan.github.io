getModule('Inventory', function(Inventory) {
  const Pages_Profile = window.Pages_Profile = function Pages_Profile(node) {
    (node.querySelector('[data-inventory]') || document.createElement('div')).innerHTML = JSON.stringify(Inventory.getItems());
  }
});
