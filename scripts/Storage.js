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

Storage.get = function(prefix) {
  return new Storage(prefix);
}
