/* From https://github.com/jakearchibald/idb-keyval */
/* Retreived 2020-04-10 */

class Store {
  constructor(dbName = 'vr-store', storeName = 'vr') {
    this.storeName = storeName;
    this._dbp = new Promise((resolve, reject) => {
      const openreq = indexedDB.open(dbName, 1);
      openreq.onerror = () => reject(openreq.error);
      openreq.onsuccess = () => resolve(openreq.result);
      // First time setup: create an empty object store
      openreq.onupgradeneeded = () => {
        openreq.result.createObjectStore(storeName);
      };
    });
  }

  _withIDBStore = (type, callback) => {
    return this._dbp.then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, type);
      transaction.oncomplete = () => resolve();
      transaction.onabort = transaction.onerror = () => reject(transaction.error);
      callback(transaction.objectStore(this.storeName));
    }));
  }
};


const idbKeyval = {
  store: new Store('vr-store', 'vr'),

  lastVideoFile: null,

  get: async (key, cb) => {
    let req;
    return idbKeyval.store._withIDBStore('readonly', store => {
      req = store.get(key);
    }).then(() => {
      if( cb ) cb(req.result);
      return req.result
    });
  },

  set: (key, value) => {
    return idbKeyval.store._withIDBStore('readwrite', store => {
      store.put(value, key);
    });
  },

  del: (key) => {
    return idbKeyval.store._withIDBStore('readwrite', store => {
      store.delete(key);
    });
  },

  clear: () => {
    return idbKeyval.store._withIDBStore('readwrite', store => {
      store.clear();
    });
  },

  keys: async (cb) => {
    const keys = [];
    return idbKeyval.store._withIDBStore('readonly', store => {
      // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
      // And openKeyCursor isn't supported by Safari.
      (store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
        if (!this.result)
          return;
        keys.push(this.result.key);
        this.result.continue();
      };
    }).then(() => {
      if( cb ) cb(keys);
      return keys;
    });
  }
};

export default idbKeyval;
export { idbKeyval };
