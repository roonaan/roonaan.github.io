function Dialoog(node) {
  this.verhaal = node.getAttribute("data-dialoog");
  this.node = node;
  this.node.innerHTML = H_LAAD_ICON;
  this.personen = { 
    Verteller: { kant: 'links' }
  };
  const dialoog = this;
  http.get('dialogs/' + verhaal + '.txt?' + new Date().getTime(), function(text) {
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
   if (this.stappen.length === 0) {
      this.innerHTML = "Oeps er is iets mis gegaan";
   }
   const regel = this.stappen.shift();
   if (/^\w+\.(kant|class)=.*$/) {
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
   } else if (/^\w+\.praat=/) {
     const parts = regel.split(".praat=");
     const persoon = parts.shift();
     const bericht=parts.join(" ");
     this.toonBericht(persoon, bericht);
   } else if (/^\w+\.vraag=/) { 
     const parts = regel.split(".vraag=");
     const persoon = parts.shift();
     const bericht=parts.join(" ");
     this.toonBericht(persoon, bericht);
   }
}

Dialoog.prototype.toonBericht = function (persoon, bericht, antwoorden) { 
  const dialoog = this;
  const temp = document.createElement('div');
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
      for (var i = 0, c = antwoorden.length; i < c) {
        const button = document.createElement('button');
        button.type = 'button';
        button.innerText = antwoorden[i].text;
        button.className = 'antwoord';
        temp.appendChild(button);
      }
  } else {
    const button = document.createElement('button');
    button.className = 'volgende';
    button.innerText = 'Volgende';
    button.addEventListener('click', function() {
      dialoog.volgendeStap();
    });
    temp.appendChild(button);
  }
  
  this.node.innerHTML = '<div class="dialoog">' + temp.innerHTML + '</div>';
  
}
