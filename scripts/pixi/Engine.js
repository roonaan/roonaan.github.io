(function() {
    
    const coreLibraries = [
		'libs/pixi.6.2.1.dev.js',
		'libs/pixi-layers.min.js'
	];

    const extraLibraries = [
        'scripts/pixi/pixi-dialog.js',
		'scripts/pixi/pixi-gevecht.js'
    ];

    function loadLibraries(librariesToLoadParam, callback) {
		if (librariesToLoadParam.length === 0) {
			callback();
			return;
		}
        const librariesToLoad = [...librariesToLoadParam];
		const src = librariesToLoad.shift();
        const id = 'lib-' + src.replace(/\W+/g, '-', src);
        if (document.getElementById(id)) {
            loadLibraries(librariesToLoad, callback);
        } else {
            const lib = document.createElement('script');
            lib.id = id;
            lib.addEventListener('load', () => loadLibraries(librariesToLoad, callback));
            lib.addEventListener('error', () => loadLibraries(librariesToLoad, callback));
            lib.type = 'text/javascript';
            lib.src = src;
            document.body.appendChild(lib);
        }
	}

    loadLibraries(coreLibraries, () => {
        class Engine {
            coreEngine(callback) {
                loadLibraries(coreLibraries, callback);
            }
            battleEngine(callback) {
                this.coreEngine(() => loadLibraries(extraLibraries, callback));
            }
        }

        window.Pixi_Engine = new Engine();
    });
})();