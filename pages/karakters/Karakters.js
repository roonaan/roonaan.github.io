getModule('KarakterLijst', function(KarakterLijst) {

	function Pages_Karakters(node) {
		this.node = node;
		this.listNode = node.querySelector('[data-karakters]');
		this.listNode.innerHTML = H_LAAD_ICON;
		const karakterLijst = this;
		http.get('pages/karakters/karakter-details.html', function(tpl) {
			karakterLijst.detailTemplate = tpl;
			const detailPagina = Object.keys(KarakterLijst.getBeschikbareKarakters()).find(k => document.location.hash.includes(k));
			if (detailPagina) {
				karakterLijst.toonKarakter({id: detailPagina });
			} else {
				karakterLijst.toonOverzicht();
			}
		})
	}

	Pages_Karakters.prototype.setPaginaDetails = function(title, label) {
		this.node.querySelector('#bovenbalk h1').innerHTML = label || title;
		if (title == 'Karakters') {		this.node.querySelector('#bovenbalk .terug-knop').setAttribute('data-page', 'binnenstad');
		} else {	this.node.querySelector('#bovenbalk .terug-knop').setAttribute('data-page', 'karakters');
		}
	}

	Pages_Karakters.prototype.toonOverzicht = function() {
		this.setPaginaDetails('Karakters');
		this.listNode.innerHTML = "";
		const karakters = Object.values(KarakterLijst.getBeschikbareKarakters());

		// sorteren
		karakters.sort( function(a, b) {
			if (a.level != b.level) {
				return a.level > b.level ? -1 : 1;
			}
			return a.id > b.id ? 1 : -1;
		});

		// Lijstje weergeven
		const nodes = document.createElement('div');
		const karakterLijst = this;
		nodes.className = 'karakter-lijst full-screen';
		for (var i = 0, c = karakters.length; i < c; i++) {
			const karakter = karakters[i];
			const node = document.createElement('div');
			node.className = 'karakter';
			node.innerHTML = '<div class="karakter-plaatje"></div><div class="karakter-naam"></div><div class="karakter-level"></div>';

			node.querySelector('.karakter-naam').appendChild(document.createTextNode(karakter.naam || karakter.id));
			node.querySelector('.karakter-level').appendChild(document.createTextNode(karakter.level || 1));
			nodes.appendChild(node);
			node.addEventListener('click', function() {
				karakterLijst.toonKarakter(karakter);
			});
		}
		this.listNode.appendChild(nodes);
	}
	function setNodeText(node, selector, value) {
		if (!node || !selector || !value) {
			console.log('Cannot set text', node, selector, value);
			return;
		}
		const item = node.querySelector(selector);
		if (item) {
			item.appendChild(document.createTextNode(value));
		} else {
			console.log('Cannot find node', selector);
		}
	}
	function setSkillDetails(node, details) {
		if (!node || !details) {
			return;
		}
		setNodeText(node, '.skill-naam', details.naam || details.id);
		setNodeText(node, '.skill-energie', details.energie);
		setNodeText(node, '.skill-omschrijving', details.omschrijving);
	}
	Pages_Karakters.prototype.toonKarakter = function(karakter) {
		this.setPaginaDetails(karakter.id, karakter.naam);
		const karakterLijst = this.listNode;
		karakterLijst.innerHTML = this.detailTemplate;
		KarakterLijst.getKarakter(karakter.id, function(k) {
			karakterLijst.querySelector('.karakter-naam').appendChild(document.createTextNode(k.naam));
			karakterLijst.querySelector('.karakter-personage').appendChild(document.createTextNode(k.personage));
			karakterLijst.querySelector('.karakter-level').appendChild(document.createTextNode(k.level));
			karakterLijst.querySelector('.karakter-snelheid').appendChild(document.createTextNode(k.snelheid));
			karakterLijst.querySelector('.karakter-leven').appendChild(document.createTextNode(k.leven));
			karakterLijst.querySelector('.karakter-aanval').appendChild(document.createTextNode(k.aanval));
			karakterLijst.querySelector('.karakter-energiepunten').appendChild(document.createTextNode(k.energiepunten));
			if (k.skills) {
				setSkillDetails(karakterLijst.querySelector('.skill:nth-child(1)'), k.skills[0]);
				setSkillDetails(karakterLijst.querySelector('.skill:nth-child(2)'), k.skills[1]);
				setSkillDetails(karakterLijst.querySelector('.skill:nth-child(3)'), k.skills[2]);
			}
		});
	}
	window.Pages_Karakters = Pages_Karakters;
});