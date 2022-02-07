import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import mapProps from 'recompose/mapProps';
import apolloWrapper from 'util/apolloWrapper';

import Header from './header';

const headerQuery = gql`
  query headerQuery($terminalId: String!) {
    terminal: terminalByTerminalId(terminalId: $terminalId) {
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
  const { nameFi, nameSe, stops } = props.data.terminal;
  const { stopZone } = stops.nodes[0]; // StopZone should not vary between stops
  return { nameFi, nameSe, stopZone, shortId: '' };
});

const hoc = compose(graphql(headerQuery), apolloWrapper(propsMapper));

const HeaderContainer = hoc(Header);

HeaderContainer.propTypes = {
  stopId: PropTypes.string.isRequired,
};

export default HeaderContainer;
