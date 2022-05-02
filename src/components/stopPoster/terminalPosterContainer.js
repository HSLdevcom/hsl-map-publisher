import PropTypes from 'prop-types';
import compose from 'recompose/compose';
import withProps from 'recompose/withProps';

import TerminalPoster from './terminalPoster';

const propsMapper = withProps(props => ({
  shortId: '',
  hasRoutes: true,
  isTrunkStop: false,
  isTramStop: false,
  terminalId: props.stopId, // Use terminalId rather than stopId to make things not so confusing.
  stops: props.selectedStops.split(','),
}));

const hoc = compose(propsMapper);

const StopPosterContainer = hoc(TerminalPoster);

StopPosterContainer.propTypes = {
  stopId: PropTypes.string.isRequired,
  selectedStops: PropTypes.string.isRequired,
};

export default StopPosterContainer;
