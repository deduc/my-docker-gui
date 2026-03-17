const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dockerService = require('./docker-service');

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
