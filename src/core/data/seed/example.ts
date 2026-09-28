import { ASSET_CLASS_COLORS, buildPortfolio } from './build'

// Fictional sample portfolio, used when no private seed (my-portfolio.ts) exists.
export default buildPortfolio({
  snapshotDates: ['2026-08-31T20:00:00+07:00', '2026-09-15T20:00:00+07:00', '2026-09-28T20:00:00+07:00'],
  assetClassColors: ASSET_CLASS_COLORS,
  rows: [
    { name: 'Savings (Bank A)', product: 'cash', assetClass: 'Cash', invested: 150000, values: [150000, 150000, 152000] },
    { name: 'S&P 500 fund', product: 'SP500', assetClass: 'Stocks', invested: 300000, values: [310000, 318000, 325000] },
    { name: 'Global bond fund', product: 'Bonds', assetClass: 'Bond', invested: 120000, values: [121000, 121500, 120800] },
    { name: 'Gold bar', product: 'gold', assetClass: 'Gold', invested: 60000, values: [64000, 66000, 65000] },
    { name: 'BTC', product: 'BTC', assetClass: 'Crypto', invested: 30000, values: [28000, 33000, 31000] },
  ],
})
