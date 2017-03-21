import { gql, graphql } from "react-apollo";
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

const HeaderContainer = apolloWrapper(propsMapper)(Header);

export default graphql(headerQuery)(HeaderContainer);
