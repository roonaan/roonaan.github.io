/* global getModule */
getModule('KarakterLijst', function(KarakterLijst) {

    // Gebasseerd op https://rpg.fandom.com/wiki/Damage_Formula
    // We gebruiken deze formule, zodat de schade nooit 0 wordt.
    // Als je simpel { aanval - verdediging } gebruikt, dan kan iemand imuum zijn
    function schadeBerekening(aanval, verdediging, weapon) {
        const multiplier = 1 + Math.min(weapon.multiplier || 0, 100) / 100
        const aanval2 = aanval + (weapon.aanval || 0);
        const damage = Math.ceil(2 * multiplier * Math.pow(aanval2, 2) / (aanval2 + verdediging));
        // console.log('Schade', { aanval, verdediging, damage, weapon });
        return damage;
    }

    /**
     * De berekening van een aanval
     * @param {Vechter} aanvaller 
     * @param {Vechter} verdediger 
     * @param {Skill} skill 
     * @returns {boolean} Is de aanval gelukt of niet
     */
    function doeAanval(aanvaller, verdediger, skill) {
        if (!aanvaller || !verdediger || !skill) {
            return;
        }

        // Als de verdediger dood is, hoeven we niet aan te vallen.
        // Als de aanvaller dood is, mja, dan doet die niet veel.
        if (verdediger.leven <= 0 || aanvaller.leven <= 0) {
            return;
        }

        // We halen energie eraf
        if (!aanvaller.energie(-skill.energiepunten)) {
            console.log("Te weinig energie");
            return;
        }
        console.log("aanval van " + aanvaller.naam + " op " + verdediger.naam, skill);
        
        const schade = skill.schade;
        const nevenschade = skill.nevenschade || 0;

        const aanval = aanvaller.baseData.aanval + skill.kracht;
        const nevenAanval = skill.nevenschade ? aanvaller.baseData.aanval + skill.kracht / 3 : 0;
        const verdediging = verdediger.baseData.verdediging;

        // We hebben nog geen echte wapens
        const wapen = {
            aanval: 0,
            multiplier: 0
        }

        // Bepalen of de aanval lukt of niet
        const aanvallerSnelheid = aanvaller.baseData.snelheid + (skill['extra-snelheid'] || 0);
        const verdedigerSnelheid = verdediger.baseData.snelheid;

        // Valt het kwartje in het vak van de aanvaller, of de verdediger
        const random = Math.random() * (verdedigerSnelheid + aanvallerSnelheid);
        // Als er nevenschade is dan hebben we een herkansing.
        const randomNeven = skill.nevenschade ? Math.random() * (verdedigerSnelheid + aanvallerSnelheid * 3) : 0;

        let aanvalGelukt= true;

        if (skill.kracht === 0) {
            // Verdedigende skill
        } else if (random > verdedigerSnelheid) {
            verdediger.geraakt(schadeBerekening(aanval, verdediging, wapen));
            aanvaller.onAanval && aanvaller.onAanval(skill, false);
        } else if (nevenAanval > 0 && randomNeven > verdedigerSnelheid) {
            aanvaller.onAanval && aanvaller.onAanval(skill, true);
            verdediger.geraakt(schadeBerekening(nevenAanval, verdediging, wapen));
        } else {
            aanvalGelukt = false;
            aanvaller.onMis && aanvaller.onMis(skill);
            if (verdediger.isVijand) {
                console.log("Mis", { aanvallerSnelheid, verdedigerSnelheid, random, randomNeven});
            }
        }

        if (aanvalGelukt && skill.effecten && skill.effecten.length > 0) {
            skill.effecten.forEach( (e) => {
                const doel = e.doel === 'zelf' ? aanvaller : verdediger;
                doel.effect(e.eigenschap, e.waarde, e.tijdsduur);
            });
        }

        return aanvalGelukt;
    }

    /**
     * @typedef Vechter
     */
    class Vechter {

        constructor(naam, type) {
            this.naam = naam;
            this.ready = false;
            this.type = type;
            this.isVijand = type === Vechter.Types.Vijand;
            this.isSpeler = type === Vechter.Types.Speler;
        }

        init(baseData) {
            this.baseData = baseData;
            this.leven = baseData.leven;
            this.energiepunten = baseData.energiepunten || 0;
            this.ready = true;
            if (this.onReady) {
                this.onReady();
            }
        }

        isReady() {
            return this.ready;
        }

        geraakt(schade) {
            this.leven = Math.max(0, this.leven - schade);
            this.onGeraakt && this.onGeraakt(schade, this.leven);
        }

        effect(prop, waarde, tijdsduur = 1) {
            if (prop === 'energie'){
                return this.energie(waarde);
            }
            const baseData = this.baseData;
            if (!(prop in this.baseData)) {
                console('Deze eigenschap bestaat niet', prop);
                return;
            }
            baseData[prop] += waarde;
            setTimeout(function() {
                baseData[prop] -= waarde;
            }, tijdsduur * 1000);
            this.onEffect && this.onEffect(prop, tijdsduur, waarde);
        }

        energie(energie) {
            if (isNaN(energie)) {
                throw new Error('energie moet een nummer zijn');
            }
            const nieuweEnergie = Math.min(20, this.energiepunten + energie);
            if (isNaN(nieuweEnergie)) {
                debugger;
            }
            if (nieuweEnergie < 0) {
                return false;
            }
            if (this.energiepunten != nieuweEnergie) {
                this.energiepunten = nieuweEnergie;
                this.onEnergie && this.onEnergie();
            }
            return true;
        }

        aanval(verdediger, skill) {
            if (skill.energiepunten > this.energiepunten) {
                return false;
            }
            return doeAanval(this, verdediger, skill);
        }

        randomAanval(alleDoelwitten) {
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
    
                const opties = Object.values(alleDoelwitten).filter(k => k.leven > 0 && k !== this);
    
                const gekozen = opties.length == 1 ? opties[0] : opties[Math.floor(Math.random() * opties.length)];
    
                if (!gekozen) {
                    return;
                }
                return doeAanval(this, gekozen, skill);
            }
            return false;
        }
    }

    Vechter.Types = {
        Vijand: 'vijand',
        Speler: 'speler',
        Companion: 'companion'
    };
    /**
     * Maak een nieuwe vijand aan
     * @param {string} naam 
     * @param {number} level 
     * @returns 
     */

    Vechter.laadVijand = (naam, level) => {
        const v = new Vechter(naam, Vechter.Types.Vijand);
        KarakterLijst.getVijand(naam, level, (baseData) => {
            v.init(baseData);
        });
        return v;
    };

    /**
     * Maak een nieuwe karakter aan
     * @param {string} naam 
     * @returns {Vechter}
     */
    Vechter.laadKarakter = (naam) => {
        const v = new Vechter(naam, Vechter.Types.Speler);
        KarakterLijst.getKarakter(naam, (baseData) => {
            v.init(baseData);
        });
        return v;
    };



    window.Gevecht_Vechter = Vechter;
});