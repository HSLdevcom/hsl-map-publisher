import PropTypes from "prop-types";
import { gql, graphql } from "react-apollo";
import compose from "recompose/compose";
import mapProps from "recompose/mapProps";
import apolloWrapper from "util/apolloWrapper";

import Footer from "./footer";

const headerQuery = gql`
    query headerQuery($stopId: String!) {
        stop: stopByStopId(stopId: $stopId) {
            shortId
        }
    }
`;

const propsMapper = mapProps(props => props.data.stop);

const hoc = compose(
    graphql(headerQuery),
    apolloWrapper(propsMapper)
);

const FooterContainer = hoc(Footer);

FooterContainer.propTypes = {
    stopId: PropTypes.string.isRequired,
};

export default FooterContainer;
