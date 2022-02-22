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
            this.beloningNode = node.querySelector('[data-beloningen]');

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
            if (!this.model.kaart.tileSize) {
                this.model.kaart.tileSize = 250;
                this.save();
            }
            this.editorTemplate = Handlebars.compile(node.querySelector('#tile-editor-tpl').innerHTML);
            this.objectEditorTemplate = Handlebars.compile(node.querySelector('#object-editor-tpl').innerHTML);
            this.beloningEditorTemplate = Handlebars.compile(node.querySelector('#beloning-editor-tpl').innerHTML);
            this.beloningNode.innerHTML = this.beloningEditorTemplate({}).trim();
            this.reload();

            node.querySelector('[data-laag]').addEventListener('change', () => {
                editor.onLaagChange();
            });
            editor.onLaagChange(true);

            node.querySelector('[data-reset]').addEventListener('click', () => {
                if (window.confirm('Weet je zeker dat je alle wijzigingen wil weghalen?')) {
                    STORE.removeItem('model');
                    document.location.reload();
                }
            })

            node.querySelector('[data-export]').addEventListener('click', () => {
                document.addEventListener('copy', function(e) {
                    const tegels = editor.getTegels();
                    const terrein = editor.model.kaart.terrein;
                    const objecten = editor.getObjecten();
                    const vijanden = editor.getVijanden();
                    const shared = ['kampvuur'];
                    const tileSize = editor.model.kaart.tileSize || 250;
                    const achtergrond = editor.model.kaart.achtergrond || 'Tile_5';
                    const data = {
                        kaart: {
                            terrein,
                            shared,
                            tileSize,
                            achtergrond,
                            tegels,
                            objecten
                        },
                        vijanden
                    };
                    let json = JSON.stringify(data, null, '  ').trim();
                    json = json.replace(/^\{/, '');
                    json = json.replace(/}$/, ',');
                    e.clipboardData.setData('text/plain', json);
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
                editor.displaySize = STORE.getItem('displaySize') || 80;
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

        getObjecten() {
            return (this.model.kaart.objecten || []).filter(Boolean);
        }

        getVijanden() {
            return (this.model.vijanden || []).filter(Boolean);
        }

        onLaagChange(skipRender = false) {
            // Tijdens het opstarten kan het renderen fout gaan. Maar
            // die code wordt later sowieso aangeroepen, dus het is geen
            // probleem als we het nu overslaan.
            if (!skipRender) {
                this.render();
            }
            if (this.isObjecten()) {
                this.renderObjectenEditor();
            }
        }

        getLaag() {
            return this.node.querySelector('[data-laag]').value;
        }

        isGrond() {
            return this.getLaag() === 'grond';
        }

        isObjecten() {
            return this.getLaag() === 'objecten';
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
                this.displaySize += 10;
                STORE.setItem('displaySize', this.displaySize);
                this.render();
            });
            const outButton = document.createElement('button');
            outButton.innerText = 'Zoom Out';
            outButton.style.position = 'absolute';
            outButton.style.left = '100px';
            outButton.style.bottom = '0%';
            outButton.addEventListener('click', () => {
                this.displaySize = Math.max(10, this.displaySize - 10);
                STORE.setItem('displaySize', this.displaySize);
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
            if (!this.isGrond()) {
                console.log('We doen niets als we niet in de grond laag zitten');
                return;
            }
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
            const displaySize = this.displaySize;
            const tileSize = this.model.kaart.tileSize;
            const scale = displaySize/tileSize;
            const box = this.box;
            let maxRows = 0;
            box.removeChildren();
            const rows = this.getTegels();
            let maxColumns = Math.max(rows.map(t => t.length));
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
                    if (this.isGrond()) {
                        const gfx = new PIXI.Graphics();
                        gfx.beginFill(0x0000FF, 0.1);
                        gfx.lineStyle(1, 0x0000FF);
                        gfx.x = colIndex * displaySize;
                        gfx.y = rowIndex * displaySize;
                        gfx.drawRect(0, 0, displaySize, displaySize);
                        gfx.interactive = true;
                        gfx.on('pointerdown', function() {
                            editor.onTileClicked(rowIndex, colIndex);
                        });
                        box.addChild(gfx);
                    }
                    const items = col.split(',');
                    items.forEach( (item) => {
                        const sprite = new PIXI.Sprite(this.resources.terrein.textures[item + ".png"]);
                        sprite.x = colIndex * displaySize;
                        sprite.y = rowIndex * displaySize;
                        sprite.scale.set(scale);
                        box.addChild(sprite);
                    });
                });
            });
            const objecten = this.getObjecten();
            objecten.forEach( (item, itemIndex) => {
                const sprite = new PIXI.Sprite(this.resources.terrein.textures[item.tegel]);
                sprite.x = item.x * displaySize;
                sprite.y = item.y * displaySize;
                sprite.scale.set(scale);
                if (editor.isObjecten()) {
                    const text = new PIXI.Text(
                        "(" + item.x + ", " + item.y + ") " + item.tegel,
                        {
                            fontFamily: "Arial",
                            fontSize: 12,
                            fill: 0x0000FF
                        }
                    );
                    text.x = item.x * displaySize + 0.5 * (sprite.width - text.width);
                    text.y = item.y * displaySize + sprite.height;
                    box.addChild(text);
                    const gfx = new PIXI.Graphics();
                    gfx.beginFill(0xCCCCFF, 0.1);
                    gfx.lineStyle(1, 0x0000FF);
                    gfx.x = sprite.x;
                    gfx.y = sprite.y;
                    gfx.drawRect(0, 0, sprite.width, sprite.height);
                    gfx.endFill();
                    gfx.interactive = true;
                    gfx.on('pointerdown', () => {
                        const nodes = editor.editorNode.querySelectorAll('[data-object]');
                        nodes.forEach((node) => {
                            if (node.getAttribute('data-object') == itemIndex) {
                                node.querySelector('input').focus();
                                node.querySelector('input').scrollIntoView();
                                const prev = node.style.backgroundColor;
                                node.style.backgroundColor = 'blue';
                                setTimeout(function() {
                                    node.style.backgroundColor = prev;
                                }, 1000);
                            }
                        })
                    });
                    box.addChild(gfx);
                }
                box.addChild(sprite);
            });
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
                            if (editor.lastClickedInput.getAttribute('data-extension') == 'true') {
                                editor.lastClickedInput.value = textName;
                            } else {
                                editor.lastClickedInput.value = safeName;
                            }
                            editor.lastClickedInput.dispatchEvent(new CustomEvent('change', {bubbles: true}));
                        }
                    });
                    app.stage.addChild(gfx);
                    app.stage.addChild(sprite);
                    app.stage.addChild(label);
                });
            });
        }

        renderObjectenEditor() {
            const editor = this;
            const objecten = this.getObjecten().map( (item, index) => {
                return {...item, index};
            });
            const nieuwIndex = objecten.length;
            this.editorNode.innerHTML = this.objectEditorTemplate({
                objecten,
                nieuwIndex
            }).trim();
            this.editorNode.firstChild.addEventListener('click', (ev) => {
                console.log('Handling click');
                const action = ev.target.getAttribute('data-action');
                if (action === 'select') {
                    editor.lastClickedInput = ev.target;
                } else if (action === 'beloningen') {
                    const object = parseInt(ev.target.closest('[data-object]').getAttribute('data-object'));
                    editor.renderBeloningenEditor(object);
                } else {
                    console.log('Unknown action', action);
                }
            });
            this.editorNode.firstChild.addEventListener('change', (ev) => {
                const point = ev.target.getAttribute('data-point');
                const value = ev.target.value;
                console.log('Handling change', point, value);
                if (value && ['x', 'y', 'tegel'].includes(point)) {
                    const object = parseInt(ev.target.closest('[data-object]').getAttribute('data-object'));
                    editor.model.kaart.objecten = editor.model.kaart.objecten || [];
                    editor.model.kaart.objecten[object] = editor.model.kaart.objecten[object] || {};
                    if (['x', 'y'].includes(point)) {
                        editor.model.kaart.objecten[object][point] = parseFloat(value);
                    } else {
                        editor.model.kaart.objecten[object][point] = value;
                    }
                    editor.save();
                    if (object === nieuwIndex) {
                        editor.renderObjectenEditor();
                    }
                    editor.render();
                } else {
                    console.log('Unknown data point [' + point + '] for value [' + value + ']');
                }
            });
        }

        renderBeloningenEditor(object) {
            const item = this.getObjecten()[object];
            if (!item) {
                console.warn('Item bestaat niet', object);
                return;
            }

            const data = {
                x: item.x,
                y: item.y,
                tegel: item.tegel,
                eenmalig: [],
                altijd: []
            };

            if (item.beloning) {
                if (item.beloning.eenmalig) {
                    data.eenmalig = item.beloning.eenmalig.map( (item, index) => {
                        return {
                            index,
                            wat: item[0] || '',
                            hoeveel: item[1] || 1,
                            kans: item[2] || 100
                        }
                    }, [])
                }
                if (item.beloning.altijd) {
                    data.altijd = item.beloning.altijd.map( (item, index) => {
                        return {
                            index,
                            wat: item[0] || '',
                            hoeveel: item[1] || 1,
                            kans: item[2] || 100
                        }
                    }, [])
                }
            }

            data.nieuwEenmaligIndex = data.eenmalig.length;
            data.nieuwAltijdIndex = data.altijd.length;

            this.beloningNode.innerHTML = this.beloningEditorTemplate(data).trim();
            this.beloningNode.style.display = "block";

            const editor = this;
            this.beloningNode.querySelector('[data-sluiten]').addEventListener('click', () => {
                editor.beloningNode.style.display = "none";
            });
            this.beloningNode.addEventListener('change', (ev) => {
                const modelData = editor.model.kaart.objecten[object] || {};
                const eenmalig = ev.target.getAttribute('data-eenmalig');
                if (eenmalig) {
                    const beloning = modelData.beloning = modelData.beloning || {};
                    const modelEenmalig = beloning.eenmalig = beloning.eenmalig || [];
                    const parts = eenmalig.split(',');
                    const index = parseInt(parts[0]);
                    const field = parseInt(parts[1]);
                    modelEenmalig[index] = modelEenmalig[index] || [];
                    modelEenmalig[index][field] = ev.target.value;
                    editor.save();
                    if (index === data.nieuwEenmaligIndex) {
                        editor.renderBeloningenEditor(object);
                    }
                }
                const altijd = ev.target.getAttribute('data-altijd');
                if (altijd) {
                    const beloning = modelData.beloning = modelData.beloning || {};
                    const modelAltijd = beloning.altijd = beloning.altijd || [];
                    const parts = altijd.split(',');
                    const index = parseInt(parts[0]);
                    const field = parseInt(parts[1]);
                    modelAltijd[index] = modelAltijd[index] || [];
                    modelAltijd[index][field] = ev.target.value;
                    editor.save();
                    if (index === data.nieuwAltijdIndex) {
                        editor.renderBeloningenEditor(object);
                    }
                }
            });
        }

    }

    window.Pages_Demo_Pixi_Editor = Editor;
});
