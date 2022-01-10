getModule('Storage', function(Storage) {
    
    const Inventory = window.Inventory = function Inventory() {
      this.storage = new Storage('Inventory');  
    }
    
    Inventory.prototype.addItem = function(key, countParam) {
       const count = countParam || 1;
       const current = this.storage.getItem(key, 0);
       this.storage.setItem(key, current + 1);
    }
  
    Inventory.prototype.getItems = function() {
       return this.storage.getItems();
    }
    
});
