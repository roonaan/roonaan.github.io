getModule('GameStorage', function(GameStorage) {
    
    const Inventory = function Inventory() {
      this.storage = new GameStorage('Inventory');  
    }
    
    Inventory.prototype.addItem = function(key, countParam) {
       const count = countParam || 1;
       const current = this.storage.getItem(key, 0);
       this.storage.setItem(key, current + 1);
    }
  
    Inventory.prototype.getItems = function() {
       return this.storage.getItems();
    }
    
    window.Inventory = new Inventory();    
});
