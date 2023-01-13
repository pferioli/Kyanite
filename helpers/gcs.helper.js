const { format } = require('util');
const Multer = require('multer');

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const { Storage } = require('@google-cloud/storage');
const { fstat } = require('fs');

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

async function listBuckets() {
    // Lists all buckets in the current project

    const [buckets] = await storage.getBuckets();
    console.log('Buckets:');
    buckets.forEach(bucket => {
        console.log(bucket.name);
    });
};

async function writeFileToGCS(req, gcsFileName, gcsBucketName) {

    const GCLOUD_STORAGE_BUCKET = gcsBucketName; //process.env.GOOGLE_CLOUD_PROJECT + '_bucket';

    // A bucket is a container for objects (files).
    const bucket = storage.bucket(GCLOUD_STORAGE_BUCKET);

    // Create a new blob in the bucket and upload the file data.
    const file = bucket.file(gcsFileName);

    const stream = file.createWriteStream({
        contentType: req.file.mimetype
    });

    stream.end(req.file.buffer);

    return finish = new Promise(function (resolve, reject) {

        stream.on('finish', () => {

            req.file.cloudStorageObject = gcsFileName; req.file.gcsUrl = format(`https://storage.googleapis.com/${bucket.name}/${file.name}`);

            resolve(req.file.gcsUrl);
        });

        stream.on('error', (err) => {
            req.file.cloudStorageError = err;
            reject(err);
        });
    });
};

async function readExcelFileFromGCS(gcsFileName, gcsBucketName) {

    const GCLOUD_STORAGE_BUCKET = gcsBucketName;

    const bucket = storage.bucket(GCLOUD_STORAGE_BUCKET);

    const file = bucket.file(gcsFileName);

    // const downloadFile = await file.download();

    const blobStream = await file.createReadStream() //stream is created

    const Excel = require('exceljs');

    const workbook = new Excel.Workbook();

    await workbook.xlsx.read(blobStream);

    return workbook;
}

async function readCollectionsFileFromGCS(gcsFileName, gcsBucketName) {

    let results = []; const csv = require('csv-parser')

    const GCLOUD_STORAGE_BUCKET = gcsBucketName;

    const bucket = storage.bucket(GCLOUD_STORAGE_BUCKET);

    const file = bucket.file(gcsFileName);

    return finish = new Promise(function (resolve, reject) {

        const stripBom = require('strip-bom-stream');

        const stream = file.createReadStream()
            .pipe(stripBom())
            .pipe(csv(
                {
                    separator: ";",
                    mapHeaders: ({ header, index }) => {

                        switch (header.toLowerCase()) {
                            case 'fecha': { return "date" };
                            case 'codigo': { return "clientCode" };
                            case 'tipo': { return "propertyType" };
                            case 'propiedad': { return "property" };
                            case 'cuenta': { return "accountId" };
                            case 'concepto': { return "concept" };
                            case 'valores': { return "value" };
                            case 'importe': { return "amount" };
                        }
                    }
                }));

        stream.on('data', (data) => {
            results.push(data)
        })
        stream.on('end', () => {
            resolve(results)
        });
        stream.on('error', (err) => {
            reject(err);
        })

        setTimeout(() => {
            stream.emit('end');
        }, 30 * 1000);
    });
}

async function readPropertyFileFromGCS(gcsFileName, gcsBucketName) {

    let results = []; const csv = require('csv-parser')

    const GCLOUD_STORAGE_BUCKET = gcsBucketName;

    const bucket = storage.bucket(GCLOUD_STORAGE_BUCKET);

    const file = bucket.file(gcsFileName);

    return finish = new Promise(function (resolve, reject) {

        const stripBom = require('strip-bom-stream');

        const stream = file.createReadStream()
            .pipe(stripBom())
            .pipe(csv(
                {
                    separator: ";",
                    mapHeaders: ({ header, index }) => {

                        switch (header.toLowerCase()) {
                            case 'propiedad': { return "property" };
                            case 'propietario': { return "name" };
                            case 'coeficiente': { return "coefficient" };
                            case 'telefono': { return "phone" };
                            case 'correo': { return "email" };
                            case 'cuil': { return "cuil" };
                            case 'comentarios': { return "comments" };
                        }
                    }
                }));

        stream.on('data', (data) => {
            results.push(data)
        })
        stream.on('end', () => {
            resolve(results)
        });
        stream.on('error', (err) => {
            reject(err);
        })

        setTimeout(() => {
            stream.emit('end');
        }, 30 * 1000);
    });
}
module.exports = {
    multer,
    sendUploadToGCS: writeFileToGCS,
    readCollectionsFileFromGCS: readCollectionsFileFromGCS,
    readPropertyFileFromGCS: readPropertyFileFromGCS,
    readExcelFileFromGCS: readExcelFileFromGCS
};