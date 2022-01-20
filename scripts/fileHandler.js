const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

const { AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY } = require('../constants');

const cwd = process.cwd();

const pdfOutputDir = path.join(cwd, 'output');
const concatOutputDir = path.join(pdfOutputDir, 'concatenated');

fs.ensureDirSync(concatOutputDir);

const pdfPath = id => path.join(pdfOutputDir, `${id}.pdf`);

/**
 * Concatenates posters to a multi-page PDF
 * @param {string[]} ids - Ids to concatate
 * @returns {Readable} - PDF stream
 * @param ids
 * @param title
 */
async function concatenate(ids, title) {
  const concatFolderExists = await fs.pathExists(concatOutputDir);
  if (!concatFolderExists) {
    fs.ensureDirSync(concatOutputDir);
  }

  const filenames = ids.map(id => pdfPath(id));
  const parsedTitle = title.replace('/', '');
  const filepath = path.join(concatOutputDir, `${parsedTitle}.pdf`);
  const fileExists = await fs.pathExists(filepath);

  if (!fileExists) {
    return new Promise((resolve, reject) => {
      const pdftk = spawn('pdftk', [...filenames, 'cat', 'output', filepath]);

      pdftk.on('error', err => {
        reject(err);
      });

      pdftk.on('close', code => {
        if (code === 0) {
          resolve(filepath);
        } else {
          reject(new Error(`PDFTK closed with code ${code}`));
        }
      });
    });
  }

  return filepath;
}

async function removeFiles(ids) {
  if (!AZURE_STORAGE_ACCOUNT || !AZURE_STORAGE_KEY) {
    console.log('Azure credentials not set. Not removing files.');
    return;
  }
  const filenames = ids.map(id => pdfPath(id));
  const removePromises = [];

  filenames.forEach(filename => {
    const createPromise = async () => {
      try {
        await fs.remove(filename);
      } catch (err) {
        console.log(`Pdf ${filename} removal unsuccessful.`);
        console.error(err);
      }
    };

    removePromises.push(createPromise());
  });

  await Promise.all(removePromises);
}

module.exports = {
  concatenate,
  removeFiles,
};
