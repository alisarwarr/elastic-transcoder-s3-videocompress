const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const app = express();


//configure AWS SDK
AWS.config.update({
    accessKeyId: "AKIA5EE6YJQE63LM3CPY",
    secretAccessKey: "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",
    region: "us-east-1"
});


//create S3 and Elastic Transcoder instances
const s3 = new AWS.S3();
const transcoder = new AWS.ElasticTranscoder();


//configure Multer middleware for handling file uploads
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "my-bucket-9211",
        acl: "public-read",
        key: function (req, file, cb) {
            cb(null, file.originalname);
        }
    })
});


//define API route for uploading videos
app.post("/upload", upload.single("video"), async (req, res) => {
    try {
        const videoKey = req.file.key;
        //transcode newly uploaded video
        await transcodeVideo(videoKey);
        //send success response
        res.status(200).json({ message: "SUCCESSFUL" });
    }
    catch (err) {
        //handle errors
        res.status(500).json({ message: `ERROR ${err}` });
    }
});


//define function for transcoding a video using Elastic Transcoder
const transcodeVideo = async (videoKey) => {
    try {
        //transcode video
        await transcoder.createJob({
            PipelineId: "1679788106134-3vgqxa",
            Input: {
                Key: videoKey,
                Container: "mp4"
            },
            Output: {
                Key: `${videoKey}-transcoded.mp4`,
                PresetId: "1351620000000-000050"
            }
        }).promise();
    }
    catch (err) {
        console.log("ERROR" + err);
    }
};


//define API route for fetching videos
app.post("/fetch", async () => {
    try {
        //get list of already transcoded videos from S3
        const transcodedVideos = await getTranscodedVideos();
        //send success response
        res.status(200).json({ transcodedVideos });
    }
    catch (err) {
        //handle errors
        res.status(500).json({ message: `ERROR ${err}` });
    }
});


//define function for getting list of already transcoded videos from S3
const getTranscodedVideos = async () => {
    const items = await s3.listObjectsV2({
        Bucket: "my-bucket-9211",
        Prefix: ""
    }).promise();

    if (items.Contents) {
        const keys = items.Contents.map((content) => content.Key);
        return keys.filter(key => key.includes("-transcoded.mp4"));
    }

    return [];
};


//start the server
app.listen(3000, () => {
    console.log("Server listening on port 3000");
});