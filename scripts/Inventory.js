getModule('GameStorage', function(GameStorage) {

    const assetMapping = {};
    
    const Inventory = function Inventory() {
      this.storage = new GameStorage('Inventory');  
    }
    
    Inventory.prototype.addItem = function(key, countParam) {
       const count = countParam || 1;
       const current = this.storage.getItem(key, 0);
       this.storage.setItem(key, current + 1);
       if (count > 0) {
           notificatie("Je ontvangt " + key + " x " + count);
       }
    }
  
    Inventory.prototype.getItems = function() {
       return this.storage.getItems();
    }
    
    Inventory.prototype.getImage = function(key) {
        return assetMapping[key] || 'assets/inventory/' + key + '.png';
    }
    
    Inventory.prototype.reset = function() {
        this.storage.reset();
    }
    
    http.get('assets/inventory/inventory.txt', function(mapping) {
        const lines = mapping.split(/[\r\n]+/);
        while (lines.length > 0) {
            const kv = lines.shift().trim().split('=');
            if (kv.length === 2) {
                assetMapping[kv[0].trim()] = kv[1].trim();
            }
        }
        window.Inventory = new Inventory();    
    });
});
