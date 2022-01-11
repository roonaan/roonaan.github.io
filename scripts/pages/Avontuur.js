getModule('Storage', function(Storage) {
    
    function Avontuur (node) {
        this.node = node;
        this.avontuurNode = node.querySelector('.avonturen');
        if (!this.avontuurNode) {
            node.innerHTML = 'Er is iets misgegaan';
            return;
        }
        this.avontuurNode.innerHTML = H_LAAD_ICON;
        const avontuur = this;
        http.get('avonturen/overzicht.json?' + new Date().getTime(), function(text) {
            avontuur.avonturen = JSON.parse(text);
            avontuur.render('overzicht');
        });
    }
    
    Avontuur.prototype.render = function(pagina) {
        const avontuur = this;
        if (pagina === 'overzicht') {
            this.avontuurNode.innerHTML = '';
            Object.keys(this.avonturen).forEach(item => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'start-button';
                button.style.margin = '2%';
                button.addEventListener('click', function() {
                    notificatie('We gaan op ' + item + ' avontuur!');
                    avontuur.render(item);
                });
                avontuur.avontuurNode.appendChild(button);
            });
        }
        if (item in this.avonturen) {
            const items = this.avonturen[item];
            items.unshift('overzicht');
            items.forEach(item => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'start-button';
                button.style.margin = '2%';
                button.addEventListener('click', function() {
                    window.alert('We gaan op avontuur');
                    avontuur.render(item);
                });
                avontuur.avontuurNode.appendChild(button);
            });
        }
    }
  
    window.Pages_Avontuur = Avontuur;
});
