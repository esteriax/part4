const app = require('./app') // varsinainen Express-sovellus
const config = require('./utils/config')
const { info, error } = require('./utils/logger')

info('message')
error('error message')

app.listen(config.PORT, () => {
  info(`Server running on port ${config.PORT}`)
})