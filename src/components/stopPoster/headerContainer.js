import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import mapProps from 'recompose/mapProps';
import apolloWrapper from 'util/apolloWrapper';

import Header from './header';

const headerQuery = gql`
  query headerQuery($stopId: String!) {
    stop: stopByStopId(stopId: $stopId) {
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

const propsMapper = mapProps(props => {
  const { stop } = props.data;
  const { terminal } = props.data;
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
