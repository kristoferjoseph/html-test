#!/usr/bin/env node
let minimist = require('minimist')
let _inventory = require('@architect/inventory')
let { banner, updater } = require('@architect/utils')
let { version } = require('../package.json')

let destroy = require('./index.js')
let update = updater('Destroy')

async function main (opts = {}) {
  let { inventory } = opts
  let appname
  try {
    if (!inventory) inventory = await _inventory({})
    appname = inventory.inv.app

    let alias = {
      force:      [ 'f' ],
      production: [ 'p' ],
      debug:      [ 'd' ],
      verbose:    [ 'v' ],
    }
    let boolean = [ 'debug', 'force', 'now', 'no-timeout', 'production', 'static', 'verbose' ]
    let def = { now: false, timeout: true }
    let args = minimist(process.argv.slice(2), { alias, boolean, default: def })
    if (args._[0] === 'destroy') args._.splice(0, 1)

    if (!args.app || args.app !== appname) throw Error('no_app_name')

    let env = args.production ? 'production' : 'staging'
    let params = {
      appname:    args.app,
      env,
      force:      args.force,
      now:        args.now,
      retries:    args.timeout ? 15 : 999,
      stackname:  args.name,
      update,
    }

    update.status(`Destroying ${env} environment`)
    if (env === 'staging') {
      update.status(`Reminder: if you deployed to production, don't forget to run destroy again with: --production`)
    }
    await destroy(params)
  }
  catch (err) {
    let { message } = err
    let msg = 'To destroy this app (and any static assets and database tables that belong to it), run destroy with: --force'
    if (message === 'no_app_name') {
      update.warn(`If you're really sure you want to destroy this app, run destroy with: --app ${appname}`)
    }
    else if (message === 'bucket_exists') {
      update.warn(`Found static bucket!`)
      update.warn(msg)
    }
    else if (message === 'table_exists') {
      update.warn('Found DynamoDB table(s)!')
      update.warn(msg)
    }
    else {
      update.error(err)
    }
    process.exit(1)
  }
}

module.exports = main

if (require.main === module) {
  (async function () {
    try {
      let inventory = await _inventory({})
      banner({ inventory, version: `Destroy ${version}` })
      await main({ inventory })
    }
    catch (err) {
      console.log(err)
    }
  })()
}
