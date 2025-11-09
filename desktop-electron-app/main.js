const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');


const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: '#1b2838',
    frame: true,
    titleBarStyle: 'default',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });


  const session = mainWindow.webContents.session;
  

  session.cookies.set({
    url: 'http://127.0.0.1:8000',
    name: 'xide-electron',
    value: 'enabled',
    sameSite: 'no_restriction'
  });

  mainWindow.loadFile('index.html');


  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Console [${level}]: ${message}`);
  });
}

app.whenReady().then(() => {
  createWindow();
  

  const filter = {
    urls: ['http://127.0.0.1:8000/*', 'http://localhost:8000/*']
  };
  

  mainWindow.webContents.session.webRequest.onCompleted(filter, async (details) => {
    const setCookieHeaders = details.responseHeaders['set-cookie'] || details.responseHeaders['Set-Cookie'];
    
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      console.log('🍪 Обнаружены Set-Cookie headers:', setCookieHeaders);
      
      for (const cookieHeader of setCookieHeaders) {
        try {
          const parts = cookieHeader.split(';');
          const [name, value] = parts[0].split('=');
          
          if (name && value) {
            await mainWindow.webContents.session.cookies.set({
              url: details.url,
              name: name.trim(),
              value: value.trim(),
              sameSite: 'no_restriction'
            });
            console.log(`   ✓ Cookie автоматически сохранен: ${name.trim()}`);
          }
        } catch (error) {
          console.error('   ✗ Ошибка сохранения cookie:', error);
        }
      }

      mainWindow.webContents.send('cookies-updated', {
        url: details.url,
        cookies: setCookieHeaders
      });
    }
  });
  

  mainWindow.webContents.session.webRequest.onHeadersReceived(filter, (details, callback) => {
    const responseHeaders = {
      ...details.responseHeaders,
      'Access-Control-Allow-Origin': ['*'],
      'Access-Control-Allow-Methods': ['GET, POST, PUT, DELETE, OPTIONS'],
      'Access-Control-Allow-Headers': ['Content-Type, X-CSRFToken, Authorization'],
      'Access-Control-Allow-Credentials': ['true']
    };
    
    callback({ responseHeaders });
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});


ipcMain.handle('store:get', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', async (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('store:delete', async (event, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle('store:clear', async () => {
  store.clear();
  return true;
});


ipcMain.handle('cookies:get', async (event, url) => {
  const cookies = await mainWindow.webContents.session.cookies.get({ url });
  return cookies;
});

ipcMain.handle('cookies:set', async (event, cookie) => {
  try {
    await mainWindow.webContents.session.cookies.set(cookie);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cookies:remove', async (event, url, name) => {
  try {
    await mainWindow.webContents.session.cookies.remove(url, name);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cookies:clear', async () => {
  try {
    await mainWindow.webContents.session.clearStorageData({ storages: ['cookies'] });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
