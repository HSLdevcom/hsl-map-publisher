import PropTypes from "prop-types";
import { gql, graphql } from "react-apollo";
import compose from "recompose/compose";
import mapProps from "recompose/mapProps";
import apolloWrapper from "util/apolloWrapper";

import Header from "./header";

const headerQuery = gql`
    query headerQuery($stopId: String!) {
        stop: stopByStopId(stopId: $stopId) {
            shortId
            nameFi
            nameSe
        }
    }
`;

const propsMapper = mapProps(props => props.data.stop);

const hoc = compose(
    graphql(headerQuery),
    apolloWrapper(propsMapper)
);

const HeaderContainer = hoc(Header);

HeaderContainer.propTypes = {
    stopId: PropTypes.string.isRequired,
};

export default HeaderContainer;
