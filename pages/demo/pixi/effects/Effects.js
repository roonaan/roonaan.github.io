getModules("GameStorage", "pixi/Engine", function (GameStorage, Engine) {
  if (!window.PIXI) {
    document.title = "Pixi is niet klaar";
  }

  class Effects {
    constructor(node) {
      this.node = node;
      this.previewNode = this.node.querySelector("[data-effects]");
      this.previewNode.innerHTML = "";
      http.getOnce("assets/effects/effects.json", (text) => {
        this.effects = JSON.parse(text);
        this.animations = [...this.effects.attacks];
        this.reload();
      });
    }

    reload() {
      const effects = this;
      const total = this.animations.length;
      const cols = Math.ceil(Math.sqrt(total));
      const rows = Math.floor(total / cols);
      const loader = new PIXI.Loader();
      loader.load((_, resources) => {
        const app = new PIXI.Application({
          width: effects.previewNode.offsetWidth,
          height: effects.previewNode.offsetHeight,
          backgroundAlpha: 0.25,
          resizeTo: effects.previewNode,
        });
        this.previewNode.appendChild(app.view);

        const tileX = Math.floor(effects.previewNode.offsetWidth / cols);
        const tileY = Math.floor(effects.previewNode.offsetHeight / rows);

        let x = 0;
        let y = 0;

        const container = new PIXI.Container();
        app.stage.addChild(container);

        const size = effects.ef

        effects.animations.forEach( (anim) => {
            this.getAndRender(container, anim, x * tileX, y * tileY, tileX, tileY);

            x += 1;
            if (x >= cols) {
                x = 0;
                y += 1;
            }
        });
      });
    }

    getAndRender(container, animatie, x, y, width, height) {
        const border = new PIXI.Graphics();
        container.addChild(border);
        border.x = x;
        border.y = y;
        border.lineStyle(2, 0xFFD700);
        border.beginFill(0xFFD700, 0.2);
        border.drawRect(0, 0, height, width);
        border.endFill();
        http.getOnce('assets/effects/' + animatie + ".json", (configText) => {
            const rawConfig = JSON.parse(configText);
            const config = PIXI.particles.upgradeConfig(rawConfig, rawConfig.art || 'assets/gekkekoe.png');
            if (!rawConfig.behaviors && config.behaviors) {
                console.warn("Upgraded JSON is ", animatie, JSON.stringify(config));
            }
            const emitContainer = new PIXI.Container();     
            emitContainer.x = x + 0.5 * width;
            emitContainer.y = y + 0.5 * height;
            container.addChild(emitContainer);
            config.autoUpdate = true;
            config.anim = config.anim || {};
            config.destroyWhenComplete = true;
            try {
                const emitter = new PIXI.particles.Emitter(
                    emitContainer,
                    config
                );
                setInterval(() => {
                    new PIXI.particles.Emitter(
                        emitContainer,
                        config
                    );
                }, 5000);
            } catch (e) {
                console.log("Could not render " + animatie, e);
                const text = new PIXI.Text(e.message, {
                    fontSize: 12,
                    wordWrap: true,
                    width
                });
                text.x = x + 5;
                text.y = y + 5;
                container.addChild(text);
            }
            // setTimeout(() => {
            //     text.parent.removeChild(text);
            //     text.destroy();
            //     emitContainer.parent.removeChild(emitContainer);
            //     emitContainer.destroy();
            //     emitter.autoUpdate = false;
            //     emitter.emit = false;
            //     emitter.destroy();
            // }, (1 + config.emitterLifetime * 1000));
        })
    }
  }

  window.Pages_Demo_Pixi_Effects = Effects;
});
