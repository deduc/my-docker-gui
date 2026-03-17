const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    dockerCommand: (command) => ipcRenderer.invoke('docker-command', command),
    getContainers: () => ipcRenderer.invoke('get-containers'),
    getImages: () => ipcRenderer.invoke('get-images'),
    getVolumes: () => ipcRenderer.invoke('get-volumes')
});
