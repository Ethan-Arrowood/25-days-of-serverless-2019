const config = {
  endpoint: process.env.COSMOS_DB_ENDPOINT,
  key: process.env.COSMOS_DB_KEY,
  database: { id: '25DaysOfServerless' },
  container: { id: 'PotluckContainer' }
}

export default config