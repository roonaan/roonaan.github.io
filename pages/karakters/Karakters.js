getModule('Inventory', function(Inventory) {
	function Pages_Karakters(node) {
		this.node = node;
		this.listNode = node.querySelector('[data=karakters]');

	}
	window.Pages_Karakters = Pages_Karakters;
});