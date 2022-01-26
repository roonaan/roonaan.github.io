(function() {

	function CollissionMap(container, debug) {
		this.areas = [];
		this.scale = 1;
		this.container = container;
		this.debug = debug;
	}

	let areaIdCounter = 0;

	CollissionMap.prototype.setScale = function(s) {
		this.scale = s;
	}

	CollissionMap.prototype.addHitArea = function(x, y, width, height, meta) {
		this.areas.push({
			x1: x,
			y1: y,
			x2: x + width,
			y2: y + height,
			areaId: 'area' + (++areaIdCounter),
			meta
		});
	}

	CollissionMap.prototype.merge = function(margin, iterations) {
		if (iterations > 10) {
			return this.merge(margin, 10);
		}
		if (iterations == 0) {
			return true;
		}

		this.areas.sort( (a, b) => {
			if (a.meta && !b.meta) {
				return 1;
			}
			if (!a.meta && b.meta) {
				return -1;
			}
			if (iterations %2 == 0 && a.x !== b.x) {
				return a.x > b.x ? 1 : -1;
			}
			if (a.y === b.y) {
				return 0;
			}
			return a.y > b.y ? 1 : -1;
		});

		const c = this.areas.length;

		for (let i = 1; i < c; i++) {
			const iArea = this.areas[i];
			if (iArea.meta) {
				break;
			}
			for (let j = 0; j < i; j++) {
				const jArea = this.areas[j];
				if (jArea.meta || jArea.merged) {
					continue;
				}
				if (Math.abs(iArea.x1 - jArea.x1) < margin && Math.abs(iArea.x2 - jArea.x2) < margin) {
					// Vertical match
					if (iArea.y1 <= (jArea.y2 + margin) && iArea.y2 >= (jArea.y1 -margin)) {
						jArea.y1 = Math.min(jArea.y1, iArea.y1);
						jArea.y2 = Math.max(jArea.y2, iArea.y2);
						iArea.merged = true;
						continue;
					}
				}
				if (Math.abs(iArea.y1 - jArea.y1) < margin && Math.abs(iArea.y2 - jArea.y2) < margin) {
					// Horiztonal match
					if (iArea.x1 <= (jArea.x2 + margin) && iArea.x2 >= (jArea.x1 -margin)) {
						jArea.x1 = Math.min(jArea.x1, iArea.x1);
						jArea.x2 = Math.max(jArea.x2, iArea.x2);
						iArea.merged = true;
						continue;
					}
				}
			}
		}

		this.areas = this.areas.filter(a => !a.merged);

		console.log('Before', c, 'After', this.areas.length);

		if (iterations > 0) {
			return this.merge(margin, iterations - 1);
		}
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
				return area.meta ? { areaId: area.areaId, ...area.meta } : { areaId: area.areaId };
			}
		}
		return false;
	}

	CollissionMap.prototype.remove = function(areaId) {
		this.areas = this.areas.filter( (arr) => arr.areaId != areaId);
	};

	CollissionMap.prototype.movementCheck = function(sprite, wiggle) {
		const bounds = sprite;
		const originalX = bounds.x;
		const originalY = bounds.y;
		const wiggleX = sprite.width * (wiggle || 0);
		const wiggleY = sprite.height * (wiggle || 0);
		const sizeX = sprite.width - 2 * wiggleX;
		const sizeY = sprite.height - 2 * wiggleY;
		const cm = this;
		return {
			moveX (newX) {
				const bx = originalX - sprite.x + newX;
				const by = originalY;
				if (cm.overlaps(bx + wiggleX, by + wiggleY, sizeX, sizeY)) {
					return originalX;
				}
				return newX;
			},
			moveY (newY) {
				const bx = originalX;
				const by = originalY - sprite.y + newY;
				if (cm.overlaps(bx + wiggleX, by + wiggleY, sizeX, sizeY)) {
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
			g.beginFill(0xFF00FF, 0.1);
			g.lineStyle(2, 0xFF0000);
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