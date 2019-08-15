const path = require('path');
const fs = require('fs-extra');
const { getSecret } = require('./secrets');

const fontFiles = [
  'GothamRnd-Bold.otf',
  'GothamRnd-BoldItal.otf',
  'GothamRnd-Book.otf',
  'GothamRnd-Light.otf',
  'GothamRnd-Medium.otf',
  'GothamXNarrow-Bold.otf',
  'GothamXNarrow-BoldItalic.otf',
  'GothamXNarrow-Book.otf',
  'GothamXNarrow-Light.otf',
  'GothamXNarrow-Medium.otf',
];

async function downloadFonts() {
  const fontsPath = path.join('/', 'fonts');

  const account = getSecret('AZURE_STORAGE_ACCOUNT');
  const accountKey = getSecret('AZURE_STORAGE_KEY');
  const containerName = 'fonts';

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

  console.log(`Uploading DB dump ${filePath} to Azure.`);
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
    console.log('Dump upload unsuccessful.');
    console.error(err);
    return false;
  }

  console.log('Dump upload successful.');
  return true;
}

module.exports = downloadFonts;
