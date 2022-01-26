function Gevecht(node) {
	this.gevecht = node.getAttribute('data-gevecht');
	this.node = node;
	this.node.innerHTML = H_LAAD_ICON;
	const gevecht = this;
	http.get('gevechten/' + this.gevecht + '.json?'+ new Date().getTime(), function(text) {
		gevecht.parse(text);
		gevecht.start();
	});
}

Gevecht.prototype.parse = function(text) {
	const json = JSON.parse(text);
	this.json = json;
}

Gevecht.prototype.start = function() {
	if (this.json.spelvariant === 'pixi') {
		const node = this.node;
		getModule('pixi/Pixi', function(pixi) {
			const child = document.createElement('div');
			child.setAttribute('data-pixi', node.getAttribute('data-gevecht'));
			child.className = 'full-screen';
			node.innerHTML = '';
			node.appendChild(child);
			new pixi(child);
		});
	} else {
		this.node.innerHTML = 'Het gevecht gaat beginnen!!!';
		const button = document.createElement('button');
		button.type = 'button';
		const gevecht = this;
		button.addEventListener('click', function() {
			gevecht.node.innerHTML = 'Het gevecht is klaar. Super gedaan!<br />' + H_LAAD_ICON;
			gevecht.node.dispatchEvent(new CustomEvent('gevecht-complete', { bubbles: true}));
		})
		button.innerHTML = 'Klaar met vechten';
		this.node.appendChild(button);
	}
}