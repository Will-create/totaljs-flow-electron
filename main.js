const {app, BrowserWindow, autoUpdater, Tray, nativeImage, Menu, dialog } = require('electron');
const path = require('path');
const { Server } = require('./server');

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
var mainWindow;
var iconpath = path.join(__dirname, './icon/icon.png');
Server.on('eaddrinuse', async function() {
  var response = await dialog.showMessageBox({ type: 'question',  title: 'Total.js Flow v10.0', message: 'Failed to start server: Port 8500 already in use', buttons: ['Open anyway', 'Cancel']});
  console.log(response);
  response.response === 0 ? createwindow('http://0.0.0.0:8500', true): app.exit();
});
autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail:
      'A new version has been downloaded. Restart the application to apply the updates.',
  }

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall()
  })
});

const flowserver = 'https://flowserver.vercel.app';
const url = `${flowserver}/update/${process.platform}/${app.getVersion()}`

autoUpdater.setFeedURL({ url })
autoUpdater.on('error', (message) => {
  console.error('There was a problem updating the application')
  console.error(message)
});
Server.on('ready', function(){
  if (!mainWindow) {
    create();
  }
});
setInterval(() => {
  autoUpdater.checkForUpdates()
}, 60000);  
Server.on('ready', function() {
  if (!mainWindow) {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: nativeImage.createFromPath(iconpath).resize({ width: 24, height: 24 })
    });
    mainWindow.loadURL('http://0.0.0.0:8500');
  } else 
    mainWindow.loadURL('http://0.0.0.0:8500');
});

function createwindow (url, newframe) {
  if (newframe) {
    var win = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: nativeImage.createFromPath(iconpath).resize({ width: 24, height: 24 })
    });
    win.loadURL(url);
  } else 
    mainWindow && mainWindow.loadURL(url);
}

app.whenReady().then(() => {
  createwindow('http://0.0.0.0:8500');
  Server.listen();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createwindow()
  });
});

// click events
function about() {
  dialog.showMessageBox({ type: 'info',  title: 'Total.js Flow v10.0', message: 'Visual Programming Interface for Low-code Development accessible through a web browser. The tool integrates, processes, and transforms various events and data in real time.' });
};

function create() {
  const trayicon = nativeImage.createFromPath(iconpath).resize({ width: 20, height: 20 });
  const tray = new Tray(trayicon);
  const menutemplate = [
    { label: ''},
    { label: 'Start', enabled: false, click: () => {
      Server.listen();
    }},
    { label: 'Stop', enabled: true, click: () => {
      Server.close();
    }},
    { label: '', enabled: false },
    { label: 'New Window', click: () => createwindow('http://0.0.0.0:8500', true)},
    { label: 'Help', submenu: [
      { label: 'Website', click: () => createwindow('https://totaljs.com/flow', true)}, 
      { label: 'Tutorials', click: () => createwindow('https://www.youtube.com/results?search_query=total+js+flow', true) }, 
      { label: 'Documentation', click: () => createwindow('https://docs.totaljs.com/flow10/', true)}, 
      { label: 'Github', click: () => createwindow('https://github.com/totaljs/flow', true)},
      { label: 'About', click: () => about() }, 
    ]},
    { label: 'Quit', click: () => app.quit() }
  ];

  Server.on('stop', function() {
    if (mainWindow) {
      menutemplate[1].enabled = true;
      menutemplate[2].enabled = false;
      buildmenu(menutemplate);
      dialog.showMessageBox({ type: 'info', title: 'Total.js Flow v1o', message: 'Total.js Flow v10 is closed!' });
    }
  });

  Server.on('ready',function() {
    if (mainWindow) {
      menutemplate[1].enabled = false;
      menutemplate[2].enabled = true;
      buildmenu(menutemplate);
    }
  });


 function buildmenu(menu) {
  var status = Server.inuse ? 'Active' : 'Inactive';
  var icon = Server.inuse ? './icon/green-circle.png' : './icon/red-circle.png';

  if (Server.inuse) {
    menu[1].enabled = false;
    menu[2].enabled = true;
  }

  menu[0].label = 'Service Status ' + status; 
  var iconpath = path.join(__dirname, icon);
  menu[0].icon = nativeImage.createFromPath(iconpath).resize({ width: 20, height: 20 });
  const traymenu = Menu.buildFromTemplate(menu);
  
  tray.setContextMenu(traymenu);
 } 
 buildmenu(menutemplate);
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

app.on('quit', () => {
  Server.close(function() {
    created = false;
  }); 
});