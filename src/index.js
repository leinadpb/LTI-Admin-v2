const { app, BrowserWindow, ipcMain, electron } = require('electron');
const killBrowsers = require('./helpers/kill_browsers');
const test = require('./helpers/test_helper');
const settings = require('./settings');
const mongoose = require('mongoose');
const queriesFns = require('./db/queries');
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
let queries = undefined;

const openMain = (initData) => {
  window = new BrowserWindow({
    width: 1280,
    height: 780,
    webPreferences: {
      nodeIntegration: true,
      nativeWindowOpen: true
    },
    alwaysOnTop: false,
    frame: true,
    fullscreen: false
  });
  ipcMain.on('main-request-data', (e, args) => {
    console.log('SUBJECTS SUBJECTS SUBJECTS SUBJECTS SUBJECTS');
    console.log(initData.subjects);
    e.reply('main-request-data-response', initData);
  });
  ipcMain.on('fetch-students', async (e, args) => {
    console.log(args.filterObject);
    let studentsResult = (await queries.getHistoryStudentsFiltered(args.filterObject)).data.data;
    e.reply('fetch-students-response', studentsResult);
  });
  ipcMain.on('save-preferences', async (e, args) => {
    let preferences = args.newPreferences;
    await queries.updatePreferences(preferences);
    e.reply('save-preferences-success', {});
  });

  // Advanced command -> Update signatures
  ipcMain.on('adv-cmd-upd-sig', async (e, args) => {
    let result = false;
    let resp = null;
    try {
      resp = await queries.advancedCommandUpdateSignatures();
    } catch(e) {
      console.log(e);
    }
    console.log('DATA >>>>>>>>>>');
      console.log(resp);
    if (!!resp && !!resp.data && !!resp.data.success && resp.data.success) {
      result = true;
      
    }
    e.reply('adv-cmd-upd-sig-response', {
      success: result,
    });
  })

  // Rules Dialogs
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
      let rules = (await queries.getRules()).data.data;
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
      let rules = (await queries.getRules()).data.data;
      await queries.updateRulesNumbers(rules);
      rules = (await queries.getRules()).data.data;
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
      let existingRules = (await queries.getRules()).data.data;
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

  // Trimesters Dialogs
  ipcMain.on('open-edit-trimester', async(e, args) => {
    let data = args;
    ipcMain.on('edit-trimester-request-data', async(e, args) => {
      e.reply('edit-trimester-response-data', data);
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
    ipcMain.on('edit-trimester-request-save', async(e, args) => {
      let trimester = args.newTrimester;
      console.log('to update >>', trimester);
      await queries.updateTrimester(trimester);
      let trimesters = (await queries.getTrimesters()).data.data;
      // child.close();
      e.reply('refresh-trimesters', {trimesters: trimesters});
    })
    child.loadFile(path.join(__dirname, 'pages', `${settings.PAGES.editTrimesterPage}.html`));
    child.show();
  });
  ipcMain.on('open-add-trimester', async(e, args) => {
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
    ipcMain.on('add-trimester-request-save', async(e, args) => {
      let trimester = args.newTrimester;
      console.log('to add >>', trimester);
      await (queries.addTrimester(trimester)).data.data;
      let trimesters = (await queries.getTrimesters()).data.data;
      // child.close();
      e.reply('refresh-trimesters', {trimesters: trimesters});
    })
    child.loadFile(path.join(__dirname, 'pages', `${settings.PAGES.addTrimesterPage}.html`));
    child.show();
  });

  // Administrators Dialogs
  ipcMain.on('open-edit-admin', async(e, args) => {
    let data = args;
    ipcMain.on('edit-admin-request-data', async(e, args) => {
      e.reply('edit-admin-response-data', data);
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
    ipcMain.on('edit-admin-request-save', async(e, args) => {
      let admin = args.newAdmin;
      console.log('to edit >>', admin);
      await queries.updateBlackListUser(admin);
      let admins = (await queries.getBlackListUsers()).data.data;
      // child.close();
      e.reply('refresh-admins', {admins: admins});
    })
    child.loadFile(path.join(__dirname, 'pages', `${settings.PAGES.editAdminPage}.html`));
    child.show();
  });
  ipcMain.on('open-delete-admin', async(e, args) => {
    let data = args;
    ipcMain.on('delete-admin-request-data', async(e, args) => {
      e.reply('delete-admin-response-data', data);
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
    ipcMain.on('delete-admin-request-save', async(e, args) => {
      let admin = args.newAdmin;
      console.log('to delete >>', admin);
      await queries.deleteBlackListUser(admin);
      let admins = (await queries.getBlackListUsers()).data.data;
      // child.close();
      e.reply('refresh-admins', {admins: admins});
    })
    child.loadFile(path.join(__dirname, 'pages', `${settings.PAGES.deleteAdminPage}.html`));
    child.show();
  });
  ipcMain.on('open-add-admins', async(e, args) => {
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
    ipcMain.on('add-admin-request-save', async(e, args) => {
      let admin = args.newAdmin;
      let existingAdmins = (await queries.getBlackListUsers()).data.data;
      console.log('to create >>', admin);
      await queries.addBlackListUser(admin);
      existingAdmins.push(admin); // append created admin
      // child.close();
      e.reply('refresh-admins', {admins: existingAdmins});
    })
    child.loadFile(path.join(__dirname, 'pages', `${settings.PAGES.addAdminPage}.html`));
    child.show();
  });
  global.window = window;
  window.loadFile(path.join(__dirname, 'pages', `${settings.PAGES.startPage}.html`));
  window.on('close', () => {
    app.quit();
  })
}

app.on('ready', async () => {

  queriesFns.getQueries().then(async (_queries) => {
    queries = _queries;
    // get user info
    let userDomain = process.env.USERDOMAIN || "intec";
    let userName = process.env.USERNAME || os.userInfo().username;

    // Get Blacklist users
    const blackListedUsers = (await queries.getBlackListUsers()).data.data;
    const isUserBlackListed = blackListedUsers.find(u => u.intecId.toLowerCase() === userName.toLowerCase());

    // if (!isUserBlackListed) {
    //   // Stop execution of the program.
    //   console.log('You are not an administrator for LTI Admin V2, so you cannot open this software. ;)');
    //   app.quit();
    //   return;
    // }
    
    // get configs
    const configs = (await queries.getConfigs()).data.data;
    // get trimestres
    const trimesters = (await queries.getTrimesters()).data.data;
    const currentTrimester = (await queries.getCurrentTrimester()).data.data;
    const allStudents = (await queries.getHistoryStudents()).data.data;
    const subjects = (await queries.getSubjects()).data.data;
    const rules = (await queries.getRules()).data.data;

    const APP_PREFERENCES = {
      fullscreen: !!configs.find(cfg => cfg.key === settings.CONFIGS.isFullscreen) ? configs.find(cfg => cfg.key === settings.CONFIGS.isFullscreen).value : '',
      showSurvey: !!configs.find(cfg => cfg.key === settings.CONFIGS.showSurvey) ? configs.find(cfg => cfg.key === settings.CONFIGS.showSurvey).value : '',
      studentUrl: !!configs.find(cfg => cfg.key === settings.CONFIGS.studentUrl) ? configs.find(cfg => cfg.key === settings.CONFIGS.studentUrl).value : '',
      teacherUrl:  !!configs.find(cfg => cfg.key === settings.CONFIGS.teacherUrl) ? configs.find(cfg => cfg.key === settings.CONFIGS.teacherUrl).value : '',
      reminderText: !!configs.find(cfg => cfg.key === settings.CONFIGS.reminderText) ? configs.find(cfg => cfg.key === settings.CONFIGS.reminderText).value : '',
    }

    const user = {
      name: userName,
      domain: userDomain
    }

    openMain({
      user: user,
      admins: blackListedUsers,
      preferences: APP_PREFERENCES,
      configs: configs,
      trimesters: trimesters,
      currentTrimester: currentTrimester,
      allStudents: allStudents,
      subjects: subjects,
      rules: rules,
    });
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

