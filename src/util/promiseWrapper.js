import React, { Component } from "react";
import renderQueue from "util/renderQueue";

const hocFactory = propName => WrappedComponent => (
    class PromiseWrapper extends Component {
        constructor(props) {
            super(props);
            this.state = { loading: !!props[propName] };
        }

        handlePromise(promise) {
            this.promise = promise;
            renderQueue.add(promise);
            promise
                .then((value) => {
                    const callback = () => renderQueue.remove(promise);
                    if (this.promise !== promise) {
                        callback();
                    } else {
                        this.setState({ value, loading: false }, callback);
                    }
                })
                .catch((error) => {
                    const callback = () => renderQueue.remove(promise, { error });
                    if (this.promise !== promise) {
                        callback();
                    } else {
                        this.setState({ error, loading: false }, callback);
                    }
                });
        }

        componentDidMount() {
            if (this.props[propName]) {
                this.handlePromise(this.props[propName]);
            }
        }

        componentWillReceiveProps(nextProps) {
            if (nextProps[propName] && nextProps[propName] !== this.props[propName]) {
                this.setState({ loading: true });
                this.handlePromise(nextProps[propName]);
            }
        }

        componentWillUnmount() {
            this.promise = null;
        }

        render() {
            if (this.state.loading || this.state.error) {
                return null;
            }
            const props = { ...this.props, [propName]: this.state.value };
            return <WrappedComponent {...props}/>;
        }
    }
);

export default hocFactory;
