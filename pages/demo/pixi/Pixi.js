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
			canvas.onResize();
		})
	}

	CanvasSize.prototype.onResize = function() {
		if (this.app) {
			console.debug('Adjusting viewport');
			this.app.view.style.height = this.app.view.parentNode.offsetHeight;
			this.app.view.style.width = this.app.view.parentNode.offsetWidth;
			this.app.resize();
		}
	};

	const CANVAS = new CanvasSize();

	function Pixi(node) {
		this.node = node.querySelector('[data-pixi]');
		this.node.innerHTML = 'Pixi komt hier';
		this.waitForPixi();
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
		const pixi = this;
		const app = new PIXI.Application({
			width: pixi.node.offsetWidth,
			height: pixi.node.offsetHeight,
			transparent: true
		});
		CANVAS.app = app;
		this.node.appendChild(app.view);

		const grond = this.tekenDeGrond(app, resources);

		const koe = PIXI.Sprite.from("assets/gekkekoe.png");
		koe.anchor.set(0.5);
		koe.height = 100;
		koe.width = 100;
		app.stage.addChild(koe);

		koe.meta = {targetX: app.screen.width / 2, targetY: app.screen.height / 2};

		app.ticker.add( (delta) => {
			if (koe.x != koe.meta.targetX) {
				const diff = Math.abs(koe.x - koe.meta.targetX);
				if (diff < delta) {
					koe.x = koe.meta.targetX;
				} else if (koe.x > koe.meta.targetX) {
					koe.x -= delta;
				} else {
					koe.x += delta;
				}
			}
			if (koe.y != koe.meta.targetY) {
				const diff = Math.abs(koe.y - koe.meta.targetY);
				if (diff < delta) {
					koe.y = koe.meta.targetY;
				} else if (koe.y < koe.meta.targetY) {
					koe.y += delta;
				} else {
					koe.y -= delta;
				}
			}
		})
		koe.zOrder = Z_CHARACTERS;
	
		grond.interactive = true;
		grond.on("pointerdown", (ev) => {
			koe.meta.targetX = ev.data.global.x;
			koe.meta.targetY = ev.data.global.y;
		});
	};

	Pixi.prototype.tekenDeGrond = function(app, resources) {
		const desert = resources.desert;
		const container = new PIXI.Container();

		const map = [
			['Tile_1.png', 'Tile_2.png', 'Tile_2.png,Object_16.png', 'Tile_3.png'],
			['Tile_7.png', 'Tile_8.png', 'Tile_16.png', 'Tile_9.png']
		];

		map.forEach((row, rowIndex) => {
			const top = rowIndex * 256;
			row.forEach((col, colIndex) => {
				const left = colIndex * 256;
				col.split(',').forEach((cell) => {
					const tile = new PIXI.Sprite(desert.textures[cell]);
					tile.x = left;
					tile.y = top;
					tile.zOrder = Z_GROUND;
					container.addChild(tile);
				});
			})
		});

		app.stage.addChild(container);
		container.x = app.screen.width / 2;
		container.y = app.screen.height / 2;
		container.pivot.x = container.width / 2;
		container.pivot.y = container.height / 2;
		container.scale.set(0.5);

		return container;
	}

	window.Pages_Demo_Pixi = Pixi;


})();