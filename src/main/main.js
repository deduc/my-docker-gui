const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const dockerService = require('../services/dockerService');

let mainWindow;

function createWindow() {
    // Determinar el modo de ventana basado en argumentos
    const isFullscreen = process.argv.includes('--fullscreen');
    const isMaximized = process.argv.includes('--maximized');
    const isProduction = process.argv.includes('--production');
    
    // Por defecto, iniciar maximizado (npm run start)
    const shouldMaximize = isMaximized || (!isFullscreen && !isProduction);
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1000,
        fullscreen: isFullscreen,
        maximized: shouldMaximize,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../../assets/icon.png'),
        titleBarStyle: 'default',
        // Ocultar menú en producción
        autoHideMenuBar: isProduction,
        // Prevenir que el usuario pueda salir de pantalla completa en modo fullscreen
        kiosk: isFullscreen
    });

    // Cargar el archivo HTML principal (dashboard)
    mainWindow.loadFile(path.join(__dirname, '../renderer/pages/home/index.html'));

    // Mostrar la ventana cuando esté lista
    mainWindow.once('ready-to-show', () => {
        if (!isFullscreen && !shouldMaximize) {
            mainWindow.center();
        }
        mainWindow.show();
    });

    // Abrir DevTools solo en modo desarrollo (excluyendo producción)
    if (process.argv.includes('--dev') && !isProduction) {
        mainWindow.webContents.openDevTools();
    }

    // Prevenir que se cierre la ventana en modo kiosk (fullscreen)
    if (isFullscreen) {
        mainWindow.on('closed', (e) => {
            e.preventDefault();
        });
        
        // Permitir salir con Alt+F4 en modo kiosk
        mainWindow.on('before-quit', (e) => {
            if (isFullscreen) {
                // Permitir salir solo si es una acción intencional
                app.quit();
            }
        });
    } else {
        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    }
}

// IPC Handlers para Docker
ipcMain.handle('docker:version', async () => {
    try {
        return await dockerService.getDockerVersion();
    } catch (error) {
        throw error;
    }
});

ipcMain.handle('docker:info', async () => {
    try {
        return await dockerService.getDockerInfo();
    } catch (error) {
        throw error;
    }
});

ipcMain.handle('docker:ps', async () => {
    try {
        return await dockerService.getRunningContainers();
    } catch (error) {
        throw error;
    }
});

ipcMain.handle('docker:images', async () => {
    try {
        return await dockerService.getImages();
    } catch (error) {
        throw error;
    }
});

ipcMain.handle('docker:run', async (event, options) => {
    try {
        return await dockerService.runContainer(options);
    } catch (error) {
        throw error;
    }
});

ipcMain.handle('docker:stop', async (event, containerId) => {
    try {
        return await dockerService.stopContainer(containerId);
    } catch (error) {
        throw error;
    }
});

ipcMain.handle('docker:remove', async (event, containerId) => {
    try {
        return await dockerService.removeContainer(containerId);
    } catch (error) {
        throw error;
    }
});

ipcMain.handle('docker:compose', async (event, composeContent, workingDir) => {
    try {
        return await dockerService.runDockerCompose(composeContent, workingDir);
    } catch (error) {
        throw error;
    }
});

ipcMain.handle('docker:execute', async (event, command) => {
    try {
        return await dockerService.executeCommand(command);
    } catch (error) {
        throw error;
    }
});

// Dialog Handlers
ipcMain.handle('dialog:showMessageBox', async (event, options) => {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
});

ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

ipcMain.handle('dialog:showSaveDialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
    if (mainWindow) {
        dialog.showErrorBox('Error', `Ha ocurrido un error no capturado: ${error.message}`);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rechazo no manejado en:', promise, 'razón:', reason);
});

// Eventos de la aplicación
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

// Seguridad: prevenir múltiples instancias
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Alguien intentó ejecutar una segunda instancia, enfocar la ventana principal
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}
