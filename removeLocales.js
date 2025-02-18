// removeLocales.js
const fs = require('fs')
const path = require('path')

module.exports = async function (context) {
  const localeDir = path.join(context.appOutDir, 'locales')
  fs.readdir(localeDir, (err, files) => {
    if (err) throw err
    files.forEach((file) => {
      if (!file.startsWith('en') && !file.startsWith('zh')) {
        fs.unlinkSync(path.join(localeDir, file))
      }
    })
  })
}
