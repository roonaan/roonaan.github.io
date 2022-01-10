function Storage(scope) {
  this.scope = scope;
}

Storage.prototype.getItem = function(key, defaultValue) {
  const value = window.localStorage.getItem(this.scope + '/' + key);
  if (typeof value === "String") {
    try {
      return JSON.parse(value);
    } catch (e) {
       // Ignore for now
    }
  }
  return defaultValue;
}

Storage.prototype.setItem = function(key, value) {
  return window.localStorage.setItem(this.scope + '/' + key, JSON.stringify(value));
}

Storage.prototype.removeItem = function(key) {
  return window.localStorage.removeItem(this.scope + '/' + key);
}

Storage.prototype.getItems = function() {
  const items = {};
  while (var i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (i && i.startsWith(this.scope + '/')) {
      const key = i.substring(this.scope.length + 1);
      items[key] = this.getItem(key);
    }
  }
  return items;
}

Storage.getStorage = function(prefix) {
  return new Storage(prefix);
}
