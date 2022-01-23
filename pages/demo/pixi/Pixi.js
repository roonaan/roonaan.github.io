(function() {
	

	const lib = document.createElement('script');
	lib.src = 'https://pixijs.download/release/pixi.js';
	lib.type = 'text/javascript';
	document.body.appendChild(lib);

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
		this.node.appendChild(app.view);


		this.tekenDeGrond(app, resources);

		const sprite = PIXI.Sprite.from("assets/gekkekoe.png");
		sprite.height = 100;
		sprite.width = 100;
		//sprite.anchor.x = 50;
		//sprite.anchor.y = 50;
		app.stage.addChild(sprite);

		let counter = 0;
		app.ticker.add( (delta) => {
			counter += delta;
			sprite.x = 100 + Math.sin(counter / 20) * 100;
			sprite.y = 100 + Math.cos(counter / -20) * 100;
			//sprite.rotation = (counter % 360) / 10;
		})
		sprite.interactive = true;
		sprite.on('pointerdown', () => {
			sprite.rotation += 90;
		});
		sprite.zOrder = Z_CHARACTERS;
	
	};

	Pixi.prototype.tekenDeGrond = function(app, resources) {
		const desert = resources.desert;

		const map = [
			['Tile_1.png', 'Tile_2.png', 'Tile_2.png', 'Tile_3.png'],
			['Tile_7.png', 'Tile_8.png', 'Tile_16.png', 'Tile_9.png']
		];

		console.log(desert);

		map.forEach((row, rowIndex) => {
			const top = rowIndex * 256;
			row.forEach((col, colIndex) => {
				const left = colIndex * 256;
				const tile = new PIXI.Sprite(desert.textures[col]);
				tile.x = left;
				tile.y = top;
				tile.zOrder = Z_GROUND;
				app.stage.addChild(tile);
			})
		});
	}

	window.Pages_Demo_Pixi = Pixi;


})();