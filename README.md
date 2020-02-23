# TradingView Charting Library and React Integration Example (JavaScript)

## How to start

1. Install dependencies `npm install`.
1. Copy `charting_library` folder from https://github.com/tradingview/charting_library/ to `/public` and to `/src` folders. The earliest supported version of the Charting Library is 1.12. If you get 404 then you need to [request an access to this repository](https://www.tradingview.com/HTML5-stock-forex-bitcoin-charting-library/).
1. Copy `datafeeds` folder from https://github.com/tradingview/charting_library/ to `/public`.
1. add /* eslint-disable */ to src/charting_library/charting_library.min.js
https://github.com/tradingview/charting-library-examples/issues/60
1. Run `npm start`. It will build the project and open a default browser with the Charting Library.

## What is Charting Library

Charting Library is a standalone solution for displaying charts. This free, downloadable library is hosted on your servers and is connected to your data feed to be used in your website or app. [Learn more and download](https://www.tradingview.com/HTML5-stock-forex-bitcoin-charting-library/).

## What is React

React is a JavaScript library for building user interfaces. It is maintained by Facebook, Instagram and a community of individual developers and corporations.

## Deploy using google cloud

- By default, gcp App Engine will route the request to port 8080
```
$ cat .env
PORT=8080
```

```
# Create new google cloud project
gcloud projects create patternscanner --name="Pattern Scanner"

# Change to current project
gcloud app create --project=patternscanner

# Deploy
gcloud app deploy
```

## About This Project

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).
