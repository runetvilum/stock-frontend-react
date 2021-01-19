let companies = [];
const getData = async (url) => {
  const response = await fetch(url);
  const data = await response.text();
  return data.split('\n');
};
const init = async () => {
  const temp = await getData('https://s3.amazonaws.com/quandl-production-static/end_of_day_us_stocks/ticker_list.csv');
  const names = temp.map((item) => item.split(','));
  const tickers = await getData('https://s3.amazonaws.com/quandl-production-static/coverage/WIKI_PRICES.csv');
  companies = tickers.map((item) => {
    const company = names.find((row) => row[0] === item);
    return { ticker: item, name: company ? company[2] : '' };
  });
};
init();
export default function handler(req, res) {
    res.json(companies)
  }