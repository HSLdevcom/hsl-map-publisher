HSL Map Publisher
====================

### Installation

Install dependencies:

```
npm install
``` 

Install SlimerJS 0.10.x and compatible Firefox version.

Add path to SlimerJS executable to `.slimerjs`.

Add path to Firefox executable to `SLIMERJSLAUNCHER` environment variable.

### Usage

Start development server:
```
npm run start:hot
```

Generate stop posters:
```
npm start
node scripts/pdfGenerator.js
```
