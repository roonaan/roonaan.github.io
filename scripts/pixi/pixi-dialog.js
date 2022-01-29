(function() {
	
	function Dialog(container, resources) {
		const tx_dialog = resources.dialog.textures;
		const tx_dialogx = resources.dialog_x.textures;
		this.container = container;

		this.inner = new PIXI.Container();
		this.frame = new PIXI.Container();

		const margin = 10;

		const x1 = margin;
		const x2 = window.innerWidth - margin;
		const y1 = margin;
		const y2 = window.innerHeight - margin;

		this.x = x1;
		this.y = y1;
		this.width = x2 - x1;
		this.height = y2 - y1;

		this.framePadding = 10;
		this.inner.x = x1 + this.framePadding;
		this.inner.y = y1 + this.framePadding;
		this.innerWidth = x2 - x1 - 2 * this.framePadding;
		this.innerHeight = y2 - y1 - 2 * this.framePadding;

		const topLeft = PIXI.Sprite.from(tx_dialog.topLeft);
		topLeft.x = x1;
		topLeft.y = y1;

		const topRight = PIXI.Sprite.from(tx_dialog.topRight);
		topRight.x = x2 - 100;
		topRight.y = y1;

		const bottomLeft = PIXI.Sprite.from(tx_dialog.bottomLeft);
		bottomLeft.x = x1;
		bottomLeft.y = y2 - 40;

		const bottomRight = PIXI.Sprite.from(tx_dialog.bottomRight);
		bottomRight.x = x2 - 100;
		bottomRight.y = y2 - 40;

		const top = PIXI.TilingSprite.from(tx_dialog.top, {
			width: x2 - x1 - 200,
			height: 40
		});
		top.x = x1 + 100;
		top.y = margin;

		const bottom = PIXI.TilingSprite.from(tx_dialog.bottom, {
			width: x2 - x1 - 200,
			height: 40
		});
		bottom.x = x1 + 100;
		bottom.y = y2 - 40;

		const left = PIXI.TilingSprite.from(tx_dialog.left, {
			width: 100,
			height: bottomLeft.y - topLeft.y - topLeft.height
		});
		left.x = topLeft.x;
		left.y = topLeft.y + topLeft.height;

		const right = PIXI.TilingSprite.from(tx_dialog.right, {
			width: 100,
			height: bottomRight.y - topRight.y - topRight.height
		});
		right.x = x2 - 100;
		right.y = y1 + 40;

		const center = PIXI.TilingSprite.from(tx_dialog.center, {
			width: x2 - x1 - 200,
			height: y2 - y1 - 80
		});
		center.x = x1 + 100;
		center.y = y1 + 40;

		this.frame.addChild(top, bottom, left, right, center, topLeft, topRight, bottomLeft, bottomRight);

		const innerGfx = new PIXI.Graphics();
		innerGfx.beginFill(0x006600, 0.2);
		innerGfx.drawRect(0, 0, this.innerWidth, this.innerHeight);
		innerGfx.endFill();
		this.inner.addChild(innerGfx);

		this.button = PIXI.Sprite.from(tx_dialogx.up);
		this.button.x = x2 - 35;
		this.button.y = y1 + 10;
		this.button.interactive = true;

		this.background = new PIXI.Container();
		this.background.mask = new PIXI.Graphics();
		this.background.mask.beginFill(0xFFFFFF, 1);
		const m = 5;
		const m2 = m * 2;
		this.background.mask.drawRect(this.x + m, this.y + m, this.width - m2, this.height - m2);
		this.background.mask.endFill();
		
		container.addChild(
			this.frame,
			this.background,
			this.inner,
			this.button
		);
	}

	Dialog.prototype.close = function() {
		this.inner.visible = false;
		this.frame.visible = false;
		this.visible = false;
		this.button.visible = false;
		this.background.visible = false;
		console.log(this.inner);
		if (this.inner.children.length > 1) {
			this.inner.removeChildren(1);
		}
	};

	Dialog.prototype.open = function(evtHandler) {
		this.visible = true;
		this.evtHandler = evtHandler;
		this.inner.visible = true;
		this.frame.visible = true;
		this.button.visible = true;
		this.background.visible = true;
		this.evtHandler('show', {
			container: this.inner,
			height: this.width,
			width: this.width
		});
		this.button.interactive = true;
		this.button.on("pointerup", () => {
			if (evtHandler) {
				evtHandler("cancel");
			}
		});
	};

	Dialog.prototype.setAchtergrond = function(asset) {
		this.background.removeChildren();
		if (asset) {
			const bg = new PIXI.Sprite(asset.texture);
			const margin = 5;
			this.background.addChild(bg);
			const factor = Math.max(this.height / bg.height, this.width / bg.width);
			bg.height = this.height / factor;
			bg.width = this.width / factor;
			bg.x = (this.width - bg.width) / 2;
			bg.y = (this.height - bg.height) / 2;
		}
	}

	PIXI.game = PIXI.game || {};
	PIXI.game.Dialog = Dialog;

})();