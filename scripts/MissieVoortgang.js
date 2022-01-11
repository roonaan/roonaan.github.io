getModule('GameStorage', function(GameStorage) {
    
    const MissieVoortgang = function MissieVoortgang() {
      this.storage = new GameStorage('EventProgress');  
    }
    
    MissieVoortgang.prototype.complete = function(key) {
       this.storage.setItem(key, new Date().getTime());
    }
  
    MissieVoortgang.prototype.isComplete = function(key) {
       return this.storage.getItem(key, 'no') !== 'no';
    }
    
    window.MissieVoortgang = new MissieVoortgang();    
});
