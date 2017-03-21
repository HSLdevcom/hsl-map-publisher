import compose from "recompose/compose";
import branch from "recompose/branch";


const renderNullIfNotLoaded = branch(
    props => props.data.loading,
    () => () => null
);

const renderError = branch(
    props => props.data.error,
    () => (props) => {
        console.error(props.data.error); // eslint-disable-line no-console
        return null;
    }
);

export default hoc => compose(
    renderNullIfNotLoaded,
    renderError,
    hoc
);
