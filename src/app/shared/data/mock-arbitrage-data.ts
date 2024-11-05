import { ArbitrageGraphData, ArbitrageGraphLocation, ArbitrageGraphLocationType } from "../components/arbitrage-graph/arbitrage-graph.model";


export function generateRandomArbitrage(): ArbitrageGraphData {
  const exchanges = ['Binance', 'Kraken', 'Coinbase', 'Bitfinex', 'Huobi'];
  const chains = ['Ethereum', 'BSC', 'Polygon', 'Solana', 'Avalanche'];
  const symbols = ['BTC', 'USDT', 'ETH', 'DOGE', 'CRV', 'TRX', 'PENDLE', 'LTC', 'ETC', 'BCH', 'XRP', 'TON', 'ADA', 'AVAX', 'SHIB', 'LINK', 'DOT'];
  const randomElementFromArrayFn = (array) => array[Math.floor(Math.random() * array.length)];

  const getRandomArbitrageLocation = (): ArbitrageGraphLocation => {
    const isChain = Math.random() > 0.5;

    return {
      name: isChain ? randomElementFromArrayFn(chains) : randomElementFromArrayFn(exchanges),
      type: isChain ? ArbitrageGraphLocationType.CHAIN : ArbitrageGraphLocationType.EXCHANGE,
    }
  }

  return {
    direction: `${randomElementFromArrayFn(exchanges)} -> ${randomElementFromArrayFn(exchanges)}`,
    from: getRandomArbitrageLocation(),
    to: getRandomArbitrageLocation(),
    symbol: randomElementFromArrayFn(symbols),
    amountIn: Math.floor(Math.random() * 100) + 5,
    profit: parseFloat(((Math.random() * (10000)) + -5000).toFixed(2)),
  }
}

export function generateMultipleArbitrage(): ArbitrageGraphData[] {
  return [
    {
      direction: `loh 1`,
      from: {
        name: 'Coinbase',
        type: ArbitrageGraphLocationType.EXCHANGE,
      },
      to: {
        name: 'Coinbase',
        type: ArbitrageGraphLocationType.EXCHANGE,
      },
      symbol: 'USDT',
      amountIn: 10,
      profit: 2000,
    },
    {
      direction: `loh 2`,
      from: {
        name: 'Coinbase',
        type: ArbitrageGraphLocationType.EXCHANGE,
      },
      to: {
        name: 'Kraken',
        type: ArbitrageGraphLocationType.EXCHANGE,
      },
      symbol: 'TRX',
      amountIn: 10,
      profit: 1000,
    },
    {
      direction: `loh 3`,
      from: {
        name: 'Coinbase',
        type: ArbitrageGraphLocationType.EXCHANGE,
      },
      to: {
        name: 'Ethereum',
        type: ArbitrageGraphLocationType.CHAIN,
      },
      symbol: 'TRX',
      amountIn: 10,
      profit: 1300,
    },
    {
      direction: `loh 4`,
      from: {
        name: 'Solana',
        type: ArbitrageGraphLocationType.CHAIN,
      },
      to: {
        name: 'Kraken',
        type: ArbitrageGraphLocationType.EXCHANGE,
      },
      symbol: 'TRX',
      amountIn: 10,
      profit: -1000,
    },
    {
      direction: `loh 5`,
      from: {
        name: 'Huobi',
        type: ArbitrageGraphLocationType.EXCHANGE,
      },
      to: {
        name: 'Kraken',
        type: ArbitrageGraphLocationType.EXCHANGE,
      },
      symbol: 'ETH',
      amountIn: 10,
      profit: 4000,
    },
    {
      direction: `loh 6`,
      from: {
        name: 'Solana',
        type: ArbitrageGraphLocationType.CHAIN,
      },
      to: {
        name: 'Binance',
        type: ArbitrageGraphLocationType.EXCHANGE,
      },
      symbol: 'DOGE',
      amountIn: 35,
      profit: 2000,
    }
  ]
}
