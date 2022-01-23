(function() {
	
	const lib = document.createElement('script');
	lib.src = 'https://pixijs.download/release/pixi.js';
	lib.type = 'text/javascript';
	document.body.appendChild(lib);

	function CanvasSize(app) {
		this.app = app;
		const canvas = this;
		window.addEventListener('resize', function() {
			console.log('resize');
			clearTimeout(window.canvasSizeTimer);
			window.canvasSizeTimer = setTimeout(() => { 
				canvas.onResize();
			}, 100);
		})
	}

	CanvasSize.prototype.onResize = function() {
		const pixi = this.pixi;
		if (!pixi) {
			console.warn("Pixi not found");
			return;
		}
		const app = pixi.app;
		if (!app) {
			console.warn("Pixi.app not found");
			return;
		}
		const view = app.view;
		if (!view) {
			console.warn("Pixi.app.view not found");
			return;
		}
		if (pixi.grond) {
			const scaleX = 1 / pixi.grond.width * view.offsetWidth;
			const scaleY = 1 / pixi.grond.height * view.offsetHeight;
			// We hebben een minimale schaal, omdat anders de iconen heel
			// erg klein worden.
			let scale = Math.max(1, Math.max(scaleX, scaleY));
			app.stage.scale.set(scale);
		}
	};

	const CANVAS = new CanvasSize();

	function Pixi(node) {
		this.node = node.querySelector('[data-pixi]');
		this.node.innerHTML = H_LAAD_ICON;
		this.waitForPixi();
		this.meta = {scale: 1};
	};

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

	const SS_FREE_DESERT = "assets/terrein/opa-free-desert/opa-free-desert.json";
	const Z_GROUND = 0;
	const Z_CHARACTERS = 1000;

	Pixi.prototype.loadPixi = function() {
		const pixi = this;
		const loader = new PIXI.Loader();
		loader
			.add('desert', SS_FREE_DESERT)
			.load((_, resources) => {
				pixi.startPixi(resources);
			});
	}	

	Pixi.prototype.startPixi = function(resources) {
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
		koe.x = 100;
		koe.y = 100;
		this.box.addChild(koe);

		// Om het spel wat te laten doen, sturen we hem maar naar het
		// midden van het scherm
		koe.meta = {targetX: this.grond.width / 2, targetY: this.grond.height / 2};

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

	Pixi.prototype.tekenDeGrond = function(box, resources) {
		const desert = resources.desert;
		const container = new PIXI.Container();

		const map = [
			['Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png'],
			['Tile_5.png','Tile_1.png', 'Tile_2.png', 'Tile_2.png,Object_16.png', 'Tile_3.png', 'Tile_5.png'],
			['Tile_5.png,Object_2.png','Tile_7.png', 'Tile_8.png', 'Tile_16.png', 'Tile_9.png', 'Tile_5.png'],
			['Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png', 'Tile_5.png,Object_14.png']
		];
		map.unshift([...map[0]]);
		map.push([...map[0]]);
		map.push([...map[0]]);
		map.push([...map[0]]);
		map.push([...map[0]]);
		map.push([...map[0]]);
		map.push([...map[0]]);

		const bg = 'Tile_5.png';

		map.forEach((row, rowIndex) => {
			const top = rowIndex * 256;
			row.push(bg);
			row.push(bg);
			row.unshift(bg);
			row.unshift(bg);
			row.forEach((col, colIndex) => {
				const left = colIndex * 256;
				const colWithBg = col.includes(bg) ? col : (bg + "," + col);
				colWithBg.split(',').forEach((cell) => {
					const tile = new PIXI.Sprite(desert.textures[cell]);
					tile.x = left;
					tile.y = top;
					tile.zOrder = Z_GROUND;
					container.addChild(tile);
				});
			})
		});

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


})();