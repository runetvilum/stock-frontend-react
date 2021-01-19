const https = require('https');
export default function handler(req, res) {
  let url = `https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?ticker=${req.query.ticker}&api_key=VSAemYjRCH6kkDJN8Gu5`;
  delete req.query.ticker
  Object.keys(req.query).forEach((key) => {
    url = `${url}&${key}=${req.query[key]}`;
  });
  https.get(url, (response) => {
    response.pipe(res);
  });
}