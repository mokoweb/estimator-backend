const bodyParser = require('body-parser');
const express = require('express');
const xml = require('xml');
const chalk = require('chalk');
const fs = require('fs');
const estimator = require('./src/estimator');

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});
let start;
app.use(bodyParser.json());

app.use((req, res, next) => {
  start = process.hrtime();
  next();
});

const getDurationInMilliseconds = (starttime) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(starttime);

  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

app.get('/api/v1/on-covid-19/logs', (req, res, next) => {
  fs.readFile('./src/jsonFiles/log.txt', (err, buf) => {
    res.status(201).json({
      message: 'convid estimation succesful!',
      data: buf.toString()
    });
  });
  next();
});

app.post('/api/v1/on-covid-19/xml', (req, res, next) => {
  const response = estimator.covid19ImpactEstimator(req.body);
  res.set('Content-Type', 'application/xml');
  res.send(xml(response));
  next();
});

app.post('/api/v1/on-covid-19/', (req, res, next) => {
  const data = estimator.covid19ImpactEstimator(req.body);
  res.status(201).json({
    message: 'convid estimation succesful!',
    data
  });
  next();
});

const logger = (logString) => {
  fs.appendFile('./src/jsonFiles/log.txt', logString, (err) => {
    if (err) throw err;
    console.log('Saved!', logString);
  });
};

app.use((req, res, next) => {
  const method = chalk.magenta(req.method);
  const route = chalk.blue(req.url);
  res.on('finish', function () {
    const durationInMilliseconds = getDurationInMilliseconds(start);
    const code = chalk.yellow(this.statusCode);
    const logString = `${method}\t\t${route}\t\t${code}\t\t${durationInMilliseconds} ms\n`.toString();
    logger(logString);
  });
  next();
});

module.exports = app;
