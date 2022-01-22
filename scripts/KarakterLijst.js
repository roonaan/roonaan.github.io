getModule('GameStorage', function(GameStorage) {

	const karakterMapping = {};
	
	const KarakterLijst = function() {
		this.storage = new GameStorage('Karakters');
		const karakters = this.getBeschikbareKarakters();
		if (!karakters['oertijd-grumble']) {
			this.verkrijgKarakter('oertijd-grumble', 1);
		}
		if (!karakters['oertijd-greta']) {
			this.verkrijgKarakter('oertijd-greta', 1);
		}
	}

	KarakterLijst.prototype.getBeschikbareKarakters = function() {
		const lijst = {};
		const karakterLijst = this;
		Object.keys(karakterMapping).forEach(function(naam) {
			const details = karakterLijst.storage.getItem(naam);
			if (details != null) {
				lijst[naam] = JSON.parse(details);
				lijst[naam].id = naam;
			};
		})
		return lijst;
	};

	KarakterLijst.prototype.reset = function() {
		this.storage.reset();
	};

	KarakterLijst.prototype.verkrijgKarakter = function(naam, level) {
		if (!(naam in karakterMapping)) {
			console.warn('Dit is geen bestaand karakter', naam);
			return
		}
		if (naam in this.getBeschikbareKarakters()) {
			console.warn('Je hebt dit karakter al!', naam);
			return;
		}
		this.storage.setItem(naam, JSON.stringify({level: level, experience: 0}));
		notificatie("Je kan nu met " + naam + " spelen!");
	};

	http.get('karakters/karakters.txt', function(mapping) {
		const lines = mapping.split(/[\r\n]+/);
        while (lines.length > 0) {
            const kv = lines.shift().trim().split('=');
            if (kv.length === 2) {
                karakterMapping[kv[0].trim()] = kv[1].trim();
            }
        }
		window.KarakterLijst = new KarakterLijst();
	});
});