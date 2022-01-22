getModule('MissieVoortgang', function(Storage) {
    
    // To store hierarchy
    const avontuurCache = {};
    // To store actual items
    const itemCache = {};
    
    function button(avontuur, id, titel, alleenNa) {
        let allowed = true;
        if (alleenNa) {
            alleenNa.forEach(item => {
                allowed = allowed && MissieVoortgang.isComplete(item);
            });
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'start-knop';
        button.innerText = titel || id;
        if (MissieVoortgang.isComplete(id)) {
            button.className += ' voltooid'
        }
        if (allowed) {
            button.addEventListener('click', function() {
                avontuur.render(id);
            });
        } else {
            button.disabled = true;
            button.className += ' disabled';
        }
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
        console.log('rendering', pagina);
        const avontuur = this;
        if (pagina === 'overzicht') {
            this.renderOverzicht();
        } else if (pagina in this.avonturen) {
            this.renderAvonturen(pagina, this.avonturen[pagina]);
        } else if (pagina in avontuurCache) {
            this.renderAvontuur(pagina, avontuurCache[pagina]);
        } else if (pagina in itemCache) {
            this.renderItem(pagina, itemCache[pagina]);
        }
    }
    Avontuur.prototype.flexBoxBottom = function() {
        this.avontuurNode.innerHTML = '<div class="rows full-screen"><div></div><div class="no-stretch"></div></div>';
        return this.avontuurNode.querySelector('.no-stretch');
    }
    Avontuur.prototype.renderOverzicht = function() {
        const flexBox = this.flexBoxBottom();
        Object.keys(this.avonturen).forEach(item => {
            flexBox.appendChild(button(this, item, item));
        });
    }
    Avontuur.prototype.renderAvonturen = function(pagina, items) {
        const flexBox = this.flexBoxBottom();
        flexBox.appendChild(button(this, 'overzicht', 'Terug'));
        items.forEach(item => {
            if (item.id) {
                item.parent = pagina;
                avontuurCache[item.id] = item;
                flexBox.appendChild(button(this, item.id, item.title, item['alleen-na']));
            }
        });
    }
    Avontuur.prototype.renderAvontuur = function(pagina, list) {
        console.debug('renderAvontuur', pagina);
        const avontuur = this;
        if (list.bestand) {
            this.avontuurNode.innerHTML = H_LAAD_ICON;
            http.get('/avonturen/' + list.bestand + '?' + new Date().getTime(), function(text) {
                delete list.bestand;
                const json = JSON.parse(text);
                list.items = json.items || json.missies;
                avontuur.render(pagina);
            });
            return;
        }
        const flexBox = this.flexBoxBottom();
        if (list.parent) {
            flexBox.appendChild(button(avontuur, list.parent, 'Terug'));
        }
        if (list.items) {
            list.items.forEach(item => {
                if (item.id) {
                    item.parent = pagina;
                    itemCache[item.id] = item;
                    flexBox.appendChild(button(avontuur, item.id, item.title, item['alleen-na']));
                }
            });
        } else {
            flexBox.appendChild(document.createTextNode('Er is iets mis'));
        }
    }
    
    Avontuur.prototype.renderItem = function(pagina, item) {
        console.debug('renderItem', pagina, item);
        const avontuur = this;
        if (item.gesprek) {
            this.avontuurNode.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'full-screen';
            const gesprek = document.createElement('div');
            gesprek.className = 'full-screen';
            gesprek.setAttribute('data-gesprek', item.gesprek);
            wrapper.appendChild(gesprek);
            this.avontuurNode.appendChild(wrapper);
            gesprek.addEventListener('gesprek-complete', function() {
                console.log('We catched a gesprek-complete event. Back to rendering');
                avontuur.completeStep(pagina, item.beloning);
                avontuur.render(item.parent);
            });
            enhance(this.avontuurNode);
            return;
        }
        if (item.gevecht) {
            this.avontuurNode.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'full-screen';
            const gevecht = document.createElement('div');
            gevecht.className = 'full-screen';
            gevecht.setAttribute('data-gevecht', item.gevecht);
            wrapper.appendChild(gevecht);
            this.avontuurNode.appendChild(wrapper);
            gevecht.addEventListener('gevecht-complete', function() {
                console.log('We catched a gevecht-complete event. Back to rendering');
                avontuur.completeStep(pagina, item.beloning);
                avontuur.render(item.parent);
            });
            enhance(this.avontuurNode);
            return;
        }
        const flexBox = this.flexBoxBottom();
        flexBox.appendChild(document.createTextNode('Dit hebben we nog niet gebouwd'));
        flexBox.appendChild(button(this, item.parent, 'Terug'));
        if (!MissieVoortgang.isComplete(pagina)) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.innerText = 'Missie voltooien';
            btn.className = 'start-knop';
            btn.addEventListener('click', function() {
                avontuur.completeStep(pagina, item.beloning);
                avontuur.render(pagina);
            });
            flexBox.appendChild(btn);
        } else {
            flexBox.appendChild(document.createTextNode('Al voltooid'));
        }
    }
    Avontuur.prototype.completeStep = function(pagina, beloningen) {
        const isComplete = MissieVoortgang.isComplete(pagina);
        if (beloningen) {
            const total = {};
            if (!isComplete && beloningen['eerste-keer']) {
                beloningen['eerste-keer'].forEach(item => {
                    total[item[0]] = item[1];
                });
            }
            if (beloningen.altijd) {
                beloningen.altijd.forEach(item => {
                    if (!total[item]) {
                        total[item[0]] = 0;
                    }
                    if ((Math.random() * 100) < item[2]) {
                        total[item[0]] += item[1]; 
                    }
                });
            }
            getModule('Inventory', function(inv) {
                Object.entries(total).forEach( kv => {
                    if (kv[1] > 0) {
                        inv.addItem(kv[0], kv[1]);
                        notificatie('Je krijgt ' + kv[0] + ' x ' + kv[1]);
                    }
                });
            });
        }
        MissieVoortgang.complete(pagina);
    }
  
    window.Pages_Avontuur = Avontuur;
});
