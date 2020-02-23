// import historyProvider from './historyProvider'
// import realtimeProvider from './realtimeProvider'
const rp = require('request-promise').defaults({json: true})

// Setup config
const api_key = 'bp60vd7rh5rcobn2deeg'
const supportedResolutions = ["1", "5", "15", "30", "60", "D", "W", "M"]
const config = {
    supported_resolutions: supportedResolutions
}; 


// history data
const api_root = 'https://finnhub.io/api/v1/crypto/candle'
const history = {}


// realtime data
const socket_url = 'wss://ws.finnhub.io?token=bp60vd7rh5rcobn2deeg'
const socket = new WebSocket(socket_url)
var sub;


// Trading View JS Datafeed
export default {
	onReady: cb => {
		console.log('onReady running')	
		setTimeout(() => cb(config), 0)
	},

	searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
		console.log('searchSymbols running', userInput, exchange, symbolType)
	},

	resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
		// expects a symbolInfo object in response
		console.log('resolveSymbol running', symbolName)
		var split_data = symbolName.split(/[:/]/)

		var symbol_stub = {
			name: symbolName,
			description: '',
			type: 'crypto',
			session: '24x7',
			timezone: 'Etc/UTC',
			ticker: symbolName,
			exchange: split_data[0],
			minmov: 1,
			pricescale: 100000000,
			has_intraday: true,
			intraday_multipliers: ['1', '60'],
			supported_resolution:  supportedResolutions,
			volume_precision: 8,
			data_status: 'streaming',
		}

		if (split_data[2].match(/USD|EUR|JPY|AUD|GBP|KRW|CNY/)) {
			symbol_stub.pricescale = 100
		}
		setTimeout(function() {
			onSymbolResolvedCallback(symbol_stub)
			console.log('Resolving that symbol....', symbol_stub)
		}, 0)
	},

	getBars: function(symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) {
		console.log('getBars running')
		// console.log('function args',arguments)
		// console.log(`Requesting bars between ${new Date(from * 1000).toISOString()} and ${new Date(to * 1000).toISOString()}`)
		
		const qs = {
			// symbol: symbolInfo.name,
			symbol: "BINANCE:BTCUSDT",
			resolution: resolution,
			from: from,
			to: to,
			token: api_key,
		}

		rp({
			uri: api_root,
			qs: qs,
		}).then(data => {
			if (data['s'] === 'ok') {
				console.log('OK')
				var bars = data['t'].map(function(t, i) {
					return {
						time: t*1000, // trading view need time in milisecond
						low: data['l'][i],
						high: data['h'][i],
						open: data['o'][i],
						close: data['c'][i]
					}
				})

				if (firstDataRequest) {
					var lastBar = bars[bars.length - 1]
					history[symbolInfo.name] = {lastBar: lastBar}
				}
				console.log(bars)
				return bars

			} else{
				console.log('Finnhub  API error:',data.Message)
				return []

			}
		})
		// historyProvider.getBars(symbolInfo, resolution, from, to, firstDataRequest)
		.then(bars => {
			if (bars.length) {
				onHistoryCallback(bars, {noData: false})
			} else {
				onHistoryCallback(bars, {noData: true})
			}
		}).catch(err => {
			console.log({err})
			onErrorCallback(err)
		})

	},

	subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
		console.log('=====subscribeBars runnning')
		const symbol = 'BINANCE:BTCUSDT'
		socket.send(JSON.stringify({'type':'subscribe', 'symbol': symbol, resolution: 'D'}))

		const newSub = {
            symbol,
            subscribeUID,
            resolution,
            symbolInfo,
            lastBar: history[symbolInfo.name].lastBar,
            listener: onRealtimeCallback,
		}
		sub = newSub
		// realtimeProvider.subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback)
	},

	unsubscribeBars: subscriberUID => {
		console.log('=====unsubscribeBars running')
		const symbol = sub.symbol
        socket.send(JSON.stringify({'type':'unsubscribe','symbol': symbol}))
		socket.emit('SubRemove', {subs: [sub.channelString]})
		
		// realtimeProvider.unsubscribeBars(subscriberUID)
	},

	// calculateHistoryDepth: (resolution, resolutionBack, intervalBack) => {
	// 	//optional
	// 	console.log('=====calculateHistoryDepth running')
	// 	// while optional, this makes sure we request 24 hours of minute data at a time
	// 	// CryptoCompare's minute data endpoint will throw an error if we request data beyond 7 days in the past, and return no data
	// 	return resolution < 60 ? {resolutionBack: 'D', intervalBack: '1'} : undefined
	// },

	// getMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
	// 	//optional
	// 	console.log('=====getMarks running')
	// },

	// getTimeScaleMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
	// 	//optional
	// 	console.log('=====getTimeScaleMarks running')
	// },
	
	// getServerTime: cb => {
	// 	console.log('=====getServerTime running')
	// }
}


// handle socket event
socket.onopen = function(event) {
    console.log('socket open successfully')
}


socket.addEventListener('message', function (event) {
    //  const _data= e.split('~')
    const data = JSON.parse(event.data)

    if (data['type'] !== "trade") {
      return
    }

    console.log('Message', sub)

    data['data'].forEach(element => {
        var ticker = {
            symbol: element['s'],
            price: element['p'],
            volume: element['v']
        }

        if (ticker.time < sub.lastBar.time / 1000) {
            // disregard the initial catchup snapshot of trades for already closed candles
            return
        }

        var _lastBar = updateBar(ticker, sub)
        // send the most recent bar back to TV's realtimeUpdate callback
        sub.listener(_lastBar)
        // update our own record of lastBar
        sub.lastBar = _lastBar
    });
    
})

// Take a single trade, and subscription record, return updated bar
function updateBar(data, sub) {
    var lastBar = sub.lastBar
    let resolution = sub.resolution
    if (resolution.includes('D')) {
        // 1 day in minutes === 1440
        resolution = 1440
    } else if (resolution.includes('W')) {
        // 1 week in minutes === 10080
        resolution = 10080
    }

    var coeff = resolution * 60
    // console.log({coeff})
    var rounded = Math.floor(data.ts / coeff) * coeff
    var lastBarSec = lastBar.time / 1000
    var _lastBar
    
    if (rounded > lastBarSec) {
        // create a new candle, use last close as open **PERSONAL CHOICE**
        _lastBar = {
            time: rounded * 1000,
            open: lastBar.close,
            high: lastBar.close,
            low: lastBar.close,
            close: data.price,
            volume: data.volume
        }
        
    } else {
        // update lastBar candle!
        if (data.price < lastBar.low) {
            lastBar.low = data.price
        } else if (data.price > lastBar.high) {
            lastBar.high = data.price
        }
        
        lastBar.volume += data.volume
        lastBar.close = data.price
        _lastBar = lastBar
    }
    return _lastBar
}


