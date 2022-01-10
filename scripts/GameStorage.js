function _GameStorage(scope) {
  this.scope = scope;
}

_GameStorage.prototype.getItem = function(key, defaultValue) {
  const fullKey = this.scope + '/' + key;
  const value = window.localStorage.getItem(fullKey);
  if (typeof value === "String") {
    try {
      const parsed = JSON.parse(value);
      console.debug('Value for ', fullKey, ' amounts to ', parsed);
      return parsed.value;
    } catch (e) {
      console.debug('Could not parse value for ', key, ' as ', fullKey, ' with value ', value, e);
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
