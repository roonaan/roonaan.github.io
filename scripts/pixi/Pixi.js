getModule('CanvasSize', function(CANVAS) {
	
	const librariesToLoad = [
		'libs/pixi.6.2.1.dev.js',
		'libs/pixi-layers.min.js',
		'scripts/pixi/pixi-dialog.js'
	];

	function loadLibraries(callback) {
		if (librariesToLoad.length === 0) {
			callback();
			return;
		}
		const src = librariesToLoad.shift();
		const lib = document.createElement('script');
		lib.addEventListener('load', () => loadLibraries(callback));
		lib.addEventListener('error', () => loadLibraries(callback));
		lib.type = 'text/javascript';
		lib.src = src;
		document.body.appendChild(lib);
	}

	const VijandDetails = {};

	const sharedSprites = {
		kampvuur: "assets/terrein/oga-camp-fire-animation-for-rpgs-finished/kampvuur.json"
	}

	let CollissionMap = undefined;

	getModule('pixi/CollissionMap', function(cm) {
		CollissionMap = cm;
	});

	function kiesVijand(lijst) {
		const gekozen = lijst[0];
		const details = VijandDetails[gekozen.vijand];
		return {
			...gekozen,
			...details
		};
	}

	function Pixi(node) {
		const pixi = this;
		this.node = node;
		this.node.innerHTML = H_LAAD_ICON;
		this.vijandDetails = {};
		this.resources = {};
		this.collisionMap = [];
		const gevecht = this.node.getAttribute('data-pixi') || 'gevecht-1-1-4';
		if (!gevecht) {
			this.node.innerHTML = 'Geen gevecht geselecteerd';
		} else {
			loadLibraries(() => {
				this.laadGevechtsGegevens(gevecht);
				this.waitForGegevens();
				this.meta = {scale: 1};
			});
		}
	};

	Pixi.prototype.waitForGegevens = function() {
		const pixi = this;
		if (!this.terrein || !this.kaart || !this.tileSize || !CollissionMap) {
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
		Object.keys(pixi.resources).forEach( function(key) {
			console.debug('Extra grafics die geladen moeten worden', key);
			loader = loader.add(key, pixi.resources[key]);
		});
		loader
			.add('terrein', this.terrein)
			.add('portals', 'assets/terrein/oga-explosion-effects-and-more/effect95.json')
			.add('dialog', 'assets/ui/oga-lpc-pennomis-ui-elements/dialog.json')
			.load((_, resources) => {
				pixi.startPixi(resources);
			});
	}	

	Pixi.prototype.startPixi = function(resources) {

		console.debug('We loaded the following resources', Object.keys(resources));

		CANVAS.pixi = this;
		const pixi = this;
		const app = new PIXI.Application({
			width: pixi.node.offsetWidth,
			height: pixi.node.offsetHeight,
			backgroundAlpha: 0,
			resizeTo: this.node
		});
		this.app = app;
		this.node.innerHTML = '';
		this.node.appendChild(app.view);

		// De "box" hebben we nodig, zodat we kunnen scrollen als
		// de speler uit het scherm dreigt te lopen.
		this.box = new PIXI.Container();
		this.collissionMap = new CollissionMap(this.box, false);
		this.eventMap = new CollissionMap(this.box, false);
		app.stage.addChild(this.box);
		this.grond = this.tekenDeGrond(this.box, resources);

		// We laden onze speler
		const speler = PIXI.Sprite.from("karakters/Greta/oertijd-greta.png");
		//speler.anchor.set(0.5);
		speler.height = 100;
		speler.width = 100;
		if (pixi.startPunt) {
			speler.x = 50 + pixi.startPunt[0] * pixi.tileSize;
			speler.y = 50 + pixi.startPunt[1] * pixi.tileSize;
			speler.meta = {
				targetX: speler.x,
				targetY: speler.y
			}
		} else {
			speler.x = 100;
			speler.y = 100;
			// Om het spel wat te laten doen, sturen we hem maar naar het
			// midden van het scherm
			speler.meta = {targetX: this.grond.width / 2, targetY: this.grond.height / 2};
		}
		speler.zOrder = speler.y;
		this.box.addChild(speler);
		this.box.sortableChildren = true;

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
				pixi.registerEventArea(sprite, () => {
					console.log('Een gevecht begint');
					sprite.parent.removeChild(sprite);
				});
			});
		}


		// Elke paar seconden moeten we de speler verplaatsen
		app.ticker.add( (delta) => {
			pixi.verplaatsspeler(speler, delta);
		})
	
		// Als we klikken, dan moet de speler daarheen.
		this.grond.interactive = true;
		this.grond.on("pointerdown", (ev) => {
			speler.meta.targetX = (ev.data.global.x - pixi.box.x) / pixi.box.scale.x;
			speler.meta.targetY = (ev.data.global.y - pixi.box.y) / pixi.box.scale.y;
			// const gfx = new PIXI.Graphics();
			// gfx.lineStyle(2, 0x0000FF);
			// gfx.drawRect(speler.meta.targetX - 2, speler.meta.targetY - 2, 4, 4);
			// gfx.endFill();
			// this.box.addChild(gfx);
			// setTimeout(() => {
			// 	gfx.parent.removeChild(gfx);
			// }, 2000);
		});

		if (this.collissionMap.debug) {
			this.collissionMap.render();
		}
		if (this.eventMap.debug) {
			this.eventMap.render();
		}

		this.dialog = new PIXI.game.Dialog(app.stage, resources.dialog);
		this.dialog.hide();

		// Voor de zekerheid resizen we naar het scherm
		CANVAS.onResize();
	};

	Pixi.prototype.registerEventArea = function(sprite, callback) {
		this.eventMap.addHitArea(sprite.x, sprite.y, this.tileSize, this.tileSize, {
			callback
		});
	};

	Pixi.prototype.laadGevechtsGegevens = function(naam) {
		const pixi = this;
		http.get('gevechten/' + naam + '.json?' + new Date().getTime(), function(text) {
			const json = JSON.parse(text);
			const kaart = json.kaart;
			pixi.startPunt = json['start-punt'];
			pixi.vijanden = json.vijanden;
			pixi.terrein = kaart.terrein;
			if (kaart.shared) {
				kaart.shared.forEach( (sh) => {
					pixi.resources[sh] = sharedSprites[sh];
				});
			}
			pixi.tileSize = kaart.tileSize;
			pixi.eindPunt = json['eind-punt'];
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
		box.addChild(container);
		const collision = this.collissionMap;

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
					this.addCollission(terrein, cell, left, top, collision);
				});
			})
		});

		collision.merge(0.1 * this.tileSize, 15);

		const objecten = this.kaartObjecten;
		if (objecten) {
			objecten.forEach((obj) => {
				let sprite;
				if (obj.tegel) {
					sprite = new PIXI.Sprite(terrein.textures[obj.tegel])
					sprite.x = obj.x * this.tileSize;
					sprite.y = obj.y * this.tileSize;
					sprite.zOrder = sprite.y;
					container.addChild(sprite);
				} else if (obj.animatie) {
					let set = 'terrein';
					let ani = obj.animatie;
					if (obj.animatie.includes('#')) {
						const set_ani = obj.animatie.split('#');
						set = set_ani[0];
						ani = set_ani[1];
					}
					sprite = new PIXI.AnimatedSprite(resources[set].spritesheet.animations[ani]);
					sprite.x = obj.x * this.tileSize;
					sprite.y = obj.y * this.tileSize;
					sprite.zOrder = sprite.y;
					if (obj.scale) {
						sprite.scale.set(obj.scale);
					}
					sprite.animationSpeed = obj.snelheid || 0.5;
					sprite.play();
					container.addChild(sprite);
				}
				if (sprite && obj.beloning) {
					this.registerEventArea(sprite, () => {
						sprite.parent.removeChild(sprite);
						console.log('Er is een beloning!');
						getModule('Inventory', function(Inv) {
							if (obj.beloning.eenmalig) {
								obj.beloning.eenmalig.forEach( (bel) => {
									Inv.addItem(bel[0], bel[1]);
								})
							}
						});
					})
				}
			});
		}

		if (this.eindPunt) {
			this.tekenEindPunt(resources, container, this.eindPunt[0], this.eindPunt[1]);
			this.exitPoint = {
				x1: this.eindPunt[0] * this.tileSize,
				x2: (this.eindPunt[0] + 1) * this.tileSize,
				y1: this.eindPunt[1] * this.tileSize,
				y2: (this.eindPunt[1] + 1) * this.tileSize
			}
		}
	
		return container;
	}

	Pixi.prototype.addCollission = function(spritesheet, naam, left, top, collissionMap) {
		if (!spritesheet || !naam || !collissionMap) {
			return;
		}
		const frame = spritesheet.data?.frames?.[naam];
		if (!frame || !frame.collision || frame.collision.length < 1) {
			console.debug('No frame data for', naam);
			return;
		}
		const blocks = frame.collision;
		const x1 = left;
		const x2 = left + Math.ceil(0.33 * this.tileSize);
		const x3 = left + Math.ceil(0.66 * this.tileSize);
		const s = Math.ceil(0.33 * this.tileSize);
		const y1 = top;		
		const y2 = top + Math.ceil(0.33 * this.tileSize);
		const y3 = top + Math.ceil(0.66 * this.tileSize);	

		if (blocks.includes(7)) {
			collissionMap.addHitArea(x1, y1, s, s);
		}
		if (blocks.includes(8)) {
			collissionMap.addHitArea(x2, y1, s, s);
		}
		if (blocks.includes(9)) {
			collissionMap.addHitArea(x3, y1, s, s);
		}
		if (blocks.includes(4)) {
			collissionMap.addHitArea(x1, y2, s, s);
		}
		if (blocks.includes(5)) {
			collissionMap.addHitArea(x2, y2, s, s);
		}
		if (blocks.includes(6)) {
			collissionMap.addHitArea(x3, y2, s, s);
		}
		if (blocks.includes(1)) {
			collissionMap.addHitArea(x1, y3, s, s);
		}
		if (blocks.includes(2)) {
			collissionMap.addHitArea(x2, y3, s, s);
		}
		if (blocks.includes(3)) {
			collissionMap.addHitArea(x3, y3, s, s);
		}
	}

	Pixi.prototype.tekenEindPunt = function(resources, container, x, y) {
		console.debug("resources", Object.keys(resources), resources.portals);
		const gfx = new PIXI.AnimatedSprite(resources.portals.spritesheet.animations.klein);
		gfx.animationSpeed = 0.05;
		gfx.x = (x + 0.25) * this.tileSize; // De correctie is nodig, vanwege het ankerpunt van de animatie
		gfx.y = (y + 0.25) * this.tileSize; // De correctie is nodig, vanwege het ankerpunt van de animatie
		gfx.play();
		container.addChild(gfx);
	};

	Pixi.prototype.verplaatsspeler = function(speler, delta) {
		const originalX = speler.x;
		const originalY = speler.y;
		const beweging = delta * 3;
		const check = this.collissionMap.movementCheck(speler, 0.1);

		if (speler.x != speler.meta.targetX) {
			const diff = Math.abs(speler.x - speler.meta.targetX);
			if (diff < beweging) {
				speler.x = check.moveX(speler.meta.targetX);
			} else if (speler.x > speler.meta.targetX) {
				speler.x = check.moveX(speler.x - beweging);
			} else {
				speler.x = check.moveX(speler.x + beweging);
			}
		}
		if (speler.y != speler.meta.targetY) {
			const diff = Math.abs(speler.y - speler.meta.targetY);
			if (diff < beweging) {
				speler.y = check.moveY(speler.meta.targetY);
			} else if (speler.y > speler.meta.targetY) {
				speler.y = check.moveY(speler.y - beweging);
			} else {
				speler.y = check.moveY(speler.y + beweging);
			}
			speler.zOrder = speler.y;
		}
		const bewogen = speler.x != originalX || speler.y != originalY;
		if (bewogen) {
			this.focus(speler.x, speler.y, beweging);
			const overlap = this.eventMap.overlaps(speler.x, speler.y, speler.width, speler.height);
			if (overlap) {
				console.log('Er moet iets gebeuren', overlap);
				this.eventMap.remove(overlap.areaId);
				if (overlap.callback) {
					overlap.callback(overlap);
				}
			}
		} else {
			speler.meta.targetX = speler.x;
			speler.meta.targetY = speler.y;
		}
		if (bewogen && this.exitPoint) {
			if (
				speler.x > this.exitPoint.x1
				&& speler.x < this.exitPoint.x2
				&& speler.y > this.exitPoint.y1
				&& speler.y < this.exitPoint.y2
				) {

				if (!this.dispatchedCompleteEvent) {
					let alpha = 100;
					const box = this.app.stage;
					const gfx = new PIXI.Graphics();
					gfx.alpha = 0;
					gfx.beginFill(0xFFFFFF);
					gfx.drawRect(0, 0, box.width, box.height);
					gfx.endFill();
					box.addChild(gfx);
					const ticker = new PIXI.Ticker();
					ticker.add((delta) => {
						gfx.alpha = Math.min(1, 1 - alpha / 100);
						alpha -= delta;
						if (alpha <= -50) {
							ticker.destroy();
							console.log('We zijn hier klaar. Het gevecht is over');
							this.node.dispatchEvent(new CustomEvent('gevecht-complete', { bubbles: true}));							
						}
					});
					ticker.start();
					this.dispatchedCompleteEvent = true;
				}
			}
		}
	};

	Pixi.prototype.focus = function(x, y, delta) {
		if (!this.focusArea) {
			this.focusArea = new PIXI.Graphics();
			// this.box.addChild(this.focusArea); // For debugging, uncomment this line
		}
		const width = this.app.screen.width / this.box.scale.x;
		const height = this.app.screen.height / this.box.scale.y;
		// console.debug("Screen", { width, height, sh: this.app.screen.height, sw: this.app.screen.width});

		let minX = 0.25 * width - this.box.x / this.box.scale.x;
		let minY = 0.25 * height - this.box.y / this.box.scale.y;
		let maxX = minX + (width * 0.5);
		let maxY = minY + (height * 0.4);
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
		this.focusArea.lineStyle(2, 0x00FF00);
		this.focusArea.beginFill(0x00FF00, 0.25);
		this.focusArea.drawRect(minX, minY, maxX - minX, maxY - minY);
		this.focusArea.endFill();
		if (x > maxX) {
			//console.log('Move to the right');
			this.box.x = Math.max(this.box.x - delta, 0 - this.grond.width * this.box.scale.x + this.app.screen.width);
		} else if (x < minX) {
			//console.log('Move to the left');
			this.box.x = Math.min(0, this.box.x + delta);
		}
		if (y > maxY) {
			//console.log('Move down');
			this.box.y = Math.max(this.box.y - delta, 0 - this.grond.height * this.box.scale.y + this.app.screen.height);
		} else if (y < minY) {
			//console.log('Move up');
			this.box.y = Math.min(0, this.box.y + delta);
		}
	};

	window.Pixi_Pixi = Pixi;

});