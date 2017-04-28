import compose from "recompose/compose";
import branch from "recompose/branch";
import lifecycle from "recompose/lifecycle";

import renderQueue from "util/renderQueue";

const updateQueueOnChange = lifecycle({
    componentWillMount() {
        if (this.props.data.loading) {
            renderQueue.add(this);
        }
        if (this.props.data.error) {
            renderQueue.remove(this, { success: false });
        }
    },
    componentWillUpdate(nextProps) {
        if (nextProps.data.loading !== this.props.data.loading) {
            if (nextProps.data.loading) {
                renderQueue.add(this);
            } else {
                renderQueue.remove(this, { success: true });
            }
        }
        if (nextProps.data.error && nextProps.data.error !== this.props.data.error) {
            renderQueue.remove(this, { success: false });
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
