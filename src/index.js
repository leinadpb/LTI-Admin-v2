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
      nodeIntegration: true,
      nativeWindowOpen: true
    },
    alwaysOnTop: true,
    frame: true,
    fullscreen: false
  });
  ipcMain.on('main-request-data', (e, args) => {
    e.reply('main-request-data-response', initData);
  })
  ipcMain.on('fetch-students', async (e, args) => {
    let studentsResult = await queries.getHistoryStudentsFiltered(args.filterObject);
    e.reply('fetch-students-response', studentsResult);
  })

  ipcMain.on('open-edit-rules', async(e, args) => {
    let data = args;
    ipcMain.on('edit-rule-request-data', async(e, args) => {
      e.reply('edit-rule-response-data', data);
    })
    let child = new BrowserWindow({ 
      parent: window,
      width: 480,
      height: 480,
      webPreferences: {
        nodeIntegration: true,
        nativeWindowOpen: true
      },
      frame: false,
    });
    ipcMain.on('edit-rule-request-save', async(e, args) => {
      let rule = args.newRule;
      console.log('to update >>', rule);
      await queries.updateRule(rule);
      let rules = await queries.getRules();
      // child.close();
      e.reply('refresh-rules', {rules: rules});
    })
    child.loadFile(path.join(__dirname, 'pages', `${settings.PAGES.editRulePage}.html`));
    child.show();
  });
  ipcMain.on('open-delete-rules', async(e, args) => {
    let data = args;
    ipcMain.on('delete-rule-request-data', async(e, args) => {
      e.reply('delete-rule-response-data', data);
    })
    let child = new BrowserWindow({ 
      parent: window,
      width: 480,
      height: 480,
      webPreferences: {
        nodeIntegration: true,
        nativeWindowOpen: true
      },
      frame: false
    });
    ipcMain.on('delete-rule-request-save', async(e, args) => {
      let rule = args.newRule;
      console.log('to delete >>', rule);
      await queries.deleteRule(rule);
      let rules = await queries.getRules();
      await queries.updateRulesNumbers(rules);
      rules = await queries.getRules();
      // child.close();
      e.reply('refresh-rules', {rules: rules});
    })
    child.loadFile(path.join(__dirname, 'pages', `${settings.PAGES.deleteRulesPage}.html`));
    child.show();
  });
  ipcMain.on('open-add-rules', async(e, args) => {
    let data = args;
    let child = new BrowserWindow({ 
      parent: window,
      width: 480,
      height: 480,
      webPreferences: {
        nodeIntegration: true,
        nativeWindowOpen: true
      },
      frame: false
    });
    ipcMain.on('add-rule-request-save', async(e, args) => {
      let rule = args.newRule;
      let existingRules = await queries.getRules();
      rule.number = existingRules.length + 1;
      console.log('to create >>', rule);
      await queries.addRule(rule);
      existingRules.push(rule); // append created rule
      // child.close();
      e.reply('refresh-rules', {rules: existingRules});
    })
    child.loadFile(path.join(__dirname, 'pages', `${settings.PAGES.addRulePage}.html`));
    child.show();
  });
  global.window = window;
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

  // if (!isUserBlackListed) {
  //   // Stop execution of the program.
  //   console.log('You are not an administrator for LTI Admin V2, so you cannot open this software. ;)');
  //   app.quit();
  //   return;
  // }
  
  // get configs
  const configs = await queries.getConfigs();
  // get trimestres
  const trimesters = await queries.getTrimesters();
  const currentTrimester = await queries.getCurrentTrimester();
  const allStudents = await queries.getHistoryStudents();
  const subjects = await queries.getSubjects();
  const rules = await queries.getRules();

  const APP_PREFERENCES = {
    fullscreen: configs.find(cfg => cfg.key === settings.CONFIGS.isFullscreen).value,
    showSurvey: configs.find(cfg => cfg.key === settings.CONFIGS.showSurvey).value,
    studentUrl: configs.find(cfg => cfg.key === settings.CONFIGS.studentUrl).value,
    teacherUrl: configs.find(cfg => cfg.key === settings.CONFIGS.teacherUrl).value,
  }

  const user = {
    name: userName,
    domain: userDomain
  }

  openMain({
    user: user,
    admins: blackListedUsers,
    preferences: APP_PREFERENCES,
    trimesters: trimesters,
    currentTrimester: currentTrimester,
    allStudents: allStudents,
    subjects: subjects,
    rules: rules,
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

