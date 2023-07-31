exports.handler = async (event) => {
  // receive http request event from API Gateway
  console.log("Received event: ", JSON.stringify(event, null, 2))

  // parse request body and get image url
  const body = JSON.parse(event.body)
  const imageUrl = body.output[0]
  const imageId = body.id
  const documentId = event.queryStringParameters.id

  // download image from url
  const axios = require("axios")
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  })

  // save image to S3
  const AWS = require("aws-sdk")
  const s3 = new AWS.S3()
  const params = {
    Bucket: "pet-images",
    Key: imageId,
    Body: response.data,
  }
  await s3.putObject(params).promise()

  // add document to Firebase
  const admin = require("firebase-admin")
  const adminConfig = require("./the-pet-gen-firebase-adminsdk-oth6e-86c1d9ab02.json")
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(adminConfig) })
  }
  const db = admin.firestore()
  const docRef = db.collection("images").doc(documentId)
  await docRef.set(
    {
      uri: `https://pet-images.s3.us-west-2.amazonaws.com/${imageId}`,
      status: "succeeded",
    },
    { merge: true }
  )
}
