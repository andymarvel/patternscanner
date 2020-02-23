import * as React from 'react';
import './App.css';
import { TVChartContainer } from './components/TVChartContainer/index';

class App extends React.Component {
	render() {
		return (
			<div className={ 'App' }>
				<header className={ 'App-header' }>
					<h1 className={ 'App-title' }>
						Harmonic Pattern Scanner using Trading View and Finnhub API
					</h1>
				</header>
				<TVChartContainer />
			</div>
		);
	}
}

export default App;
