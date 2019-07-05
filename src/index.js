const { app, BrowserWindow, ipcMain, electron } = require('electron');
const killBrowsers = require('./helpers/kill_browsers');
const test = require('./helpers/test_helper');
const settings = require('./settings');
const mongoose = require('mongoose');
const queries = require('./db/queries');
const os = require('os');
const path = require('path');

require('electron-reload')(__dirname);

if (require('electron-squirrel-startup')) {
  app.quit();
}

require('dotenv').config();

let window;
let jobs;
let width = 800;
let height = 600;
let canQuitApp = false;

const openMain = (initData) => {
  window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true
    },
    alwaysOnTop: false,
    frame: true,
    fullscreen: false
  });
  ipcMain.on('main-request-data', (e, args) => {
    e.reply('main-request-data-response', initData);
  })
  window.loadFile(path.join(__dirname, 'pages', `${settings.PAGES.startPage}.html`));
  window.on('close', () => {
    app.quit();
  })
}

app.on('ready', async () => {

  // connect to DB
  require('./helpers/connect_db')
  // Seed data if needed
  require('./db/seed');

  // get user info
  let userDomain = process.env.USERDOMAIN || "intec";
  let userName = process.env.USERNAME || os.userInfo().username;

  // Get Blacklist users
  const blackListedUsers = await queries.getBlackListUsers();
  const isUserBlackListed = blackListedUsers.find(u => u.intecId.toLowerCase() === userName.toLowerCase());

  if (!isUserBlackListed) {
    // Stop execution of the program.
    console.log('You are not an administrator for LTI Admin V2, so you cannot open this software. ;)');
    app.quit();
    return;
  }
  
  // get configs
  const configs = await queries.getConfigs();
  // get trimestres
  const trimesters = await queries.getTrimesters();
  const currentTrimester = await queries.getCurrentTrimester();

  const APP_PREFERENCES = {
    fullscreen: configs.find(cfg => cfg.key === settings.CONFIGS.isFullscreen).value,
    showSurvey: configs.find(cfg => cfg.key === settings.CONFIGS.showSurvey).value,
    studentUrl: configs.find(cfg => cfg.key === settings.CONFIGS.studentUrl).value,
    teacherUrl: configs.find(cfg => cfg.key === settings.CONFIGS.teacherUrl).value,
  }

  const user = await queries.getUser(userName, userDomain);

  openMain({
    user: user,
    admins: blackListedUsers,
    preferences: APP_PREFERENCES
  });
  
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && canQuitApp) {
    app.quit();
  }
});

app.on('activate', () => {
  if (window === null) {
    createWindow(settings.PAGES.startPage, true);
  }
});

ipcMain.on('add-student-to-history', async (event, args) => {
  console.log('Acceptting rules...', args);
  if (args.userDomain.toLowerCase() === "intec") {
    await queries.addStudent({
      name: args.userName,
      intecId: args.userName,
      fullName: args.userName,
      computer: os.hostname(),
      room: '',
      createdAt: Date.now(),
      subject: '',
      trimesterName: args.trimester.name,
      domain: args.userDomain,
      hasFilledSurvey: false
    });
  } else {
    await queries.addTeacher({
      name: args.userName,
      intecId: args.userName,
      fullName: args.userName,
      computer: os.hostname(),
      room: '',
      createdAt: Date.now(),
      subject: '',
      trimesterName: args.trimester.name,
      domain: args.userDomain,
      hasFilledSurvey: false
    });
  }
})
