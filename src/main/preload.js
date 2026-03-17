const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    dockerCommand: (command) => ipcRenderer.invoke('docker-command', command),
    checkDockerVersion: () => ipcRenderer.invoke('check-docker-version'),
    runContainer: (options) => ipcRenderer.invoke('run-container', options),
    startContainer: (containerId) => ipcRenderer.invoke('start-container', containerId),
    stopContainer: (containerId) => ipcRenderer.invoke('stop-container', containerId),
    pauseContainer: (containerId) => ipcRenderer.invoke('pause-container', containerId),
    unpauseContainer: (containerId) => ipcRenderer.invoke('unpause-container', containerId),
    removeContainer: (containerId) => ipcRenderer.invoke('remove-container', containerId),
    getContainers: () => ipcRenderer.invoke('get-containers'),
    getImages: () => ipcRenderer.invoke('get-images'),
    getVolumes: () => ipcRenderer.invoke('get-volumes')
});
