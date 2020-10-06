import compose from 'recompose/compose';
import branch from 'recompose/branch';
import lifecycle from 'recompose/lifecycle';

import renderQueue from 'util/renderQueue';

const updateQueueOnChange = lifecycle({
  componentDidMount() {
    if (this.props.data.loading) {
      renderQueue.add(this);
    }
    if (this.props.data.error) {
      renderQueue.remove(this, { error: this.props.data.error });
    }
  },
  componentDidUpdate(prevProps) {
    if (this.props.data.loading !== prevProps.data.loading) {
      if (this.props.data.loading) {
        renderQueue.add(this);
      } else if (this.props.data.error) {
        renderQueue.remove(this, { error: this.props.data.error });
      } else {
        renderQueue.remove(this);
      }
    }
  },
  componentWillUnmount() {
    renderQueue.remove(this, { success: !this.props.data.error });
  },
});

const renderNull = branch(
  props => props.data.error || props.data.loading,
  () => () => null,
);

export default hoc => compose(updateQueueOnChange, renderNull, hoc);
