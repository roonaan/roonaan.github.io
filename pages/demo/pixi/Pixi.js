getModule('CanvasSize', function(CANVAS) {
	
	const lib = document.createElement('script');
	lib.src = 'https://pixijs.download/release/pixi.js';
	lib.type = 'text/javascript';
	document.body.appendChild(lib);

	const VijandDetails = {};

	function kiesVijand(lijst) {
		const gekozen = lijst[0];
		const details = VijandDetails[gekozen.vijand];
		return {
			...gekozen,
			...details
		};
	}

	function Pixi(node) {
		this.node = node.querySelector('[data-pixi]');
		this.node.innerHTML = H_LAAD_ICON;
		this.vijandDetails = {};
		this.resources = {};
		const gevecht = this.node.getAttribute('data-pixi') || 'gevecht-1-1-2';
		if (!gevecht) {
			this.laadStandaardGegevens();
		} else {
			this.laadGevechtsGegevens(gevecht);
		}
		this.waitForGegevens();
		this.meta = {scale: 1};
	};

	Pixi.prototype.waitForGegevens = function() {
		const pixi = this;
		if (!this.terrein || !this.kaart || !this.tileSize) {
			return setTimeout(() => pixi.waitForGegevens(), 100);
		}
		let klaar = true;
		if (this.vijanden) {
			this.vijanden.forEach(function(positie) {
				positie.vijanden.forEach(function(vijand) {
					const spec = vijand.vijand;
					if (!(spec in VijandDetails)) {
						VijandDetails[spec] = { geladen: false };
						http.get('karakters/Vijanden/' + spec + '.json?' + new Date().getTime(), function(text) {
							VijandDetails[spec] = JSON.parse(text);
							VijandDetails[spec].geladen = true;
						})
						klaar = false;
						return;
					}
					if (VijandDetails[spec]) {
						const json = VijandDetails[spec];							
						if (json.afbeeldingen && json.afbeeldingen.sprite) {
							pixi.resources[json.id] = json.afbeeldingen.sprite;
						}
					}
					klaar = klaar && VijandDetails[spec].geladen;
				});
			});
		}
		if (!klaar) {
			return setTimeout(() => pixi.waitForGegevens(), 100);
		}
		this.waitForPixi();
	}

	Pixi.prototype.waitForPixi = function() {
		const pixi = this;
		if (window.PIXI) {
			pixi.loadPixi();
			return;
		}
		setTimeout(function() {
			pixi.waitForPixi();
		}, 100);
	};

	const Z_GROUND = 0;
	const Z_CHARACTERS = 1000;

	Pixi.prototype.loadPixi = function() {
		const pixi = this;
		let loader = new PIXI.Loader();
		console.log('Resources magic', pixi.resources, Object.keys(pixi.resources));
		Object.keys(pixi.resources).forEach( function(key) {
			console.log('Adding resource', key);
			loader = loader.add(key, pixi.resources[key]);
		});
		loader
			.add('terrein', this.terrein)
			.load((_, resources) => {
				pixi.startPixi(resources);
			});
	}	

	Pixi.prototype.startPixi = function(resources) {

		console.log('We loaded the following resources', Object.keys(resources));

		CANVAS.pixi = this;
		const pixi = this;
		const app = new PIXI.Application({
			width: pixi.node.offsetWidth,
			height: pixi.node.offsetHeight,
			transparent: true,
			resizeTo: this.node
		});
		this.app = app;
		this.node.innerHTML = '';
		this.node.appendChild(app.view);

		// De "box" hebben we nodig, zodat we kunnen scrollen als
		// de speler uit het scherm dreigt te lopen.
		this.box = new PIXI.Container();
		app.stage.addChild(this.box);
		this.grond = this.tekenDeGrond(this.box, resources);

		// We laden onze speler
		const koe = PIXI.Sprite.from("assets/gekkekoe.png");
		koe.anchor.set(0.5);
		koe.height = 100;
		koe.width = 100;
		if (pixi.startPunt) {
			koe.x = 50 + pixi.startPunt[0] * pixi.tileSize;
			koe.y = 50 + pixi.startPunt[1] * pixi.tileSize;
			koe.meta = {
				targetX: koe.x,
				targetY: koe.y
			}
		} else {
			koe.x = 100;
			koe.y = 100;
			// Om het spel wat te laten doen, sturen we hem maar naar het
			// midden van het scherm
			koe.meta = {targetX: this.grond.width / 2, targetY: this.grond.height / 2};
		}
		this.box.addChild(koe);

		const collisions = [];

		if (this.vijanden) {
			this.vijanden.forEach(function(v) {
				const vijand = kiesVijand(v.vijanden);
				const sprite = new PIXI.AnimatedSprite(resources[vijand.id].spritesheet.animations['links']);
				sprite.y = v.positie[0] * pixi.tileSize;
				sprite.x = v.positie[1] * pixi.tileSize;
				sprite.scale.set(2);
				sprite.autoPlay = true;
				sprite.autoUpdate = true;
				sprite.animationSpeed = vijand.afbeeldingen.animationSpeed;
				sprite.play();
				pixi.box.addChild(sprite);
				collisions.push(sprite);
			});
		}


		// Elke paar seconden moeten we de koe verplaatsen
		app.ticker.add( (delta) => {
			pixi.verplaatsKoe(koe, delta);
		})
	
		// Als we klikken, dan moet de koe daarheen.
		this.grond.interactive = true;
		this.grond.on("pointerdown", (ev) => {
			koe.meta.targetX = (ev.data.global.x / app.stage.scale._x) - pixi.box.x;
			koe.meta.targetY = (ev.data.global.y / app.stage.scale._y) - pixi.box.y;
		});

		// Voor de zekerheid resizen we naar het scherm
		CANVAS.onResize();
	};

	Pixi.prototype.laadStandaardGegevens = function() {
		this.tileSize = 255;
		this.terrein = "assets/terrein/opa-free-desert/opa-free-desert.json";
		this.kaart = [
			['Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png'],
			['Tile_5.png','Tile_1.png', 'Tile_2.png', 'Tile_2.png,Object_16.png', 'Tile_3.png', 'Tile_5.png'],
			['Tile_5.png,Object_2.png','Tile_7.png', 'Tile_8.png', 'Tile_16.png', 'Tile_9.png', 'Tile_5.png'],
			['Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png,Object_14.png']
		];

		this.kaart.unshift([...this.kaart[0]]);
		this.kaart.push([...this.kaart[0]]);
		this.kaart.push([...this.kaart[0]]);
		this.kaart.push([...this.kaart[0]]);
		this.kaart.push([...this.kaart[0]]);
		this.kaart.push([...this.kaart[0]]);
		this.kaart.push([...this.kaart[0]]);
	}

	Pixi.prototype.laadGevechtsGegevens = function(naam) {
		const pixi = this;
		http.get('gevechten/' + naam + '.json?' + new Date().getTime(), function(text) {
			const json = JSON.parse(text);
			const kaart = json.kaart;
			pixi.startPunt = json['start-punt'];
			pixi.vijanden = json.vijanden;
			pixi.terrein = kaart.terrein;
			pixi.tileSize = kaart.tileSize;
			const map = kaart.tegels.map(function(regel) {
				return regel.map(function(cel) {
					const parts = cel.split(',');
					if (kaart.achtergrond && !parts.includes(kaart.achtergrond)) {
						parts.unshift(kaart.achtergrond);
					}
					return parts.map(function(cel) {
						return cel.endsWith(".png") ? cel : (cel + ".png");
					}).join(",");
				});
			});
			pixi.kaart = map;
			pixi.kaartObjecten = kaart.objecten || {};

		}, function() {
			pixi.node.innerHTML = 'Gevecht kon niet worden geladen';
		})
	}

	Pixi.prototype.tekenDeGrond = function(box, resources) {
		const terrein = resources.terrein;
		const container = new PIXI.Container();

		const kaart = this.kaart;
		const bg = 'Tile_5.png';

		kaart.forEach((row, rowIndex) => {
			const top = rowIndex * this.tileSize;
			row.forEach((col, colIndex) => {
				const left = colIndex * this.tileSize;
				const colWithBg = col.includes(bg) ? col : (bg + "," + col);
				colWithBg.split(',').forEach((cell) => {
					const tile = new PIXI.Sprite(terrein.textures[cell]);
					tile.x = left;
					tile.y = top;
					tile.zOrder = Z_GROUND;
					container.addChild(tile);
				});
			})
		});

		const objecten = this.kaartObjecten;
		if (objecten) {
			objecten.forEach((obj) => {
				const sprite = new PIXI.Sprite(terrein.textures[obj.tegel])
				sprite.x = obj.x * this.tileSize;
				sprite.y = obj.y * this.tileSize;
				container.addChild(sprite);
			});
		}

		box.addChild(container);

		return container;
	}

	Pixi.prototype.verplaatsKoe = function(koe, delta) {
		const beweging = delta * 3;
		let bewogen = false;
		if (koe.x != koe.meta.targetX) {
			const diff = Math.abs(koe.x - koe.meta.targetX);
			if (diff < beweging) {
				koe.x = koe.meta.targetX;
			} else if (koe.x > koe.meta.targetX) {
				koe.x -= beweging;
			} else {
				koe.x += beweging;
			}
			bewogen = true;
		}
		if (koe.y != koe.meta.targetY) {
			const diff = Math.abs(koe.y - koe.meta.targetY);
			if (diff < beweging) {
				koe.y = koe.meta.targetY;
			} else if (koe.y < koe.meta.targetY) {
				koe.y += beweging;
			} else {
				koe.y -= beweging;
			}
			bewogen = true;
		}
		if (bewogen) {
			this.focus(koe.x, koe.y, beweging);
		}
	};

	Pixi.prototype.focus = function(x, y, delta) {
		if (!this.focusArea) {
			this.focusArea = new PIXI.Graphics();
			this.focusArea.lineStyle(2, 0x00FF00);
			// this.box.addChild(this.focusArea); // For debugging, uncomment this line
		}
		const width = this.app.screen.width / this.app.stage.scale.x;
		const height = this.app.screen.height / this.app.stage.scale.y;
		console.debug("Screen", { width, height, sh: this.app.screen.height, sw: this.app.screen.width});

		let minX = 0.25 * width - this.box.x;
		let minY = 0.25 * height - this.box.y;
		let maxX = minX + (width * 0.5);
		let maxY = minY + (height * 0.5);
		if (maxX + 0.25 * width >= this.grond.width) {
			maxX = this.grond.width;
		}
		if (minX - 0.25 * width <= 0) {
			minX = 0;
		}
		if (minY - 0.25 * height <= 0) {
			minY = 0;
		}
		if (maxY + 0.25 * height >= this.grond.height) {
			maxY = this.grond.height;
		}
		this.focusArea.clear();
		this.focusArea.beginFill(0x00FF00, 0.25);
		this.focusArea.drawRect(minX, minY, maxX - minX, maxY - minY);
		this.focusArea.endFill();
		if (x > maxX) {
			//console.log('Move to the right');
			this.box.x -= delta;
		} else if (x < minX) {
			//console.log('Move to the left');
			this.box.x = Math.min(0, this.box.x + delta);
		}
		if (y > maxY) {
			//console.log('Move down');
			this.box.y -= delta;
		} else if (y < minY) {
			//console.log('Move up');
			this.box.y = Math.min(0, this.box.y + delta);
		}
	};

	window.Pages_Demo_Pixi = Pixi;

});