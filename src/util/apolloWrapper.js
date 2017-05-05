import compose from "recompose/compose";
import branch from "recompose/branch";
import lifecycle from "recompose/lifecycle";

import renderQueue from "util/renderQueue";

const updateQueueOnChange = lifecycle({
    componentDidMount() {
        if (this.props.data.loading) {
            renderQueue.add(this);
        }
        if (this.props.data.error) {
            renderQueue.remove(this, { success: false });
        }
    },
    componentDidUpdate(prevProps) {
        if (this.props.data.loading !== prevProps.data.loading) {
            if (this.props.data.loading) {
                renderQueue.add(this);
            } else {
                renderQueue.remove(this, { success: !this.props.data.error });
            }
        }
    },
    componentWillUnmount() {
        renderQueue.remove(this, { success: !this.props.data.error });
    },
});

const renderNull = branch(
    props => (props.data.error || props.data.loading),
    () => (props) => {
        if (props.data.error) console.error(props.data.error); // eslint-disable-line no-console
        return null;
    }
);

export default hoc => compose(
    updateQueueOnChange,
    renderNull,
    hoc
);
