const express = require('express');
const csv = require('csvtojson');
const request = require('request-promise');
const compression = require('compression');

const baseUrl = 'https://rawgit.com/jfilter/youdata-data/master/';

const data = {};

const getData = async () => {
  const indexEntries = await request(`${baseUrl}index.json`, { json: true });

  // forEach should be enough, but map for Promise.all
  await Promise.all(
    indexEntries.map(async x => {
      try {
        const csvUrl = `${baseUrl}data/${x}.csv`;
        const csvString = await request(csvUrl);
        const csvData = await csv().fromString(csvString);
        data[x] = csvData;
      } catch (error) {
        console.error(error);
      }
    })
  );
};

const app = express();

app.use(compression());

app.get('/', (req, res) => {
  res.json(data);
});

getData()
  .then(() => {
    console.log(Object.keys(data).length);
    app.listen(5000);
  })
  .catch(err => console.error(err));
