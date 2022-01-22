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
}

Gevecht.prototype.start = function() {
	this.node.innerHTML = 'Het gevecht gaat beginnen!!!';
	const button = document.createElement('button');
	button.type = 'button';
	button.addEventListener('click', function() {
		this.node.innerHTML = 'Het gevecht is klaar. Super gedaan!';
		this.node.dispatchEvent(new CustomEvent('gevecht-complete', { bubbles: true}));
	})
	button.innerHTML = 'Klaar met vechten';
	this.node.appendChild(button);
}