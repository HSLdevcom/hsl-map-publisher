import { gql, graphql } from "react-apollo";

import Header from "./header";

export default graphql(gql`
    query headerQuery($stopId: String!) {
        stop: stopByStopId(stopId: $stopId) {
            shortId
            nameFi
            nameSe
        }
    }
`, {
    props: props => props.data.stop,
})(Header);
