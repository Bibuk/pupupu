const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {

  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
    clear: () => ipcRenderer.invoke('store:clear')
  },

  cookies: {
    get: (url) => ipcRenderer.invoke('cookies:get', url),
    set: (cookie) => ipcRenderer.invoke('cookies:set', cookie),
    remove: (url, name) => ipcRenderer.invoke('cookies:remove', url, name),
    clear: () => ipcRenderer.invoke('cookies:clear')
  },

  onCookiesUpdated: (callback) => {
    ipcRenderer.on('cookies-updated', (event, data) => callback(data));
  }
});
