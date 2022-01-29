getModules('GameStorage', 'pixi/Engine', function(GameStorage) {
    if (!window.PIXI) {
        document.title = 'Pixi is niet klaar';
    }

    const STORE = new GameStorage('editor');

    class Editor {

        constructor(node) {
            const editor = this;
            this.node = node;
            this.previewNode = node.querySelector('[data-preview]');
            this.editorNode = node.querySelector('[data-editor]');
            this.spriteList = node.querySelector('[data-sprites]');

            this.model = STORE.getItem('model');
            console.log('Latest model', this.model);
            if (!this.model) {
                [0,1,2,3,4].forEach( (row) => {
                    [0, 1, 2, 3, 4].forEach( (col) => {
                        this.setCell(row, col, 'Tile_5');
                    })
                });
                this.setTerrein('assets/terrein/opa-free-desert/opa-free-desert.json');
            }
            this.editorTemplate = Handlebars.compile(node.querySelector('#editor-tpl').innerHTML);
            this.reload();

            node.querySelector('[data-export]').addEventListener('click', () => {
                document.addEventListener('copy', function(e) {
                    const tegels = editor.getTegels();
                    const terrein = editor.model.kaart.terrein;
                    const data = {
                        tegels, terrein
                    };
                    e.clipboardData.setData('text/plain', JSON.stringify(data, null, '  '));
                    e.preventDefault();
                  });
                  document.execCommand('copy');
            });
        }

        reload() {
            const editor = this;
            editor.editorNode.innerHTML = this.editorTemplate({});

            const resourceMapping = {
                terrein: this.model.kaart.terrein
            }

            const loader = new PIXI.Loader();
            loader.add('terrein', this.model.kaart.terrein);
            loader.load((_, resources) => {
                editor.resources = resources;
                const app = new PIXI.Application({
                    width: editor.previewNode.offsetWidth,
                    height: editor.previewNode.offsetHeight,
                    backgroundAlpha: 0.25,
                    resizeTo: editor.previewNode
                });
                editor.tileSize = 80;
                editor.pixi = app;
                editor.previewNode.innerHTML = '';
                editor.previewNode.appendChild(this.pixi.view);
                editor.box = new PIXI.Container();
                app.stage.addChild(editor.box);
                editor.addHud();
                editor.render();
                editor.renderSpriteList();
            });
        }

        getTegels() {
            return this.model.kaart.tegels.reduce( (acc, row) => {
                const cells = [...row];
                while(cells.length > 0 && cells[cells.length-1] == '') {
                    cells.pop();
                }
                if (cells.length > 0) {
                    acc.push(cells);
                }
                return acc;
            }, []);;
        }

        save() {
            this.model.kaart.tegels = this.getTegels();
            STORE.setItem('model', this.model);
            console.log('We saved the model', this.model);
        }

        addHud() {
            const leftBtn = document.createElement('button');
            leftBtn.innerText = 'L';
            leftBtn.style.position = 'absolute';
            leftBtn.style.top = '50%';
            leftBtn.style.left = '0%';
            leftBtn.addEventListener('click', () => {
                this.box.x += 80;
            });
            const rightBtn = document.createElement('button');
            rightBtn.innerText = 'R';
            rightBtn.style.position = 'absolute';
            rightBtn.style.top = '50%';
            rightBtn.style.right = '0%';
            rightBtn.addEventListener('click', () => {
                this.box.x -= 80;
            });
            const upButton = document.createElement('button');
            upButton.innerText = 'U';
            upButton.style.position = 'absolute';
            upButton.style.left = '50%';
            upButton.style.top = '0%';
            upButton.addEventListener('click', () => {
                this.box.y += 80;
            });
            const downButton = document.createElement('button');
            downButton.innerText = 'D';
            downButton.style.position = 'absolute';
            downButton.style.left = '50%';
            downButton.style.bottom = '0%';
            downButton.addEventListener('click', () => {
                this.box.y -= 80;
            });
            const inButton = document.createElement('button');
            inButton.innerText = 'Zoom In';
            inButton.style.position = 'absolute';
            inButton.style.left = '0px';
            inButton.style.bottom = '0%';
            inButton.addEventListener('click', () => {
                this.tileSize += 10;
                this.render();
            });
            const outButton = document.createElement('button');
            outButton.innerText = 'Zoom Out';
            outButton.style.position = 'absolute';
            outButton.style.left = '100px';
            outButton.style.bottom = '0%';
            outButton.addEventListener('click', () => {
                this.tileSize = Math.max(10, this.tileSize - 10);
                this.render();
            });
            this.previewNode.appendChild(leftBtn);
            this.previewNode.appendChild(rightBtn);
            this.previewNode.appendChild(upButton);
            this.previewNode.appendChild(downButton);
            this.previewNode.appendChild(inButton);
            this.previewNode.appendChild(outButton);
        }

        setTerrein(terrein) {
            this.model = this.model || {};
            this.model.kaart = this.model.kaart || {};
            this.model.kaart.terrein = terrein;
            this.save();
            this.reload();
        }

        setCell(row, col, tile) {
            const model = (this.model = this.model || {});
            const kaart = (model.kaart = model.kaart || {});
            kaart.tegels = kaart.tegels || [];
            kaart.tegels[row] = kaart.tegels[row] || [];
            kaart.tegels[row][col] = tile;
            this.save();
        }

        onTileClicked(row, col) {
            const editor = this;
            const tile = this.model.kaart.tegels[row]?.[col] || '';
            const tegel = {
                row,
                col,
                tile,
                sprites: tile.split(',').filter(Boolean).map( (s, index) => {
                    return {
                        index,
                        tile: s
                    };
                })
            }
            const data = { tegel };
            this.editorNode.innerHTML = this.editorTemplate(data).trim();
            const inputs = this.editorNode.querySelectorAll('input');
            editor.lastClickedInput = inputs[inputs.length - 1];
            this.editorNode.firstChild.addEventListener('click', (ev) => {
                console.log('click', ev);
                const act = ev.target.getAttribute('data-action');
                if (!act) {
                    return;
                }
                const tileIndex = ev.target.closest('[data-tile]').getAttribute('data-tile');
                console.log('Tile index', tileIndex);
                switch (act) {
                    case 'select':
                        editor.lastClickedInput = ev.target;
                        break;
                    case 'delete':
                        const parts = tile.split(',');
                        parts.splice(tileIndex, 1);
                        editor.setCell(row, col, parts.join(','))
                        editor.render();
                        editor.onTileClicked(row, col);
                        break;
                    break;
                }
            });
            this.editorNode.firstChild.addEventListener('change', (ev) => {
                console.log('change', ev);
                if (ev.target === editor.lastClickedInput) {
                    console.log('Mega change');
                    const list = [];
                    editor.editorNode.querySelectorAll('input[data-action]').forEach((i) => {
                        if (i.value) {
                            list.push(i.value.trim());
                        }
                    });
                    
                    editor.setCell(row, col, list.join(','));
                    editor.render();
                }
            });
        }

        render() {
            const editor = this;
            const tileSize = this.tileSize;
            const box = this.box;
            let maxRows = 0;
            let maxColumns = 0;
            box.removeChildren();
            const rows = this.getTegels();
            const lastRow = [];
            rows.push(lastRow);
            rows.forEach( (row, rowIndex) => {
                maxRows = Math.max(maxRows, rowIndex);
                if (row === lastRow) {
                    while(maxColumns-- >= 0) {
                        row.push('');
                    }
                } else if (row.length > 0) {
                    row.push('');
                }
                row.forEach( (col, colIndex) => {
                    maxColumns = Math.max(maxColumns, colIndex);
                    const gfx = new PIXI.Graphics();
                    gfx.beginFill(0x0000FF, 0.1);
                    gfx.lineStyle(1, 0x0000FF);
                    gfx.x = colIndex * tileSize;
                    gfx.y = rowIndex * tileSize;
                    gfx.drawRect(0, 0, tileSize, tileSize);
                    gfx.interactive = true;
                    gfx.on('pointerdown', function() {
                        editor.onTileClicked(rowIndex, colIndex);
                    });
                    box.addChild(gfx);
                    const items = col.split(',');
                    items.forEach( (item) => {
                        const sprite = new PIXI.Sprite(this.resources.terrein.textures[item + ".png"]);
                        sprite.x = colIndex * tileSize;
                        sprite.y = rowIndex * tileSize;
                        if (sprite.height > tileSize) {
                            sprite.scale.y = 1 / sprite.height * tileSize;
                        }
                        if (sprite.width > tileSize) {
                            sprite.scale.x = 1 / sprite.width * tileSize;
                        }
                        sprite.widht = tileSize;
                        box.addChild(sprite);
                    });
                });
            });
            console.log( { tileSize, maxRows, maxColumns });
        }

        renderSpriteList() {
            const editor = this;
            const spriteList = this.spriteList;
            spriteList.innerHTML = '';
            const app = new PIXI.Application({
                width: spriteList.offsetWidth,
                height: 5000,
                backgroundAlpha: 0.25
            });
            spriteList.appendChild(app.view);
            const margin = 5;
            let y = margin;
            const maxWidth = 50;
            const labelX = margin + maxWidth;
            Object.entries(this.resources).forEach(([spriteName, sprites]) => {
                const textures = sprites.textures;
                if (!textures) {
                    return;
                }
                const header = new PIXI.Text(spriteName, {
                    fontFamily: "Arial",
                    fontSize: 14,
                    fontWeight: "bold",
                    fillColor: 0xFFFFFF
                });
                header.y = y;
                header.x = margin;
                app.stage.addChild(header);

                y += header.height + margin;

                Object.keys(textures).forEach((textName) => {
                    const gfx = new PIXI.Graphics();
                    gfx.y = y;
                    gfx.x = margin;
                    gfx.width = spriteList.offsetWidth - 2 * margin;
                    const text = textures[textName];
                    if (!text) {
                        console.log("We have to skip: " + textName);
                        return;
                    }
                    const safeName = textName.replace(/.png$/i, '');
                    const sprite = new PIXI.Sprite(text);
                    if (sprite.width > maxWidth) {
                        sprite.scale.set(maxWidth/sprite.width);
                    }
                    sprite.y = y;
                    sprite.x = margin;
                    const label = new PIXI.Text(safeName, {
                        fontFamily: "Arial",
                        fontSize: 12,
                        fillColor: 0xFFFFFF
                    });
                    label.x = labelX;
                    label.y = y + 0.5 * sprite.height;
                    if (sprite.height > label.height) {
                        y += sprite.height + margin;
                    } else {
                        y += label.height + margin;
                    }
                    
                    gfx.beginFill(0xFFFFFF, 0.1);
                    gfx.lineStyle(1, 0xFFFFFF);
                    gfx.drawRect(0, 0, spriteList.offsetWidth - 2 * margin, y - gfx.y - margin);
                    gfx.endFill();
                    gfx.interactive = true;
                    gfx.on('pointerdown', () => {
                        if (editor.lastClickedInput) {
                            editor.lastClickedInput.value = safeName;
                            editor.lastClickedInput.dispatchEvent(new CustomEvent('change', {bubbles: true}));
                        }
                    });
                    app.stage.addChild(gfx);
                    app.stage.addChild(sprite);
                    app.stage.addChild(label);
                });
            });
        }

    }

    window.Pages_Demo_Pixi_Editor = Editor;
});
