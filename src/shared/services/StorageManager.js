class StorageManager {
  constructor(namespace = "DevKit") {
    this.namespace = namespace; // To avoid conflicts with other websites
  }

  // Build the final key (namespace + key)
  _key(key) {
    return `${this.namespace}:${key}`;
  }

  // ✅ Save a value (auto JSON)
  set(key, value) {
    try {
      localStorage.setItem(this._key(key), JSON.stringify(value));
      return true;
    } catch (err) {
      console.error("StorageManager set error:", err);
      return false;
    }
  }

  // ✅ Get a value (safe JSON)
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(this._key(key));
      if (!data) return defaultValue;
      return JSON.parse(data);
    } catch (err) {
      console.error("StorageManager get error:", err);
      return defaultValue;
    }
  }

  // ✅ Remove a key
  remove(key) {
    try {
      localStorage.removeItem(this._key(key));
      return true;
    } catch (err) {
      console.error("StorageManager remove error:", err);
      return false;
    }
  }

  // ✅ Clear all keys ONLY inside this namespace
  clearNamespace() {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(this.namespace + ":")) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (err) {
      console.error("StorageManager namespace clear error:", err);
      return false;
    }
  }

  // ✅ Check if a value exists
  has(key) {
    return localStorage.getItem(this._key(key)) !== null;
  }
}

// Export a single shared instance for whole app
export const storage = new StorageManager("DevKit");
