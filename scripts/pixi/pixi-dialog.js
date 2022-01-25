(function() {
	
	function Dialog(container, resources) {
		this.resources = resources;
		this.container = container;

		console.log('Dialog data', resources);

		this.inner = new PIXI.Container();

		this.frame = new PIXI.Container();

		const margin = 10;

		const x1 = margin;
		const x2 = window.innerWidth - margin;
		const y1 = margin;
		const y2 = window.innerHeight - margin;

		const topLeft = PIXI.Sprite.from(resources.textures.topLeft);
		topLeft.x = x1;
		topLeft.y = y1;

		const topRight = PIXI.Sprite.from(resources.textures.topRight);
		topRight.x = x2 - 100;
		topRight.y = y1;

		const bottomLeft = PIXI.Sprite.from(resources.textures.bottomLeft);
		bottomLeft.x = x1;
		bottomLeft.y = y2 - 40;

		const bottomRight = PIXI.Sprite.from(resources.textures.bottomRight);
		bottomRight.x = x2 - 100;
		bottomRight.y = y2 - 40;

		const top = PIXI.TilingSprite.from(resources.textures.top, {
			width: x2 - x1 - 200,
			height: 40
		});
		top.x = x1 + 100;
		top.y = margin;

		const bottom = PIXI.TilingSprite.from(resources.textures.bottom, {
			width: x2 - x1 - 200,
			height: 40
		});
		bottom.x = x1 + 100;
		bottom.y = y2 - 40;

		const left = PIXI.TilingSprite.from(resources.textures.left, {
			width: 100,
			height: bottomLeft.y - topLeft.y - topLeft.height
		});
		left.x = topLeft.x;
		left.y = topLeft.y + topLeft.height;

		const right = PIXI.TilingSprite.from(resources.textures.right, {
			width: 100,
			height: bottomRight.y - topRight.y - topRight.height
		});
		right.x = x2 - 100;
		right.y = y1 + 40;

		const center = PIXI.TilingSprite.from(resources.textures.center, {
			width: x2 - x1 - 200,
			height: y2 - y1 - 80
		});
		center.x = x1 + 100;
		center.y = y1 + 40;

		this.frame.addChild(top, bottom, left, right, center, topLeft, topRight, bottomLeft, bottomRight);

		container.addChild(
			this.inner,
			this.frame
		);
	}

	Dialog.prototype.hide = function() {
		this.inner.renderable = false;
		this.frame.renderable = false;
	};

	Dialog.prototype.show = function() {
		this.inner.renderable = true;
		this.frame.renderable = true;
	};

	PIXI.game = PIXI.game || {};
	PIXI.game.Dialog = Dialog;

})();