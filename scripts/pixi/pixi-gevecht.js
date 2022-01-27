(function() {

    const loader = new PIXI.Loader();
    loader.add('');

    let KarakterLijst = undefined;

    function Karakter(parent, naam) {
        this.naam = naam;
        this.parent = parent;
        this.ready = false;
        this.resources = {};
    }

    function doeAanval(aanvaller, verdediger, skill) {
        if (!aanvaller || !verdediger || !skill) {
            return;
        }
        if (verdediger.leven <= 0 || aanvaller.leven <= 0) {
            return;
        }
        console.log("aanval van " + aanvaller.naam + " op " + verdediger.naam, skill);
        
        const schade = skill.schade;
        const nevenschade = skill.nevenschade || 0;

        const aanvallerSnelheid = aanvaller.baseData.snelheid + (skill['extra-snelheid'] || 0);
        const verdedigerSnelheid = verdediger.baseData.snelheid;

        // Valt het kwartje in het vak van de aanvaller, of de verdediger
        const random = Math.random() * (verdedigerSnelheid + aanvallerSnelheid);
        // Als er nevenschade is dan hebben we een herkansing.
        const randomNeven = Math.random() * (verdedigerSnelheid + aanvallerSnelheid * 3);

        let animatieTekst = skill.naam || skill.id;
        let fontSize = 50;
        let effecten = true;

        if (schade === 0) {
            // Verdedigende skill
        } else if (random > verdedigerSnelheid) {
            verdediger.geraakt(schade);
        } else if (nevenschade > 0 && randomNeven > verdedigerSnelheid) {
            verdediger.geraakt(nevenschade);
            fontSize = 30;
        } else {
            animatieTekst = "Mis!";
            effecten = false;
            if (verdediger.isVijand) {
                console.log("Mis", { aanvallerSnelheid, verdedigerSnelheid, random, randomNeven});
            }
        }

        if (effecten && skill.effecten && skill.effecten.length > 0) {
            skill.effecten.forEach( (e) => {
                const doel = e.doel === 'zelf' ? aanvaller : verdediger;
                doel.effect(e.eigenschap, e.waarde, e.tijdsduur);
            });
        }

        // #region Aanvals animatie
        let counter = skill.energiepunten * 300;
        const max = counter;
        const ticker = new PIXI.Ticker();
        const text = new PIXI.Text(animatieTekst, {
            fontFamily: "Arial",
            fontSize,
            fill: aanvaller.isVijand ? 0xFF0000 : 0x00FF00
        });
        text.pivot.set(text.width/2, text.height/2);
        text.x = window.innerWidth / 2;
        text.y = window.innerHeight / 2;
        aanvaller.parent.addChild(text);

        const directionX = -10 + Math.random() * 20;
        const directionY = -10 + Math.random() * 20;

        ticker.add((delta) => {
            const factor = max === counter ? 1 : Math.sqrt(max - counter) ;
            counter = Math.max(0, counter - delta * factor/50);

            text.x += directionX * delta / 5;
            text.y += directionY * delta / 5;

            if (text.y < -500 || text.y > window.innerHeight + 500) {
                counter = 0;
            }

            if (text.x < -500 || text.x > window.innerWidth + 500) {
                counter = 0;
            }

            if (aanvaller.isVijand) {
                text.angle += factor;
            } else {
                text.angle -= factor;
            }
            text.alpha = 1 / max * counter;
            if (counter === 0) {
                text.parent.removeChild(text);
                text.destroy();
                ticker.destroy();
            }
        });
        ticker.start();
        // #endregion
    }

    Karakter.prototype.isReady = function() {
        return this.ready;
    }

    Karakter.prototype.init = function (details) {
       this.baseData = details;
       this.leven = details.leven;
       this.energiepunten = details.energiepunten || 0;
       this.ready = true;
       this.kanNietAanvallen = 0;
    };

    Karakter.prototype.geraakt = function (schade) {
        this.leven = Math.max(0, this.leven - schade);
        this.refresh();

        const text = new PIXI.Text("-" + schade, {
            fontFamily: "Arial", fontSize: 14, fill: 0xFF0000
        });

        text.y = 10;
        text.x = 300;

        const ticker = new PIXI.Ticker();
        ticker.add(function(delta) {
            text.y -= delta;
        });
        ticker.start();
        this.sContainer.addChild(text);
        setTimeout(function() {
            text.parent.removeChild(text);
            text.destroy();
            ticker.destroy();
        }, 1000);
    }

    Karakter.prototype.effect = function (prop, tijdsduur, waarde) {
        const baseData = this.baseData;
        if (prop in this.baseData) {
            baseData[prop] += waarde;
        } else {
            console('Deze eigenschap bestaat niet', prop);
            return;
        }

        const text = new PIXI.Text(prop + (waarde > 0 ? " + " + waarde : waarde), {
            fontFamily: "Arial",
            fontSize: 20,
            fontWeight: "bold",
            fill: waarde > 0 ? 0x00FF00 : 0xFF0000
        });

        text.y = 80;
        text.x = 20;

        const ticker = new PIXI.Ticker();
        ticker.add(function(delta) {
            text.y -= delta;
        });
        ticker.start();
        this.sContainer.addChild(text);
        setTimeout(function() {
            text.parent.removeChild(text);
            text.destroy();
            ticker.destroy();
        }, 1000);

        setTimeout(function() {
            baseData[prop] -= waarde;
        }, tijdsduur * 1000);
    }

    Karakter.prototype.energie = function (energie) {
        if (isNaN(energie)) {
            throw new Error('energie moet een nummer zijn');
        }
        const nieuweEnergie = Math.min(20, this.energiepunten + energie);
        if (isNaN(nieuweEnergie)) {
            debugger;
        }
        if (this.energiepunten != nieuweEnergie) {
            this.energiepunten = nieuweEnergie;
            this.refresh();
        }
    };

    Karakter.prototype.randomAanval = function (alleKarakters) {
        if (!this.kanNietAanvallen) {
            this.kanNietAanvallen = new Date().getTime() + 2500;
            return;
        }
        if (new Date().getTime() < this.kanNietAanvallen) {
            return;
        }
        this.kanNietAanvallen = new Date().getTime() + 2500;

        // We moeten skill 3 als eerste proberen
        for (let i = this.baseData.skills.length -1; i >= 0; i--) {
            const skill = this.baseData.skills[i];
            if (skill.energiepunten > this.energiepunten) {
                continue;
            }
            this.energie(-skill.energiepunten);

            const opties = Object.values(alleKarakters).filter(k => k.leven > 0 && k !== this);

            const gekozen = opties.length == 1 ? opties[0] : opties[Math.floor(Math.random() * opties.length)];

            if (!gekozen) {
                return;
            }

            doeAanval(this, gekozen, skill);

            break;
        }
    };

    Karakter.prototype.render = function(parent, resources, x, y) {
        this.resources = resources; 
        this.sContainer = new PIXI.Container();
        this.sContainer.x = x;
        this.sContainer.y = y;

        this.sAvatar = new PIXI.Container();
        this.sContainer.addChild(this.sAvatar);
        const border = new PIXI.Graphics();
        border.lineStyle(2, 0xFFD700);
        border.beginFill(0xFFD700, 0.2);
        border.drawRect(0, 0, 100, 100);
        border.endFill();

        if (this.baseData.afbeeldingen?.sprite) {
            const afb = this.baseData.afbeeldingen;
            const avatarGfx = new PIXI.AnimatedSprite(this.resources.vijand.spritesheet.animations.omlaag);
            avatarGfx.height = 100;
            avatarGfx.width = 100;
            avatarGfx.animationSpeed = afb.animationSpeed || 0.5;
            avatarGfx.play();
            this.sAvatar.addChild(avatarGfx);
        } else if (this.baseData.avatar) {
            const avatarGfx = PIXI.Sprite.from(this.baseData.avatar);
            avatarGfx.height = 100;
            avatarGfx.width = 100;
            this.sAvatar.addChild(avatarGfx);
        }

        this.sAvatar.addChild(border);

        this.sNaam = new PIXI.Text(
            this.baseData.naam + " level " + this.baseData.level,
            { fontFamily: "Arial", fontSize: 18, fill: 0xFFD700 }
        );
        this.sNaam.x = 120;
        this.sNaam.y = 0;
        this.sContainer.addChild(this.sNaam);

        this.sHpContainer = new PIXI.Container();
        this.sHpContainer.x = 120;
        this.sHpContainer.y = 20;
        this.sContainer.addChild(this.sHpContainer);

        if (!this.isVijand) {
            this.apContainer = new PIXI.Container();
            this.apContainer.x = 120;
            this.apContainer.y = 80;
            this.sContainer.addChild(this.apContainer);
            this.skillContainers = this.baseData.skills.map(
                (s, index) =>    
                this.createSkillContainer(this.sContainer, 150 + index * 50, 55, s)
            );
        }

        parent.addChild(this.sContainer);
        this.refresh();
    }

    Karakter.prototype.createSkillContainer = function(parent, x, y, skill) {
        const container = new PIXI.Container();
        parent.addChild(container);
        container.x = x;
        container.y = y;

        const box = new PIXI.Graphics();
        box.beginFill(0xFFD700, 0.5);
        box.lineStyle(1, 0xFFD700);
        box.drawRect(0, 0, 40, 40);
        box.endFill();
        container.addChild(box);

        const energie = new PIXI.Text(skill.energiepunten, {
            fontFamily: "Arial",
            fontSize: 12,
            fill: 0xFFFFFF
        });
        energie.x = 38 - energie.width;
        energie.y = 38 - energie.height;
        container.addChild(energie);

        container.interactive = true;
        container.on("pointerdown", () => {
            if (!this.vijanden) {
                console.warn('Er zijn geen vijanden');
                return;
            }
            if (skill.energiepunten <= this.energiepunten) {
                this.energie(-skill.energiepunten);
                const opties = this.vijanden.filter(v => v.leven > 0);
                doeAanval(this, opties[0], skill);
            } else {
                console.warn('Niet genoeg energie!')
            }
        });

        return container;
    }

    Karakter.prototype.refresh = function() {
        if (!this.baseData) {
            return;
        }
        // console.log("Refresh", this.naam, this.baseData?.leven, this.leven);
        // AP Update
        if (!this.isVijand) {
            this.apContainer.children.forEach(a => a.destroy());
            this.apContainer.removeChildren();
            const apText = new PIXI.Text(this.energiepunten, {
                fontFamily: "Arial",
                fontSize: 16,
                fill: 0xFFFFFF
            });
            this.apContainer.addChild(apText);
            
            this.baseData.skills.forEach( (skill, index) => {
                const ctx = this.skillContainers[index];
                if (!ctx.borderbox) {
                    ctx.borderbox = new PIXI.Container();
                    ctx.addChild(ctx.borderbox);
                } else if (ctx.borderbox.children.length > 0) {
                    ctx.borderbox.removeChildren();
                }
                const box = new PIXI.Graphics();
                if (this.energiepunten >= skill.energiepunten) {
                    box.lineStyle(2, 0x00FF00);
                } else {
                    box.lineStyle(1, 0x999999);
                }
                box.drawRect(0, 0, 40, 40);
                ctx.borderbox.addChild(box);
            });
        }

        // HP update
        this.sHpContainer.children.forEach(a => a.destroy());
        this.sHpContainer.removeChildren();
        let kleur = 0x00FF00;
        const maxWidth = 200;
        const maxHeight = 10;
        const hpSize = maxWidth / this.baseData.leven * this.leven;
        if (hpSize < maxWidth / 3) {
            kleur = 0xFF0000;
        }

        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 1);
        bg.drawRect(0, 0, maxWidth, maxHeight);
        this.sHpContainer.addChild(bg);

        const balk = new PIXI.Graphics();
        balk.beginFill(kleur, 1);
        balk.drawRect(0, 0, hpSize, maxHeight);
        balk.endFill();
        this.sHpContainer.addChild(balk);

        const rand = new PIXI.Graphics();
        rand.lineStyle(2, kleur);
        rand.drawRect(0, 0, maxWidth, maxHeight);
        this.sHpContainer.addChild(rand);

        const text = new PIXI.Text( + this.leven, {
            fontFamily: "Arial",
            fontSize: 14,
            fill: 0xFFD700,
            align: "right"
        });
        text.x = maxWidth - text.width - 10;
        text.y = maxHeight + 1;
        this.sHpContainer.addChild(text);
    }

    function Gevecht(parent, vijand, spelers, onComplete) {
        const gevecht = this;
        this.container = new PIXI.Container();
        this.parent = parent;
        this.vijand = vijand;
        this.onComplete = onComplete;
        this.spelers = spelers;

        this.karakters = {
            vijand: new Karakter(this.container, vijand.id)
        };

        spelers.forEach( (naam) => {
            this.karakters[naam] = new Karakter(this.container, naam)
        });

        parent.addChild(this.container);

        this.x = 0;
        this.y = 0;
        this.width = parent.width;
        this.height = parent.height;

        getModule('KarakterLijst', (KL) => {
            KarakterLijst = KL;
            KarakterLijst.getVijand(vijand.id, vijand.niveau, (details) => {
                gevecht.karakters.vijand.isVijand = true;
                gevecht.karakters.vijand.init(details);
            });
            spelers.forEach( (speler) => {
                KarakterLijst.getKarakter(speler, (details) => {
                    console.log('Karakter is nu', details);
                    gevecht.karakters[speler].init(details);
                    gevecht.karakters[speler].vijanden = [gevecht.karakters.vijand];
                }, console.warn);
            });
        });

        const loader = new PIXI.Loader();
        loader.add('vijand', vijand.afbeeldingen.sprite);
        loader.load((_, resources) => {
            this.wachtOpKarakters(() => {
                gevecht.startGevecht(resources);
            });
        });

        const gfx = new PIXI.Graphics();
        gfx.lineStyle(1, 0xFF0000);
        gfx.beginFill(0x666666, 1);
        gfx.drawRect(0, 0, this.width, this.height);
        gfx.endFill();
        this.container.addChild(gfx);
    }

    Gevecht.prototype.wachtOpKarakters = function(callback) {
        if (Object.values(this.karakters).some(k => !k.isReady())) {
            return setTimeout(() => {
                this.wachtOpKarakters(callback);
            }, 500);
        }
        callback();
    };

    Gevecht.prototype.startGevecht = function(resources) {
        this.resources = resources;
        
        const margin = 20;

        let spelers = 0;

        // Eerste render uitvoeren
        Object.entries(this.karakters).forEach( ([naam, karakter]) => {
            if (naam.startsWith('vijand')) {
                karakter.render(this.container, resources, this.width / 2 - 100, margin);
            } else {
                spelers++;
                karakter.render(this.container, resources, margin, this.height - margin - spelers * 100);
            }
        });

        // De game ticker opstarten
        this.ticker = new PIXI.Ticker();

        let lastHit = 0;
        let counter = 0;

        let lastEnergie = 0;

        this.ticker.add((delta) => {
            lastEnergie += delta;
            if (lastEnergie > 100) {
                lastEnergie = 0;
                Object.values(this.karakters).forEach(k => k.energie(1));
            }
            if (!Object.values(this.karakters).some(k => k.isVijand && k.leven > 0)) {
                // Alle vijanden zijn uitgestreden
                this.eindeGevecht(true);
                return;
            }
            if (!Object.values(this.karakters).some(k => !k.isVijand && k.leven > 0)) {
                // Alle spelers zijn uitgestreden
                this.eindeGevecht(false);
                return;
            }

            this.karakters.vijand.randomAanval(this.karakters);
        });

        this.ticker.start();
    }

    Gevecht.prototype.eindeGevecht = function(gewonnen) {
        notificatie(gewonnen ? "Je hebt gewonnen!": "Je hebt verloren! Volgende keer beter");
        this.ticker.destroy();
        setTimeout(() => {
            this.onComplete(gewonnen);
        }, 2000);
    }

    PIXI.game.Gevecht = Gevecht;

})();