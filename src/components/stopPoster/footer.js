/* eslint react/no-danger: 0 */

import React from 'react';
import PropTypes from 'prop-types';
import QrCode from 'components/qrCode';
import { InlineSVG } from 'components/util';
import classnames from 'classnames';
import get from 'lodash/get';
import cheerio from 'cheerio';
import tagsByShortId from 'data/tagsByShortId';
import { getFeedbackUrl } from 'data/feedbackCodes';
import dottedLine from 'svg/dotted_line.svg';
import hslLogo from 'svg/hsl_logo.svg';
import customerService from 'svg/customer_service.svg';
import styles from './footer.css';

const parseAttr = attr => Math.round(parseFloat(attr));

function getSvgElementPosition($element, widthModifier = 0, heightModifier = 0) {
  const isLine = $element[0].tagName === 'line';

  const width = isLine
    ? parseAttr($element.attr('x2')) - parseAttr($element.attr('x1'))
    : parseAttr($element.attr('width'));
  const height = isLine
    ? $element.attr('stroke-width')
      ? // The stroke-width can be defined either as an attribute or as a style.
        parseAttr($element.attr('stroke-width'))
      : parseAttr($element.css('stroke-width'))
    : parseAttr($element.attr('height'));

  const posX = isLine ? parseAttr($element.attr('x1')) : parseAttr($element.attr('x'));
  const posY = isLine ? parseAttr($element.attr('y1')) - height / 2 : parseAttr($element.attr('y'));

  return {
    top: posY - posY * heightModifier,
    left: posX - posX * widthModifier,
    width: width - width * widthModifier,
    height: height - height * heightModifier,
  };
}

function getDynamicAreas(svg, widthModifier, heightModifier) {
  const $ = cheerio.load(svg);
  const dynamicAreas = $('.dynamic-area');
  const areas = [];

  dynamicAreas.each((idx, element) => {
    const area = $(element);
    const areaType = area.data('area-type');
    const areaData = area.data('area-data');

    const areaPosition = getSvgElementPosition(area, widthModifier, heightModifier);

    areas.push({
      data: areaData,
      style: areaPosition,
      type: areaType,
    });
  });

  return areas;
}

const slotMargin = 25;
const slotWidth = 392;
const slotHeight = 358;

const getFirstSlotPosition = slotsAmount => {
  let firstSlotMargin;

  switch (slotsAmount) {
    case 3:
      firstSlotMargin = 453;
      break;
    case 4:
      firstSlotMargin = 120;
      break;
    case 5:
      firstSlotMargin = 25;
      break;
    default:
      firstSlotMargin = 480;
      break;
  }

  return firstSlotMargin;
};

function createTemplateSlots(areaSlots) {
  return areaSlots.reduce((slots, { image, size }, idx) => {
    const svg = get(image, 'svg', '');
    const name = get(image, 'name', '');

    if (!size || !svg) {
      return slots;
    }

    const firstSlotLeftPosition = getFirstSlotPosition(areaSlots.length);

    const marginToWidth = size > 1 ? (size - 1) * slotMargin : 0;
    const width = slotWidth * size + marginToWidth;
    const left = firstSlotLeftPosition + slotWidth * idx + slotMargin * idx;
    const $svg = cheerio.load(svg);

    const svgViewBox = $svg('svg')
      .attr('viewBox')
      .split(' ');
    const svgWidth = parseAttr(svgViewBox[2]);
    const svgHeight = parseAttr(svgViewBox[3]);

    const svgWidthModifier = svgWidth / slotWidth - 1;
    const svgHeightModifier = svgHeight / slotHeight - 1;

    const dynamicAreas = getDynamicAreas(svg, svgWidthModifier, svgHeightModifier);

    slots.push({
      svg,
      name,
      dynamicAreas,
      style: {
        width,
        height: slotHeight,
        left,
      },
    });

    return slots;
  }, []);
}

const Footer = props => {
  const urlsByType = {
    ticketsales: tagsByShortId[props.shortId.replace(/\s/g, '')],
    stopinfo: `http://hsl.fi/pysakit/${props.shortId.replace(/\s/g, '')}`,
    feedback: getFeedbackUrl(props.shortId),
  };

  const templateSlots = get(props, 'template.slots', []);

  if (templateSlots.length === 3 && props.isSmallTerminalPoster) {
    templateSlots.splice(2, 1); // Compatibility with 3 slot templates for the smaller terminal poster
  }

  if (templateSlots.length === 5 && props.isSmallTerminalPoster) {
    templateSlots.splice(4, 1); // Remove the fifth SVG slot to fit the smaller terminal poster footer
  }

  const slots = createTemplateSlots(templateSlots);

  return (
    <div className={styles.footerWrapper}>
      <InlineSVG className={styles.dottedLine} src={dottedLine} />
      {slots.length <= 3 && getFirstSlotPosition(templateSlots.length) > 25 && (
        <div>
          <InlineSVG className={classnames(styles.footerPiece, styles.hslLogo)} src={hslLogo} />
          <InlineSVG
            className={classnames(styles.footerPiece, styles.customerService)}
            src={customerService}
          />
        </div>
      )}
      {slots.map((slot, slotIdx) => {
        const svg = get(slot, 'svg', '');

        return (
          <div
            key={`slot_${slotIdx}_${slot.name}`}
            className={styles.dynamicSlot}
            style={slot.style}>
            <div className={styles.svgContainer} dangerouslySetInnerHTML={{ __html: svg }} />
            {slot.dynamicAreas.map((area, areaIdx) => {
              const url = get(urlsByType, get(area, 'data', ''), null);

              if (!url) {
                props.onError(
                  `No URL set for key '${get(area, 'data', '')}' and stop ${props.shortId}!`,
                );
                return null;
              }

              if (area.type === 'qr-code') {
                return (
                  <QrCode
                    key={`dynamic_area_${area.type}_${areaIdx}`}
                    style={get(area, 'style', {})}
                    className={styles.qrCode}
                    url={url}
                  />
                );
              }

              if (area.type === 'url-display') {
                return (
                  <span
                    key={`dynamic_area_${area.type}_${areaIdx}`}
                    style={get(area, 'style', {})}
                    className={styles.url}>
                    {url.replace('http://', '')}
                  </span>
                );
              }

              return null;
            })}
          </div>
        );
      })}
    </div>
  );
};

Footer.propTypes = {
  template: PropTypes.any,
  shortId: PropTypes.string.isRequired,
  isTrunkStop: PropTypes.bool.isRequired,
  onError: PropTypes.func.isRequired,
  isSmallTerminalPoster: PropTypes.bool,
};

Footer.defaultProps = {
  template: null,
  isSmallTerminalPoster: false,
};

export default Footer;
