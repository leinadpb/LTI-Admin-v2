const mongoose = require('mongoose');
require('dotenv').config();

let envs = process.env;
try {
  envs = require('../../environments');
} catch (ex) {
  console.log('Please, create environments.js file (with all needed environments variables) in the root project before deploying to production: ', ex);
}
console.log(envs.CONNECTION_STRING);
const db = envs.CONNECTION_STRING;

mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch(err => {
    console.log(err);
    console.log('MongoDB Not Connected');
  });