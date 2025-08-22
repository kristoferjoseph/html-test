let _inventory = require('@architect/inventory')
let awsLite = require('@aws-lite/client')
let waterfall = require('run-waterfall')
let deleteBucket = require('./_delete-bucket')
let ssm = require('./_ssm')
let deleteLogs = require('./_delete-logs')
let { updater, toLogicalID  } = require('@architect/utils')

function stackNotFound (StackName, err) {
  if (err && err.code == 'ValidationError' &&
      err.message.includes(`Stack with id ${StackName} does not exist`)) {
    return true
  }
  return false
}

/**
 * @param {object} params - named parameters
 * @param {string} params.appname - name of arc app
 * @param {string} params.env - name of environment/stage to delete
 * @param {string} [params.stackname] - name of stack
 * @param {boolean} [params.force] - deletes app with impunity, regardless of tables or buckets
 */
module.exports = function destroy (params, callback) {
  let { appname, env, force = false, inventory, now, retries, stackname, update } = params
  if (!update) update = updater('Destroy')

  // always validate input
  if (!env) {
    throw ReferenceError('Missing params.env')
  }
  if (!appname) {
    throw ReferenceError('Missing params.appname')
  }

  // StackName → AWS, stackname → user-specified suffix (via --name param)
  let StackName = toLogicalID(`${appname}-${env}`)
  if (stackname) {
    StackName += toLogicalID(stackname)
  }

  let promise
  if (!callback) {
    promise = new Promise(function ugh (res, rej) {
      callback = function errback (err, result) {
        if (err) rej(err)
        else res(result)
      }
    })
  }

  let aws, stack

  waterfall([
    // Warning
    function (callback) {
      if (now) {
        update.status(`Destroying ${StackName} immediately, hope you know what you're doing!`)
        callback()
      }
      else {
        update.status(`Destroying ${StackName} in 5 seconds...`)
        setTimeout(() => {
          callback()
        }, 5000)
      }
    },

    // Set up inventory to get region
    function (callback) {
      if (!inventory) {
        _inventory({}, (err, result) => {
          if (err) callback(err)
          else {
            inventory = result
            callback()
          }
        })
      }
      else callback()
    },

    // Instantiate client
    function (callback) {
      awsLite({
        profile: inventory.inv.aws.profile,
        region: inventory.inv.aws.region,
        plugins: [
          import('@aws-lite/cloudformation'),
          import('@aws-lite/cloudwatch-logs'),
          import('@aws-lite/s3'),
          import('@aws-lite/ssm'),
        ],
      })
        .then(_aws => {
          aws = _aws
          callback()
        })
        .catch(err => callback(err))
    },

    // check for the stack
    function (callback) {
      update.status(`Destroying ${StackName}`)
      aws.CloudFormation.DescribeStacks({ StackName })
        .then(data => {
          stack = data.Stacks[0]
          callback()
        })
        .catch(err => {
          if (stackNotFound(StackName, err)) {
            callback()
          }
          else callback(err)
        })
    },

    // check for dynamodb tables and if force flag not provided, error out
    function (callback) {
      if (stack) {
        aws.CloudFormation.DescribeStackResources({ StackName })
          .then(data => {
            let type = t => t.ResourceType
            let table = i => i === 'AWS::DynamoDB::Table'
            let hasTables = data.StackResources.map(type).some(table)
            if (hasTables && !force) callback(Error('table_exists'))
            else callback()
          })
          .catch(err => callback(err))
      }
      else callback()
    },

    // check if static bucket exists in stack
    function (callback) {
      if (stack) {
        let bucket = o => o.OutputKey === 'BucketURL'
        let hasBucket = stack.Outputs?.find(bucket)
        callback(null, hasBucket)
      }
      else callback(null, false)
    },

    // delete static assets
    function (bucketExists, callback) {
      if (bucketExists && force) {
        let bucket = bucketExists.OutputValue.replace('http://', '').replace('https://', '').split('.')[0]
        update.status('Deleting static S3 bucket...')
        deleteBucket({ aws, bucket }, callback)
      }
      else if (bucketExists && !force) {
        // throw a big error here
        callback(Error('bucket_exists'))
      }
      else {
        callback()
      }
    },

    // look up the deployment bucket name from SSM and delete that
    function (callback) {
      update.status('Retrieving deployment bucket...')
      ssm.getDeployBucket(aws, appname, callback)
    },

    // wipe the deployment bucket and delete it
    function (deploymentBucket, callback) {
      if (deploymentBucket) {
        update.status('Deleting deployment S3 bucket...')
        deleteBucket({ aws, bucket: deploymentBucket }, callback)
      }
      else callback()
    },

    // destroy all SSM Parameters associated to app
    function (callback) {
      if (stackname) {
        update.status('Named environment found, skipping SSM parameter deletion')
        callback()
      }
      else {
        update.status('Deleting SSM parameters...')
        ssm.deleteAll(aws, appname, env, callback)
      }
    },

    // destroy all cloudwatch log groups
    function (callback) {
      update.status('Deleting CloudWatch log groups...')
      deleteLogs({ aws, StackName, update }, callback)
    },

    // finally, destroy the cloudformation stack
    function (callback) {
      if (stack) {
        update.start(`Destroying CloudFormation Stack ${StackName}...`)
        aws.cloudformation.DeleteStack({ StackName })
          .then(() => callback(null, true))
          .catch(err => callback(err))
      }
      else callback(null, false)
    },

    // poll for destroy progress in case we are in the process of destroying a stack
    function (destroyInProgress, callback) {
      if (!destroyInProgress) return callback()
      let tries = 1
      let max = retries // typical values are 15 or 999; see cli.js
      function check () {
        aws.cloudformation.DescribeStacks({ StackName })
          .then(result => {
            if (result.Stacks) {
              let stack = result.Stacks.find(s => s.StackName === StackName)
              if (stack && stack.StackStatus === 'DELETE_FAILED') {
                return callback(Error(`CloudFormation Stack "${StackName}" destroy failed: ${stack.StackStatusReason}`))
              }
            }
            setTimeout(function delay () {
              if (tries === max) {
                callback(Error(`CloudFormation Stack destroy still ongoing; aborting as we hit max number of retries (${max})`))
              }
              else {
                tries += 1
                check()
              }
            }, 10000)
          })
          .catch(err => {
            if (stackNotFound(StackName, err)) {
              update.done(`Successfully destroyed ${StackName}`)
              callback()
            }
            else callback(err)
          })
      }
      check()
    },

  ], callback)

  // only happens if there is no callback
  return promise
}
