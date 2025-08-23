let waterfall = require('run-waterfall')

module.exports = function deleteBucketContents ({ aws, bucket: Bucket }, callback) {
  let bucketExists = false

  function collectObjects (callback) {
    aws.s3.ListObjectsV2({ Bucket, paginate: true })
      .then(result => {
        let { Contents } = result
        let objectsToDelete = Contents.map(({ Key }) => ({ Key })).filter(Boolean)
        callback(null, objectsToDelete)
      })
      .catch(err => callback(err))
  }

  function deleteObjects (objectsToDelete, callback) {
    let Objects = objectsToDelete.splice(0, 1000) // S3.deleteObjects supports up to 1k keys
    aws.s3.DeleteObjects({
      Bucket,
      Delete: { Objects },
    })
      .then(() => {
        if (objectsToDelete.length) {
          deleteObjects(objectsToDelete, callback)
        }
        else callback()
      })
      .catch(err => callback(err))
  }

  waterfall([
    function checkBucketExists (callback) {
      aws.s3.HeadBucket({ Bucket })
        .then(() => {
          bucketExists = true
          callback()
        })
        .catch(() => callback())
    },

    function maybeCollectObjectsInBucket (callback) {
      if (bucketExists) {
        collectObjects(callback)
      }
      else callback(null, false)
    },

    function maybeDeleteBucketObjects (objectsToDelete, callback) {
      if (bucketExists && objectsToDelete.length) {
        deleteObjects(objectsToDelete, callback)
      }
      else callback()
    },

    function maybeDeleteBucket (callback) {
      if (bucketExists) {
        aws.s3.DeleteBucket({ Bucket })
          .then(() => callback())
          .catch(err => callback(err))
      }
      else callback()
    },
  ], callback)
}
