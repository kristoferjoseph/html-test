module.exports = function deleteLogs ({ aws, StackName, update }, callback) {
  aws.cloudwatchlogs.DescribeLogGroups({
    logGroupNamePrefix: `/aws/lambda/${StackName}-`,
    paginate: true,
  })
    .then(data => {
      if (data?.logGroups?.length) {
        let logGroups = data.logGroups.map(({ logGroupName }) => logGroupName)
        deleter(aws, logGroups, update, callback)
      }
      else callback()
    })
    .catch(err => callback(err))
}

function deleter (aws, logGroups, update, callback) {
  let timer = 0
  let numComplete = 0
  logGroups.forEach(log => {
    timer += 400 // max of about 2-3 transactions per second :/
    setTimeout(function delayedDelete () {
      aws.cloudwatchlogs.DeleteLogGroup({ logGroupName: log })
        .then(() => {
          numComplete++
          if (logGroups.length === numComplete) callback()
        })
        .catch(err => {
          numComplete++
          update.warn(err)
        })
    }, timer)
  })
}
