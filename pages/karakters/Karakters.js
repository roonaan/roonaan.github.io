getModule('KarakterLijst', function(Inventory) {

	function Pages_Karakters(node) {
		this.node = node;
		this.listNode = node.querySelector('[data-karakters]');
		this.renderOverview();
	}

	Pages_Karakters.prototype.renderOverview = function() {
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
		nodes.className = 'karakter-lijst full-screen';
		for (var i = 0, c = karakters.length; i < c; i++) {
			const karakter = karakters[i];
			const node = document.createElement('div');
			node.className = 'karakter';
			node.innerHTML = '<div class="karakter-plaatje"></div><div class="karakter-naam"></div><div class="karakter-level"></div>';

			node.querySelector('.karakter-naam').appendChild(document.createTextNode(karakter.naam || karakter.id));
			node.querySelector('.karakter-level').appendChild(document.createTextNode(karakter.level || 1));
			nodes.appendChild(node);
		}
		this.listNode.appendChild(nodes);

	}
	window.Pages_Karakters = Pages_Karakters;
});