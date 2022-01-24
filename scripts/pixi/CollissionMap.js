(function() {

	function CollissionMap(container, debug) {
		this.areas = [];
		this.scale = 1;
		this.container = container;
		this.debug = debug;
	}

	CollissionMap.prototype.setScale = function(s) {
		this.scale = s;
	}

	CollissionMap.prototype.addHitArea = function(x, y, width, height) {
		this.areas.push({
			x1: x,
			y1: y,
			x2: x + width,
			y2: y + height
		});
	}

	CollissionMap.prototype.overlaps = function(x, y, width, height) {
		const x1 = x;
		const x2 = x + width;
		const y1 = y;
		const y2 = y + height;
		for(let i = 0, c = this.areas.length; i < c; i++) {
			const area = this.areas[i];
			if (x1 < area.x2 && x2 > area.x1 && y1 < area.y2 && y2 > area.y1) {
				if (this.debug && this.container) {
					const gfx = new PIXI.Graphics();
					gfx.beginFill(0x00FFFF, 0.3);
					gfx.drawRect(area.x1, area.y1, area.x2-area.x1, area.y1-area.y2);
					gfx.endFill();
					this.container.addChild(gfx);
					setTimeout(function() {
						gfx.parent.removeChild(gfx);
					}, 1000);
				}
				return true;
			}
		}
		return false;
	}

	CollissionMap.prototype.movementCheck = function(sprite) {
		const bounds = sprite;
		const originalX = bounds.x;
		const originalY = bounds.y;
		const cm = this;
		return {
			moveX (newX) {
				const bx = originalX - sprite.x + newX;
				const by = originalY;
				if (cm.overlaps(bx, by, sprite.width, sprite.height)) {
					return originalX;
				}
				return newX;
			},
			moveY (newY) {
				const bx = originalX;
				const by = originalY - sprite.y + newY;
				if (cm.overlaps(bx, by, sprite.width, sprite.height)) {
					return originalY;
				}
				return newY;
			}
		}
	}

	CollissionMap.prototype.render = function() {
		if (!this.debug) {
			return;
		}
		const container = this.container;
		const rect = function(x, y, w, h) {
			const g = new PIXI.Graphics();
			g.x = x;
			g.y = y;
			g.beginFill(0xFF0000, 0.25);
			g.drawRect(0, 0, w, h);
			g.endFill();
			return g;
		}
		this.areas.forEach((area) => {
			container.addChild(rect(area.x1, area.y1, area.x2-area.x1, area.y2-area.y1));
		});
	}

	window.Pixi_CollissionMap = CollissionMap;
})();