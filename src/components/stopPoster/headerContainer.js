import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import compose from 'recompose/compose';
import mapProps from 'recompose/mapProps';
import apolloWrapper from 'util/apolloWrapper';

import Header from './header';

const headerQuery = gql`
  query headerQuery($stopId: String!) {
    stop: stopByStopId(stopId: $stopId) {
      nodeId
      shortId
      nameFi
      nameSe
      stopZone
    }
    terminal: terminalByTerminalId(terminalId: $stopId) {
      nameFi
      nameSe
      stops: stopsByTerminalId {
        nodes {
          stopZone
        }
      }
    }
  }
`;

const propsMapper = mapProps((props) => {
  const { stop, terminal } = props.data;
  // Get the details from stop or terminal depending on how the query returned data
  const { shortId, nameFi, nameSe } = stop || terminal;
  const { stopZone } = stop || terminal.stops.nodes[0];

  return { shortId, nameFi, nameSe, stopZone };
});

const hoc = compose(graphql(headerQuery), apolloWrapper(propsMapper));

const HeaderContainer = hoc(Header);

HeaderContainer.propTypes = {
  stopId: PropTypes.string.isRequired,
};

export default HeaderContainer;
