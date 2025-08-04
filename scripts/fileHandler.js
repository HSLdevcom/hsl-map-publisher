const fs = require('fs-extra');
const path = require('path');
const PDFMerger = require('pdf-merger-js');

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
    const merger = new PDFMerger();
    filenames.forEach(file => {
      merger.add(file);
    });
    await merger.save(filepath);
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
