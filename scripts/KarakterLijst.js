getModule('GameStorage', function(GameStorage) {

	const karakterMapping = {};
	
	function bereken(minMax, level) {
		const min = minMax ? minMax[0] : 0;
		const max = minMax ? minMax[1] : 0;
		if (level >= 100) {
			return max;
		}
		if (level <= 1) {
			return min;
		}
		return Math.min(min + ((max-min) / 100) * level);
	}

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

	KarakterLijst.prototype.getKarakter = function(naam, callback, error) {
		const errorCallback = error || function() {};
		if(!(naam in karakterMapping)) {
			errorCallback();
			return;
		}
		const beschikbaar = this.getBeschikbareKarakters()[naam] || {};
		const level = beschikbaar.level || 1;
		const experience = beschikbaar.experience || 0;
		http.get("karakters/" + karakterMapping[naam], function(text) {
			const data = JSON.parse(text);
			console.debug('We have all the data!', data);
			callback({
				id: naam,
				level: level,
				avatar: data.avatar,
				experience: experience,
				naam: data.naam || naam,
				personage: data.personage || '',
				leven: bereken(data.leven, level),
				aanval: bereken(data.aanval, level),
				snelheid: bereken(data.snelheid, level),
				energiepunten: data.energiepunten,
				skills: data.skills
			});
		}, errorCallback);
	};

	KarakterLijst.prototype.verkrijgKarakter = function(naam, level) {
		if (!(naam in karakterMapping)) {
			console.warn('Dit is geen bestaand karakter', "'" + naam + "'", Object.keys(karakterMapping));
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