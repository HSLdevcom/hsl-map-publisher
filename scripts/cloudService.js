const { SharedKeyCredential, BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const fs = require('fs-extra');

const AZURE_STORAGE_ACCOUNT = '';
const AZURE_STORAGE_KEY = '';
const AZURE_UPLOAD_CONTAINER = '';

async function uploadToBlob(filePath) {
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
  const fileStat = await fs.stat(filePath);

  const getFileStream = () => fs.createReadStream(filePath);

  const sharedKeyCredential = new SharedKeyCredential(account, accountKey);
  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    sharedKeyCredential,
  );

  const containerClient = blobServiceClient.getContainerClient(containerName);

  const blobName = path.basename(filePath);
  const blobClient = containerClient.getBlobClient(blobName).getBlockBlobClient();

  try {
    await blobClient.upload(getFileStream, fileStat.size);
  } catch (err) {
    console.log('Pdf upload unsuccessful.');
    console.error(err);
    return false;
  }

  console.log('Pdf upload successful.');
  return true;
}

async function downloadFromBlob() {
  const account = AZURE_STORAGE_ACCOUNT;
  const accountKey = AZURE_STORAGE_KEY;
  const containerName = AZURE_UPLOAD_CONTAINER;

  const sharedKeyCredential = new SharedKeyCredential(account, accountKey);
  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    sharedKeyCredential,
  );
}

module.exports = {
  uploadToBlob,
  downloadFromBlob,
};
