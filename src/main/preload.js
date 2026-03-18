const { contextBridge, ipcRenderer } = require('electron');

// Definir las clases de datos directamente en el preload
class DockerImageData {
    constructor(repository, tag, id, diskUsage, contentSize) {
        this.repository = repository;
        this.tag = tag;
        this.id = id;
        this.diskUsage = diskUsage;
        this.contentSize = contentSize;
        this.fullName = `${repository}:${tag}`;
    }

    getShortId(length = 12) {
        return this.id ? this.id.substring(0, length) : 'N/A';
    }

    getDisplayInfo() {
        return `ID: ${this.getShortId()} | ${this.diskUsage} | ${this.contentSize}`;
    }
}

class DockerContainerData {
    constructor(id, image, status, ports, names) {
        this.id = id;
        this.image = image;
        this.status = status;
        this.ports = ports;
        this.names = names;
    }

    isRunning() {
        return this.status.includes('Up');
    }

    isStopped() {
        return !this.isRunning();
    }

    getStatusInfo() {
        const portInfo = this.ports || 'Sin puertos';
        return `${this.image} | ${portInfo} | ${this.status || 'Desconocido'}`;
    }
}

class DockerVolumeData {
    constructor(name, driver) {
        this.name = name;
        this.driver = driver;
    }

    getDisplayInfo() {
        return `Driver: ${this.driver}`;
    }
}

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
    getVolumes: () => ipcRenderer.invoke('get-volumes'),
    removeVolume: (volumeName) => ipcRenderer.invoke('remove-volume', volumeName),
    // Command history management
    saveCommandHistory: (entry) => ipcRenderer.invoke('save-command-history', entry),
    getCommandHistory: () => ipcRenderer.invoke('get-command-history'),
    // Exponer las clases de datos
    DockerImageData: DockerImageData,
    DockerContainerData: DockerContainerData,
    DockerVolumeData: DockerVolumeData
});
