import cheerio from 'cheerio';

const parseAttr = attr => Math.round(parseInt(attr, 10));

export function sizedSvg(svgSource, width, height) {
  if (!svgSource || (!width && !height)) {
    return {
      svg: false,
      width,
      height: 0,
    };
  }

  let svgOrigWidth = 0;
  let svgOrigHeight = 0;
  const $svg = cheerio.load(svgSource);

  // Figure out the aspect ratio of the svg from the width/height or the viewBox.
  if ($svg('svg').attr('width')) {
    svgOrigWidth = parseAttr($svg('svg').attr('width'));
    svgOrigHeight = parseAttr($svg('svg').attr('height'));
  } else {
    const svgViewBox = $svg('svg')
      .attr('viewBox')
      .split(' ');
    svgOrigWidth = parseAttr(svgViewBox[2]);
    svgOrigHeight = parseAttr(svgViewBox[3]);
  }

  let svgWidth = width;

  // Height should be supplied if width is not.
  if (!svgWidth) {
    svgWidth = Math.floor(height * (svgOrigWidth / svgOrigHeight));
  }

  const svgHeight = Math.floor(svgWidth * (svgOrigHeight / svgOrigWidth));

  $svg('svg').attr('width', svgWidth);
  $svg('svg').attr('height', svgHeight);

  const svgSrc = $svg.html();

  return {
    svg: svgSrc,
    width: svgWidth,
    height: svgHeight,
  };
}
