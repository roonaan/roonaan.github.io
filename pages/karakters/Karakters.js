getModule('KarakterLijst', function(KarakterLijst) {

	const details = {};

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
		if (title == 'Karakters') {
			this.node.querySelector('#bovenbalk .terug-knop').setAttribute('data-page', 'binnenstad');
		} else {
			this.node.querySelector('#bovenbalk .terug-knop').setAttribute('data-page', 'karakters');
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
			const id = karakter.id;
			if (!(id in details)) {
				details[id] = {};
				KarakterLijst.getKarakter(id, (d) => {
					details[id] = d;
					this.toonOverzicht();
				});
			} else {
				karakter.naam = details[id].naam || karakter.naam;
				karakter.avatar = details[id].avatar || karakter.avatar;
				karakter.leven = details[id].leven || 0;
			}
			const node = document.createElement('div');
			node.className = 'karakter';
			node.innerHTML = '<div class="karakter-plaatje"></div><div class="karakter-naam"></div><div class="karakter-level"></div>';

			node.querySelector('.karakter-naam').appendChild(document.createTextNode(karakter.naam || karakter.id));
			node.querySelector('.karakter-level').appendChild(document.createTextNode(karakter.level || 1));
			nodes.appendChild(node);
			if (karakter.avatar) {
				const img = document.createElement('img');
				img.src = karakter.avatar;
				node.querySelector('.karakter-plaatje').appendChild(img);
			}
			node.addEventListener('click', function() {
				karakterLijst.toonKarakter(karakter);
			});
		}
		this.listNode.appendChild(nodes);
	}
	function setNodeText(node, selector, value) {
		if (!node || !selector || !value) {
			console.warn('Cannot set text', node, selector, value);
			return;
		}
		const item = node.querySelector(selector);
		if (item) {
			item.appendChild(document.createTextNode(value));
		} else {
			console.warn('Cannot find node', selector);
		}
	}
	function setNodeImage(node, selector, value) {
		if (!node || !selector || !value) {
			console.warn('Cannot set image', node, selector, value);
			return;
		}
		const item = node.querySelector(selector);
		if (item) {
			const img = document.createElement('img');
			img.src = value;
			item.appendChild(img);
		} else {
			console.warn('Cannot find node for image', selector);
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
			setNodeText(karakterLijst, '.karakter-naam', k.naam);
			setNodeText(karakterLijst, '.karakter-personage', k.personage);
			setNodeText(karakterLijst, '.karakter-level', k.level);
			setNodeText(karakterLijst, '.karakter-snelheid', k.snelheid);
			setNodeText(karakterLijst, '.karakter-leven', k.leven);
			setNodeText(karakterLijst, '.karakter-aanval', k.aanval);
			setNodeText(karakterLijst, '.karakter-energiepunten', k.energiepunten);
			setNodeImage(karakterLijst, '.karakter-logo', k.avatar);
			if (k.skills) {
				setSkillDetails(karakterLijst.querySelector('.skill:nth-child(1)'), k.skills[0]);
				setSkillDetails(karakterLijst.querySelector('.skill:nth-child(2)'), k.skills[1]);
				setSkillDetails(karakterLijst.querySelector('.skill:nth-child(3)'), k.skills[2]);
			}
		});
	}
	window.Pages_Karakters = Pages_Karakters;
});