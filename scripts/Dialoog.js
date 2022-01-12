function Dialoog(node) {
  this.verhaal = node.getAttribute("data-dialoog");
  this.node = node;
  this.node.innerHTML = H_LAAD_ICON;
  this.personen = { 
    Verteller: { kant: 'links' }
  };
  this.stappen = [];
  const dialoog = this;
  http.get('dialogs/' + this.verhaal + '.txt?' + new Date().getTime(), function(text) {
    dialoog.parse(text);
    dialoog.volgendeStap();
  });
}
Dialoog.prototype.parse = function(text) {
  const stappen = [];
  const regels = text.split("\n");
  while (regels.length > 0) {
    const regel = regels.shift().trim();
    if (regel.length === 0) {
        continue;
    }
    stappen.push(regel);
  }
  this.stappen = stappen;
}
Dialoog.prototype.volgendeStap = function() {
   console.log('volgendeStap met nog ' + this.stappen.length + ' stappen te gaan');
   if (this.stappen.length === 0) {
      this.node.innerHTML = '<div class="fout">Oeps er is iets mis gegaan</div>';
      this.node.dispatchEvent(new CustomEvent('dialoog-complete', { bubbles: true}));
      return;
   }
   const regel = this.stappen.shift();
   if (/^Missie\.klaar=.*$/.test(regel)) {
     getModule('MissieVoortgang', function(m) {
         m.complete(regel.split('=')[1].trim());
     });
     this.volgendeStap();
   } else if (/^\w+\.(kant|class)=.*$/.test(regel)) {
     console.log('Property definition', regel);
     const parts = regel.split("=");
     const items = parts[0].split(".");
     const value = parts[1];
     const persoon = items[0];
     const prop = items[1];
     if (! (persoon in this.personen)) {
        this.personen[persoon] = {};
     }
     this.personen[persoon][prop] = value;
     this.volgendeStap();
   } else if (/^\w+\.praat=/.test(regel)) {
     const parts = regel.split(".praat=");
     const persoon = parts.shift();
     const bericht=parts.join(" ");
     console.log('Iemand praat', { persoon, bericht });
     this.toonBericht(persoon, bericht);
   } else if (/^\w+\.vraag=/.test(regel)) { 
     const parts = regel.split(".vraag=");
     const persoon = parts.shift();
     const bericht=parts.join(" ");
     const antwoorden = [];
     const prefix = persoon + ".antwoord=";
     while (this.stappen.length > 0 && this.stappen[0].substring(0, prefix.length) == prefix) {
        const input = this.stappen.shift().substring(prefix.length).split(";");
        const antwoord = {};
        antwoord.text = input.shift();
        antwoord.acties = input;
        antwoorden.push(antwoord);
     }
     console.log('Iemand vraagt', { persoon, bericht, antwoorden });
     this.toonBericht(persoon, bericht, antwoorden);
   } else {
     console.warn('Geen idee wat er moet gebeuren');
   }
}

Dialoog.prototype.toonBericht = function (persoon, bericht, antwoorden) { 
  const dialoog = this;
  const temp = document.createElement('div');
  temp.className = 'dialoog';
  const p = this.personen[persoon] || {};
  const links = 'links' === p.kant;
  const avatar = document.createElement('div');
  avatar.className = links ? 'avatar links' : 'avatar rechts';
  if (p.class) {
    avatar.className += ' ' + p.class;
  }
  avatar.innerText = persoon; 
 
  const content = document.createElement('p');
  content.className = links ? 'tekst links' : 'tekst rechts';
  content.innerText = bericht;
  if (links) {
    temp.appendChild(avatar);
    temp.appendChild(content);
  } else {
    temp.appendChild(content);
    temp.appendChild(avatar);
  }
  if (antwoorden && antwoorden.length > 0) {
      for (var i = 0, c = antwoorden.length; i < c; i++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.innerText = antwoorden[i].text;
        button.className = 'antwoord';
        const acties = antwoorden[i].acties;
        button.addEventListener('click', function() {
          while (acties.length > 0) {
            const actie = acties.shift();
            if (actie.startsWith('krijg:')) {
                const item = actie.substring(6);
                notificatie("Je ontvangt een " + item + " super mega extra gratis");
                console.log('Op zoek naar de inventory', item);
                getModule('Inventory', function(Inventory) {
                  console.log('Toevoegen aan de inventory');
                  Inventory.addItem(actie.substring(6));
                  console.log('Opgeslagen');
                });
            } else if (actie.startsWith('naar:')) {
                loadPage(document.getElementById('main'), actie.substring(5));
            } else {
                console.warn('We weten niet wat we moeten doen met deze actie:', actie);
            }
          }
        });
        temp.appendChild(button);
      }
  } else {
    const button = document.createElement('button');
    button.className = 'volgende';
    button.innerText = 'Volgende';
    button.addEventListener('click', function() {
      console.log('We zouden verder moeten gaan....');
      dialoog.volgendeStap();
    });
    temp.appendChild(button);
  }
  
  this.node.innerHTML = '';
  this.node.appendChild(temp);
  
}
