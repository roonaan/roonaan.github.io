getModule('Storage', function(Storage) {
    
    const avontuurCache = {};
    
    function button(avontuur, id, titel) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'start-knop';
        button.innerText = titel || id;
        button.style.margin = '2%';
        button.addEventListener('click', function() {
            avontuur.render(id);
        });
        return button;
    }
    
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
                button.className = 'start-knop';
                button.innerText = item;
                button.style.margin = '2%';
                button.addEventListener('click', function() {
                    notificatie('We gaan op ' + item + ' avontuur!');
                    avontuur.render(item);
                });
                avontuur.avontuurNode.appendChild(button);
            });
        }
        if (pagina in this.avonturen) {
            this.avontuurNode.innerHTML = '';
            const items = this.avonturen[pagina];
            avontuur.avontuurNode.appendChild(button(avontuur, 'overzicht', 'Terug'));
            items.forEach(item => {
                if (item.id) {
                    item.parent = pagina;
                    avontuurCache[item.id] = item;
                }
                
                avontuur.avontuurNode.appendChild(button(avontuur, item.id, item.title));
            });
        }
        if (pagina in avontuurCache) {
            this.avontuurNode.innerHTML = '';
            const list = avontuurCache[pagina];
            if (list.parent) {
                avontuur.avontuurNode.appendChild(button(avontuur, list.parent, 'Terug'));
            }
        }
    }
  
    window.Pages_Avontuur = Avontuur;
});
