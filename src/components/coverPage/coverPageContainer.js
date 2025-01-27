import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import mapProps from 'recompose/mapProps';
import compose from 'recompose/compose';
import apolloWrapper from 'util/apolloWrapper';
import CoverPage from './coverPage';

const coverPageQuery = gql`
  query coverPageQuery($stopIds: [String]) {
    getStopsByIds(stopIds: $stopIds) {
      nodes {
        stopId
        nameFi
        addressFi
        shortId
        posterCount
        stopType
        modes {
          edges {
            node
          }
        }
        distributionArea
        distributionOrder
      }
    }
  }
`;

const propsMapper = mapProps(props => {
  const stops = props.data.getStopsByIds.nodes;
  return {
    title: props.title,
    stops,
    date: props.date,
    dateBegin: props.dateBegin,
    dateEnd: props.dateEnd,
  };
});

const hoc = compose(graphql(coverPageQuery), apolloWrapper(propsMapper));
const CoverPageContainer = hoc(CoverPage);

CoverPageContainer.defaultProps = {
  title: '',
  greyscale: false,
  dateBegin: '',
  dateEnd: '',
};

CoverPageContainer.propTypes = {
  title: PropTypes.string,
  buildId: PropTypes.string.isRequired,
  stopIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  date: PropTypes.string.isRequired,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  greyscale: PropTypes.bool,
};

export default CoverPageContainer;
