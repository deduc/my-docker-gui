const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
    // Docker APIs
    docker: {
        getVersion: () => ipcRenderer.invoke('docker:version'),
        getInfo: () => ipcRenderer.invoke('docker:info'),
        getRunningContainers: () => ipcRenderer.invoke('docker:ps'),
        getImages: () => ipcRenderer.invoke('docker:images'),
        runContainer: (options) => ipcRenderer.invoke('docker:run', options),
        stopContainer: (containerId) => ipcRenderer.invoke('docker:stop', containerId),
        removeContainer: (containerId) => ipcRenderer.invoke('docker:remove', containerId),
        runDockerCompose: (composeContent, workingDir) => ipcRenderer.invoke('docker:compose', composeContent, workingDir),
        executeCommand: (command) => ipcRenderer.invoke('docker:execute', command)
    },
    
    // Utilidades generales
    showMessageBox: (options) => ipcRenderer.invoke('dialog:showMessageBox', options),
    showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options),
    showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
    
    // Información de la aplicación
    getVersion: () => process.env.npm_package_version,
    getPlatform: () => process.platform
});

// Eventos para notificaciones desde el main process
contextBridge.exposeInMainWorld('electronEvents', {
    onDockerUpdate: (callback) => ipcRenderer.on('docker:update', callback),
    onDockerError: (callback) => ipcRenderer.on('docker:error', callback),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
