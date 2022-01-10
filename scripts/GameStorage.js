function _GameStorage(scope) {
  this.scope = scope;
}

_GameStorage.prototype.getItem = function(key, defaultValue) {
  const value = window.localStorage.getItem(this.scope + '/' + key);
  if (typeof value === "String") {
    try {
      return JSON.parse(value).value;
    } catch (e) {
       // Ignore for now
    }
  }
  return defaultValue;
}

_GameStorage.prototype.setItem = function(key, value) {
  return window.localStorage.setItem(this.scope + '/' + key, JSON.stringify({ value: value }));
}

_GameStorage.prototype.removeItem = function(key) {
  return window.localStorage.removeItem(this.scope + '/' + key);
}

_GameStorage.prototype.getItems = function() {
  const items = {};
  for (var i = 0; i < window.localStorage.length; i++) {
    const storageKey = window.localStorage.key(i);
    if (storageKey && storageKey.startsWith(this.scope + '/')) {
      const key = storageKey.substring(this.scope.length + 1);
      items[key] = this.getItem(key);
    }
  }
  return items;
}

_GameStorage.getStorage = function(prefix) {
  return new Storage(prefix);
}

window.GameStorage = _GameStorage;
