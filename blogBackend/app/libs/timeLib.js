const moment = require('moment')
const timeZone = 'Asia/Calcutta'
let now = () => {
  return moment.utc().format()
}


module.exports = {
  now: now,
}