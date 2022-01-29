getModule('gevecht/Vechter', (Vechter) => {
    
    class Speler extends Vechter {
        constructor(naam) {
            super(naam , Vechter.Speler);
            
            getModule('KarakterLijst', (KL) => {
                KL.getKarakter(this.naam, (baseData) => {
                    this.init(baseData);
                })
            })
        }
    }

    window.gevecht_Speler = Speler;

});