getModule('pixi/Pixi', function(Pixi) {
    function DemoPixi(node) {
        this.node = node;
        this.pixiNode = node.querySelector('[data-pixi]');
        this.pixi = new Pixi(this.pixiNode);
    }
    window.Pages_Demo_Pixi = DemoPixi;
});