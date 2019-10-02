const {
  Aborter,
  BlockBlobURL,
  ContainerURL,
  ServiceURL,
  SharedKeyCredential,
  StorageURL,
  uploadStreamToBlockBlob,
} = require('@azure/storage-blob');
const path = require('path');
const fs = require('fs-extra');
const {
  AZURE_STORAGE_ACCOUNT,
  AZURE_STORAGE_KEY,
  AZURE_UPLOAD_CONTAINER,
} = require('../constants');

const pdfOutputDir = path.join(__dirname, '..', 'output');
const pdfPath = id => path.join(pdfOutputDir, `${id}.pdf`);

async function uploadStream(containerURL, filePath, aborter) {
  const fp = path.resolve(filePath);

  const fileName = path.basename(fp).replace('.md', '-stream.md');
  const blockBlobURL = BlockBlobURL.fromContainerURL(containerURL, fileName);

  const stream = fs.createReadStream(fp);

  const uploadOptions = {
    bufferSize: 4000000,
    maxBuffers: 10,
  };

  return uploadStreamToBlockBlob(
    aborter,
    stream,
    blockBlobURL,
    uploadOptions.bufferSize,
    uploadOptions.maxBuffers,
  );
}

async function uploadPosterToCloud(filePath) {
  const account = AZURE_STORAGE_ACCOUNT;
  const accountKey = AZURE_STORAGE_KEY;
  const containerName = AZURE_UPLOAD_CONTAINER;

  if (!account || !accountKey) {
    console.log(
      'Azure credentials not set. Set the AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY env variables.',
    );
    return false;
  }

  const fileExists = await fs.pathExists(filePath);

  if (!fileExists) {
    console.log('No file to upload. Exiting.');
    return false;
  }

  console.log(`Uploading Pdf ${filePath} to Azure.`);

  const credentials = new SharedKeyCredential(account, accountKey);
  const pipeline = StorageURL.newPipeline(credentials);
  const serviceURL = new ServiceURL(`https://${account}.blob.core.windows.net`, pipeline);
  const aborter = Aborter.timeout(5 * 60000);

  const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);

  try {
    await uploadStream(containerURL, filePath, aborter);
  } catch (err) {
    console.log('Pdf upload unsuccessful.');
    console.error(err);
    return false;
  }
  console.log('Pdf upload successful.');

  try {
    await fs.remove(filePath);
  } catch (err) {
    console.log(`Pdf ${filePath} removal unsuccessful.`);
    console.error(err);
  }

  return true;
}

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    let data = '';
    readableStream.setEncoding('binary');
    readableStream.on('data', chunk => {
      data += chunk;
    });
    readableStream.on('end', () => {
      resolve(Buffer.from(data, 'binary'));
    });
    readableStream.on('error', reject);
  });
}

async function downloadPostersFromCloud(posterIds) {
  const account = AZURE_STORAGE_ACCOUNT;
  const accountKey = AZURE_STORAGE_KEY;
  const containerName = AZURE_UPLOAD_CONTAINER;

  const credentials = new SharedKeyCredential(account, accountKey);
  const pipeline = StorageURL.newPipeline(credentials);
  const serviceURL = new ServiceURL(`https://${account}.blob.core.windows.net`, pipeline);
  const aborter = Aborter.timeout(5 * 60000);

  const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);
  const posterPromises = [];
  const downloadedPosterIds = [];

  posterIds.forEach(id => {
    const createPromise = async () => {
      const pdfFilePath = pdfPath(id);

      if (await fs.pathExists(pdfFilePath)) {
        console.log(`Poster "${id}" already exists locally. Skipping download.`);
        downloadedPosterIds.push(id);
        return;
      }
      try {
        const blockBlobURL = BlockBlobURL.fromContainerURL(containerURL, `${id}.pdf`);
        const downloadResponse = await blockBlobURL.download(aborter, 0);
        const content = await streamToString(downloadResponse.readableStreamBody);
        await fs.outputFile(pdfPath(id), content);
        downloadedPosterIds.push(id);
        console.log(`Downloaded blob "${id}"`);
        console.log(`Saved locally to "${pdfPath(id)}"`);
      } catch (err) {
        console.log(`Something went wrong downloading blob "${id}".`);
      }
    };

    posterPromises.push(createPromise());
  });

  await Promise.all(posterPromises);
  console.log('Posters downloaded: ', downloadedPosterIds);
  return downloadedPosterIds;
}

module.exports = {
  uploadPosterToCloud,
  downloadPostersFromCloud,
};
