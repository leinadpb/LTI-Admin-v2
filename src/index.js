const { app, BrowserWindow } = require('electron');
const killBrowsers = require('./helpers/kill_browsers');
const test = require('./helpers/test_helper');
const settings = require('./settings');
const mongoose = require('mongoose');
const queries = require('./db/queries');
const os = require('os');
const path = require('path');

if (require('electron-squirrel-startup')) {
  app.quit();
}

require('dotenv').config();

let window;
let jobs;
let width = 800;
let height = 600;

const executeJobs = () => {
  killBrowsers.execute();
  test.execute();
}

const showSurvey = (url) => {
  console.log('Show survey: ', url);
}

const showReminder = () => {
  window = new BrowserWindow({
    width: 1100,
    height: 500,
    webPreferences: {
      nodeIntegration: true
    },
    alwaysOnTop: true,
    frame: false
  });
  window.loadFile(path.join(__dirname, 'pages', `${settings.PAGES.reminderPage}.html`));
  window.on('close', () => {
    console.log('You have closed the window');
  })
}

const showRules = (username, trimester) => {
  console.log('Will show rules to user');
}

app.on('ready', async () => {

  // For angelo rapid developemnt
  showReminder();

  // // connect to DB
  // require('./helpers/connect_db')
  // // Seed data if needed
  // require('./db/seed');
  // // get configs
  // const configs = await queries.getConfigs();
  // // get trimestres
  // const trimesters = await queries.getTrimesters();
  // // get user info
  // let userDomain = process.env.USERDOMAIN || "intec";
  // let userName = process.env.USERNAME || os.userInfo().username || "1066359"; // TEST

  // const currentTrimester = await queries.getCurrentTrimester();

  // const APP_PREFERENCES = {
  //   fullscreen: configs.find(cfg => cfg.key === settings.CONFIGS.isFullscreen).value,
  //   showSurvey: configs.find(cfg => cfg.key === settings.CONFIGS.showSurvey).value,
  //   studentUrl: configs.find(cfg => cfg.key === settings.CONFIGS.studentUrl).value,
  //   teacherUrl: configs.find(cfg => cfg.key === settings.CONFIGS.teacherUrl).value,
  // }

  // const STUDENTS = await queries.getStudentInCurrentTrimester(currentTrimester[0]);
  // const CURRENT_STUDENT = STUDENTS[0];

  // if (!CURRENT_STUDENT) {
  //   console.log(CURRENT_STUDENT);
  //   await queries.addStudent({
  //     name: userName,
  //     intecId: userName,
  //     fullName: userName,
  //     computer: os.hostname(),
  //     room: '',
  //     createdAt: Date.now(),
  //     subject: '',
  //     trimesterName: currentTrimester[0].name,
  //     domain: userDomain
  //   });
  //   showRules(userName, currentTrimester[0]);
  // } else {
  //   showReminder();
  // }

  // TODO: Move this code to execute AFTER ONE OF
  // THE PREVIOUS WINDOWAS ARE CLOSED....
  // if (APP_PREFERENCES.showSurvey) {
  //   if (userDomain === "intec") {
  //     showSurvey(APP_PREFERENCES.studentUrl);
  //   } else {
  //     showSurvey(APP_PREFERENCES.teacherUrl);
  //   }
  // }

  // Execute this code to Close any browser. So user first completes this process and then,
  //  can use the computer.
  // jobs = setInterval(() => {
  //   executeJobs();
  // }, 5000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (window === null) {
    createWindow(settings.PAGES.startPage, true);
  }
});
