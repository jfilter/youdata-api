const express = require('express');
const csv = require('csvtojson');
const request = require('request-promise');
const compression = require('compression');
const cors = require('cors');
const apicache = require('apicache');

const baseUrl = 'https://rawgit.com/jfilter/youdata-data/master/';

const getData = async () => {
  const data = {};
  const indexEntries = await request(`${baseUrl}index.json`, { json: true });

  // forEach should be enough, but map for Promise.all
  await Promise.all(
    indexEntries.map(async x => {
      try {
        const csvUrl = `${baseUrl}data/${x}.csv`;
        const csvString = await request(csvUrl);
        const csvData = await csv({
          includeColumns: /(name|email|state)/,
        }).fromString(csvString);
        const filteredData = csvData
          .filter(
            row =>
              row.email !== '' &&
              (row.state == null || row.state === 'approved')
          )
          .map(row => ({ name: row.name, email: row.email }));
        data[x] = filteredData;
      } catch (error) {
        console.error(error);
      }
    })
  );
  return data;
};

const app = express();

const cache = apicache.middleware;

app.use(cache('60 minutes'));
app.use(compression());
app.use(cors());

app.get('/', (req, res) => {
  getData()
    .then(data => res.json(data))
    .catch(err => console.error(err));
});

app.listen(5000);
