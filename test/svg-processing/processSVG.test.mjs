import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { processSVGWithUniqueIds } from '../../src/util/processSVG.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const failedDir = path.join(__dirname, 'failed');
const processedDir = path.join(__dirname, 'processed');

// delete failed directory before running tests
if (fs.existsSync(failedDir)) {
  fs.rmSync(failedDir, { recursive: true });
}

// Get all SVG files in the current directory
const svgFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.svg'));

async function renderSvgToBuffer(browser, svgContent) {
  const page = await browser.newPage();
  await page.setViewport({ width: 600, height: 400 });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: white; }
        </style>
      </head>
      <body>${svgContent}</body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  const screenshot = await page.screenshot({ type: 'png' });
  await page.close();
  return screenshot;
}

function buffersAreEqual(buf1, buf2) {
  if (buf1.length !== buf2.length) return false;
  return buf1.equals(buf2);
}

for (const svgFile of svgFiles) {
  test(`processSVGWithUniqueIds visual regression - ${svgFile} should render identically`, async () => {
    const svgPath = path.join(__dirname, svgFile);
    const originalSvg = fs.readFileSync(svgPath, 'utf-8');
    const processedSvg = processSVGWithUniqueIds(originalSvg);

    const browser = await puppeteer.launch({ headless: true });

    try {
      const originalScreenshot = await renderSvgToBuffer(browser, originalSvg);
      const processedScreenshot = await renderSvgToBuffer(browser, processedSvg);

      const isEqual = buffersAreEqual(originalScreenshot, processedScreenshot);

      if (!isEqual) {
        if (!fs.existsSync(failedDir)) {
          fs.mkdirSync(failedDir, { recursive: true });
        }
        const processedPath = path.join(failedDir, `processed_${svgFile}`);
        fs.writeFileSync(processedPath, processedSvg);
        console.log(`Saved processed SVG to: ${processedPath}`);
      }

      assert.ok(
        isEqual,
        `Processed SVG (${svgFile}) should render identically to the original SVG`,
      );
    } finally {
      await browser.close();
    }
  });

  test(`processSVGWithUniqueIds idempotency - ${svgFile} should render identically after double processing`, async () => {
    const svgPath = path.join(__dirname, svgFile);
    const originalSvg = fs.readFileSync(svgPath, 'utf-8');
    const processedOnce = processSVGWithUniqueIds(originalSvg);
    const processedTwice = processSVGWithUniqueIds(processedOnce);

    const browser = await puppeteer.launch({ headless: true });

    try {
      const originalScreenshot = await renderSvgToBuffer(browser, originalSvg);
      const doubleProcessedScreenshot = await renderSvgToBuffer(browser, processedTwice);

      const isEqual = buffersAreEqual(originalScreenshot, doubleProcessedScreenshot);

      if (!isEqual) {
        if (!fs.existsSync(failedDir)) {
          fs.mkdirSync(failedDir, { recursive: true });
        }
        const processedPath = path.join(failedDir, `double_processed_${svgFile}`);
        fs.writeFileSync(processedPath, processedTwice);
        console.log(`Saved double-processed SVG to: ${processedPath}`);
      }

      assert.ok(
        isEqual,
        `Double-processed SVG (${svgFile}) should render identically to the original SVG`,
      );
    } finally {
      await browser.close();
    }
  });
}
