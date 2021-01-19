import React from 'react';
import { AppBar, Toolbar, Typography, Paper, FormControl, TextField, Divider, Button } from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';
import Autocomplete from '@material-ui/lab/Autocomplete';
import moment from 'moment'
import createTrend from 'trendline'
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';
import Chart from 'chart.js';

export async function getStaticProps() {
  const res = await fetch('http://localhost:3030/tickers')
  const json = await res.json()
  if (json.length > 0) {
    json.splice(0, 1)
  }
  return {
    props: {
      tickers: json,
    },
  }
}
class MyChart extends React.Component {
  constructor(props) {
    super(props);
    this.chartRef = React.createRef();
  }

  componentDidMount() {
    this.myChart = new Chart(this.chartRef.current, {
      type: 'line',
      data: {
        datasets: [{
          data: [],
          pointRadius: 0,
          fill: false,
          lineTension: 0,
          borderColor: '#18FFFF'
        }]
      },
      options: {
        legend: {
          display: false
        },
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          xAxes: [{
            ticks: {
              fontColor: '#fff',
              beginAtZero: true
            },
            gridLines: {
              color: 'rgba(255,255,255,0.3)',
              zeroLineColor: 'rgba(255,255,255,0.3)'
            },

            type: 'time',
            time: {
              unit: 'month'
            }
          }],
          yAxes: [
            {
              position: 'right',
              ticks: {
                fontColor: '#fff',
              },
              gridLines: {
                color: 'rgba(255,255,255,0.3)',
                zeroLineColor: 'rgba(255,255,255,0.3)'
              },
              scaleLabel: {
                display: true,
                labelString: 'Closing price ($)',
                fontSize: 18,
                fontColor: '#fff'
              }
            }
          ]
        }
      }
    });
  }
  async componentDidUpdate(prevProps) {
    if (
      prevProps.ticker !== this.props.ticker ||
      prevProps.startDate !== this.props.startDate ||
      prevProps.endDate !== this.props.endDate ||
      prevProps.showTrend !== this.props.showTrend
    ) {
      if (this.props.ticker) {
        try {
          let url = `http://localhost:3030/eod/${this.props.ticker.ticker}`
          if (this.props.startDate) {
            url = `${url}?date.gte=${this.props.startDate.toISOString().substr(0, 10)}`
            if (this.props.endDate) {
              url = `${url}&date.lte=${this.props.endDate.toISOString().substr(0, 10)}`
            }
          } else if (this.props.endDate) {
            url = `${url}?date.lte=${this.props.endDate.toISOString().substr(0, 10)}`
          }

          const res = await fetch(url)
          const data = await res.json()
          this.myChart.data.datasets[0].data = data.datatable.data.map(item => {
            return { x: new Date(item[1]), y: item[5] }
          })
          // data is sorted latest first
          // use last 10 days
          const duration = 10
          if (this.props.showTrend && this.myChart.data.datasets[0].data.length > duration - 1) {
            const dataSet = []

            const day1 = this.myChart.data.datasets[0].data[duration]
            const a = new moment(day1.x)
            for (let i = duration - 1; i >= 0; i--) {
              const day2 = this.myChart.data.datasets[0].data[i]
              const b = new moment(day2.x)
              const diff = b.diff(a, 'days')
              dataSet.push({ x: diff, y: day2.y })
            }
            const trend = createTrend(dataSet, 'x', 'y')
            this.myChart.data.datasets[0].data.splice(0, 0, { x: a.add(30, 'days').toDate(), y: trend.calcY(30) })
          }
          this.myChart.data.datasets[0].label = this.props.ticker.ticker
          this.myChart.update();
        } catch (err) {
          console.log(err)
        }
      }
    }
  }

  render() {
    return (
      <canvas ref={this.chartRef} style={{ position: 'absolute', top: '16px', bottom: 0, left: '16px', right: 0 }} />
    );
  }
}
export default function Index({ tickers }) {
  const [ticker, setTicker] = React.useState(null);
  const [startDate, setStartDate] = React.useState(null);
  const [endDate, setEndDate] = React.useState(null);
  const [trend, setTrend] = React.useState(false);
  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
      <div style={{ flex: '0 0 auto' }}>
        <AppBar position="relative" color="secondary">
          <Toolbar>
            <Typography variant="h6" color="inherit">
              End of day stock prices
            </Typography>
          </Toolbar>
        </AppBar>
        <Divider />
      </div>
      <div style={{ flex: '1 0 auto', display: 'flex', flexDirection: 'row' }}>
        <div style={{ flex: '0 0 auto', padding: '16px', margin: '16px 0 16px 16px', flexDirection: 'column', display: 'flex' }}>
          <FormControl>
            <Autocomplete
              options={tickers}
              getOptionLabel={(option) => `(${option.ticker}) ${option.name}`}
              style={{ width: 400 }}
              renderInput={(params) => <TextField {...params} label="Stock Ticker Symbol" />}
              value={ticker}
              onChange={(event, newValue) => setTicker(newValue)}
            />
          </FormControl>

          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <FormControl>
              <KeyboardDatePicker
                variant="inline"
                format="MM/dd/yyyy"
                margin="normal"
                autoOk
                label="Start date"
                value={startDate}
                onChange={(value) => setStartDate(value)}
                KeyboardButtonProps={{
                  'aria-label': 'change date',
                }}
              />
            </FormControl>
            <FormControl>
              <KeyboardDatePicker
                variant="inline"
                format="MM/dd/yyyy"
                margin="normal"
                autoOk
                label="End date"
                value={endDate}
                onChange={(value) => setEndDate(value)}
                KeyboardButtonProps={{
                  'aria-label': 'change date',
                }}
              />
            </FormControl>
          </MuiPickersUtilsProvider>
          <Button variant="contained" color="primary" style={{ marginTop: '32px' }} onClick={() => setTrend(!trend)}>
            {`${trend ? 'Hide' : 'Show'} 30 days trend`}
          </Button>
        </div>
        <div style={{ flex: '1 0 auto', padding: '16px', position: 'relative' }}>
          <MyChart ticker={ticker} startDate={startDate} endDate={endDate} showTrend={trend} />
        </div>
      </div>
    </div>
  );
}
