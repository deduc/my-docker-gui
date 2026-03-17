const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dockerService = require('./docker-service');

// Hot reload para desarrollo
if (process.argv.includes('--dev')) {
    try {
        require('electron-reload')(__dirname, {
            electron: path.join(__dirname, '../../node_modules/.bin/electron'),
            hardResetMethod: 'exit'
        });
    } catch (error) {
        console.log('Electron reload not available in production');
    }
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../assets/icon.png'),
        titleBarStyle: 'default'
    });

    mainWindow.loadFile('src/renderer/index.html');

    // Only show DevTools in dev mode
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC handlers for Docker operations
ipcMain.handle('docker-command', async (event, command) => {
    try {
        const result = await dockerService.executeCommand(command);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Handler para verificar versión de Docker
ipcMain.handle('check-docker-version', async () => {
    try {
        const result = await dockerService.executeCommand('docker --version');
        console.log('[Main] Docker version result:', result);
        
        // Extraer versión del stdout
        const versionMatch = result.stdout.match(/Docker version (\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : result.stdout.trim();
        
        console.log('[Main] Extracted Docker version:', version);
        return { success: true, version: version };
    } catch (error) {
        console.error('[Main] Error checking Docker version:', error);
        return { success: false, error: 'Docker no está instalado o no está en ejecución' };
    }
});

ipcMain.handle('run-container', async (event, options) => {
    try {
        const result = await dockerService.runContainer(options);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('start-container', async (event, containerId) => {
    try {
        const result = await dockerService.startContainer(containerId);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('stop-container', async (event, containerId) => {
    try {
        const result = await dockerService.stopContainer(containerId);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('pause-container', async (event, containerId) => {
    try {
        const result = await dockerService.pauseContainer(containerId);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('unpause-container', async (event, containerId) => {
    try {
        const result = await dockerService.unpauseContainer(containerId);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('remove-container', async (event, containerId) => {
    try {
        const result = await dockerService.removeContainer(containerId);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-containers', async () => {
    try {
        const containers = await dockerService.getContainers();
        return { success: true, data: containers };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-images', async () => {
    try {
        const images = await dockerService.getImages();
        return { success: true, data: images };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-volumes', async () => {
    try {
        const volumes = await dockerService.getVolumes();
        return { success: true, data: volumes };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
