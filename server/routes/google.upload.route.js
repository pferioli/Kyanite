const express = require("express");
const router = express.Router();

const { format } = require('util');
const Multer = require('multer');

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const { Storage } = require('@google-cloud/storage');

const storageoptions = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
};

const storage = new Storage(storageoptions);    // Instantiate a storage client

// Multer is required to process file uploads and make them available via
// req.files.
const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
    },
});

const GCLOUD_STORAGE_BUCKET = process.env.GOOGLE_CLOUD_PROJECT + '_bucket';

// A bucket is a container for objects (files).
const bucket = storage.bucket(GCLOUD_STORAGE_BUCKET);

async function listBuckets() {
    // Lists all buckets in the current project

    const [buckets] = await storage.getBuckets();
    console.log('Buckets:');
    buckets.forEach(bucket => {
        console.log(bucket.name);
    });
};

//listBuckets().catch(console.error);



// Process the file upload and upload to Google Cloud Storage.
router.post('/', [multer.single('attachment')], (req, res, next) => {
    if (!req.file) {
        res.status(400).send('No file uploaded.');
        return;
    }

    // Create a new blob in the bucket and upload the file data.
    const file = bucket.file(req.file.originalname);

    const stream = file.createWriteStream({
        contentType: req.file.mimetype
    });

    stream.on('error', (err) => {
        req.file.cloudStorageError = err;
        next(err);
    });

    stream.on('finish', () => {
        // The public URL can be used to directly access the file via HTTP.
        const publicUrl = format(
            `https://storage.googleapis.com/${bucket.name}/${file.name}`
        );
        res.status(200).send(publicUrl);
    });

    stream.end(req.file.buffer);
});

router.get('/', function (req, res, next) {
    res.render('uploads/uploadForm.ejs')
})

module.exports = router
