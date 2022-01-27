getModule('KarakterLijst', function(KL) {
   
    function Stats(node) {

        this.node = node;

        const template = Handlebars.compile(node.querySelector('script[type="text/template"]').innerHTML.trim());

        this.node.innerHTML = 'Bezig met laden...';

        const data = {
            karakters: [],
            levels: []
        }

        const karakters = Object.values(KL.getBeschikbareKarakters()).map(k => k.id);
        data.karakters = karakters.map(naam => ({naam}));

        const refresh = function() {
            node.innerHTML = template(data);
        }

        refresh();

        const trottle = function() {
            clearTimeout(trottle.timeout);
            trottle.timeout = setTimeout(refresh, 100);
        };

        for (let level = 0; level <= 50; level++) {
            data.levels[level] = {
                level,
                experience: KL.getExperienceNeeded(level),
                karakters: []
            }
            karakters.forEach( function(id, index) {
                KL.getVijand(id, level, function(details) {
                    if (level === 1) {
                        console.log(details);
                        data.karakters[index] = details;
                    }
                    data.levels[level].karakters[index] = details;
                    trottle();
                });
            });
        }
    
    }

    window.Pages_Demo_Exp = Stats;

});