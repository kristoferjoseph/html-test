let parallel = require('run-parallel')

/**
 *
 */
module.exports = {
  getDeployBucket: function getDeployBucket (aws, appname, callback) {
    aws.ssm.GetParameter({
      Name: `/${appname}/deploy/bucket`,
      WithDecryption: true,
    })
      .then(data => {
        let value = data?.Parameter?.Value ? data.Parameter.Value : null
        callback(null, value)
      })
      .catch(err => {
        if (err && err.code !== 'ParameterNotFound') callback(err)
        else callback()
      })
  },
  deleteAll: function deleteAll (aws, appname, env, callback) {
    let Names = []
    function collectByPath (rootPath, cb) {
      aws.ssm.GetParametersByPath({
        Path: rootPath,
        Recursive: true,
        paginate: true,
      })
        .then(data => {
          if (data?.Parameters?.length) {
            Names.push(...data.Parameters.map(({ Name }) => Name))
          }
          cb()
        })
        .catch(err => {
          if (err && err.code !== 'ParameterNotFound') cb(err)
          else cb()
        })
    }

    // destroy all SSM Parameters associated to app; a few formats:
    // /<app-name>/deploy/bucket - deployment bucket
    // /<app-name>/<env>/* - environment variables via `arc env`
    let ops = [ `/${appname}/${env}`, `/${appname}/deploy` ]
      .map(path => collectByPath.bind(null, path))

    parallel(ops, (err) => {
      if (err) callback(err)
      else {
        function deleteThings () {
          if (Names.length) {
            // >10 SSM params in a call will fail
            let chunk = Names.splice(0, 10)
            aws.ssm.DeleteParameters({ Names: chunk })
              .then(() => {
                if (!Names.length) callback()
                else deleteThings()
              })
              .catch(err => callback(err))
          }
          else callback()
        }
        deleteThings()
      }
    })
  },
}
