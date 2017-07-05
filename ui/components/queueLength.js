import React from "react";
import { fetchQueueInfo } from "util/api";

export default class QueueLength extends React.Component {
    constructor(...args) {
        super(...args);
        this.state = { queueLength: "?" };
        this.intervalId = setInterval(() => fetchQueueInfo().then(this.setState.bind(this)), 30000);
    }

    componentDidMount() {
        fetchQueueInfo().then(this.setState.bind(this));
    }

    componentWillUnmount() {
        if (this.intervalId != null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    render() {
        return <div style={{ marginLeft: "10px" }}>Jonon pituus: {this.state.queueLength}</div>;
    }
}
