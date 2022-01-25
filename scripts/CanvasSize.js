(function() {
	function CanvasSize() {
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
			const shortestSide = Math.min(window.innerHeight, window.innerWidth);
			const minSize = Math.ceil(shortestSide / 12);
			const minScale = 1 / 100 * minSize;
			// We hebben een minimale schaal, omdat anders de iconen heel
			// erg klein worden.
			let scale = Math.max(minScale, Math.max(scaleX, scaleY));
			app.stage.scale.set(scale);
		}
	};

	window.CanvasSize = new CanvasSize();
})();