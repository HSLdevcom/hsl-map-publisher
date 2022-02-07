import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import withProps from 'recompose/withProps';

import apolloWrapper from 'util/apolloWrapper';

import TerminalPoster from './terminalPoster';

const terminalStopsQuery = gql`
  query terminalStopsQuery($stopId: String!) {
    terminal: terminalByTerminalId(terminalId: $stopId) {
      stops: stopsByTerminalId {
        nodes {
          stopId
        }
      }
    }
  }
`;

const propsMapper = withProps(props => {
  const stops = props.data.terminal.stops.nodes.map(stop => stop.stopId);
  return {
    shortId: '',
    hasRoutes: true,
    isTrunkStop: false,
    isTramStop: false,
    terminalId: props.stopId, // Use terminalId rather than stopId to make things not so confusing.
    stops,
  };
});

const hoc = compose(graphql(terminalStopsQuery), apolloWrapper(propsMapper));

const StopPosterContainer = hoc(TerminalPoster);

StopPosterContainer.propTypes = {
  stopId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
};

export default StopPosterContainer;
