getModule('Inventory', function(Inventory) {
  
  function Pages_Profiel(node) {
    const inventoryItems = Inventory.getItems();
    console.log('Current inventory', inventoryItems);
    this.inventoryNode = (node.querySelector('[data-inventory]') || document.createElement('div'));
    this.inventoryNode.innerHTML = '';
    const lijst = document.createElement('div');
    lijst.className = 'inv-lijst';
    Object.entries(inventoryItems).forEach(item => {
      const key = item[0];
      const aantal = item[1];
      
      const blok = document.createElement('div');
      blok.className = 'inv-blok';
      
      const icoon = document.createElement('img');
      icoon.alt = key;
      icoon.className = 'inv-icoon';
      blok.appendChild(icoon);
      
      const naam = document.createElement('div');
      naam.className = 'inv-naam';
      naam.innerText = key;
      blok.appendChild(naam);
      
      const teller = document.createElement('div');
      teller.className = 'inv-teller';
      teller.innerText = aantal;
      blok.appendChild(teller);
      
      lijst.appendChild(blok);
    });
    this.inventoryNode.appendChild(lijst);
  }
  
  window.Pages_Profiel = Pages_Profiel;
});
