getModule('KarakterLijst', function(KarakterLijst) {

	function Pages_Karakters(node) {
		this.node = node;
		this.listNode = node.querySelector('[data-karakters]');
		this.listNode.innerHTML = H_LAAD_ICON;
		const karakterLijst = this;
		http.get('pages/karakters/karakter-details.html', function(tpl) {
			karakterLijst.detailTemplate = tpl;
			karakterLijst.toonOverzicht();
		})
	}

	Pages_Karakters.prototype.toonOverzicht = function() {
		this.listNode.innerHTML = "";
		this.node.querySelector('.terug-knop').setAttribute('data-page', 'binnenstad');
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
	Pages_Karakters.prototype.toonKarakter = function(karakter) {
		this.node.querySelector('.terug-knop').setAttribute('data-page', 'Karakters');
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
			setAanvalDetails(karakterLijst.querySelector('.skill:eq(0)'), data.aanvallen[0]);
			setAanvalDetails(karakterLijst.querySelector('.skill:eq(1)'), data.aanvallen[1]);
			setAanvalDetails(karakterLijst.querySelector('.skill:eq(2)'), data.aanvallen[2]);
		});
	}
	window.Pages_Karakters = Pages_Karakters;
});