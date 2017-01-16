import React, { Component } from "react";
import { fetchRouteMapProps } from "util/routeMap";

const routeStyle = {
    stroke: "hsl(200, 100%, 40%)",
    strokeWidth: "1",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
};

const stopStyle = {
    fill: "hsl(200, 100%, 40%)",
};

const labelStyle = {
    fontFamily: "GothamXNarrow-Medium",
    fontSize: "8",
};

const Stop = props => (
    <circle r={1} cx={props.left} cy={props.top}/>
);

const Label = props => (
    <g transform={`translate(${props.left} ${props.top})`}>
        <text x="0" y="0">
            {props.routes.map((route, index) => (
                <tspan key={index} x="0" dy="1.0em">
                    {route}
                </tspan>
            ))}
        </text>
    </g>
);

class RouteMap extends Component {

    componentDidMount() {
        this.fetchContent();
    }

    componentDidUpdate(prevProps) {
        if (this.props !== prevProps && this.props.routeIds && this.props.options) {
            this.fetchContent();
        }
    }

    componentWillUnmount() { // eslint-disable-line
        // TODO: Cancel ongoing request
    }

    fetchContent() {
        fetchRouteMapProps(this.props.routeIds, this.props.options).then((data) => {
            this.setState(data, () => {
                const output = `${this.container.innerHTML}`;
                if (this.props.onReady) this.props.onReady(output);
            });
        });
    }

    render() {
        if (!this.state) return null;

        const dimensions = {
            width: this.state.options.width,
            height: this.state.options.height,
        };

        return (
            <div ref={(ref) => { this.container = ref; }}>
                <svg {...dimensions}>
                    <image {...dimensions} xlinkHref={this.state.image}/>

                    <g {...routeStyle} id="routes">
                        {this.state.paths.map((path, index) => <path key={index} d={path}/>)}
                    </g>

                    <g {...stopStyle} id="stops">
                        {this.state.stops.map((stop, index) => <Stop key={index} {...stop}/>)}
                    </g>

                    <g {...labelStyle} id="labels">
                        {this.state.labels.map((label, index) => <Label key={index} {...label}/>)}
                    </g>
                </svg>
            </div>
        );
    }
}

RouteMap.propTypes = {
    routeIds: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    options: React.PropTypes.shape({
        /* eslint-disable react/no-unused-prop-types */
        center: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
        width: React.PropTypes.number.isRequired,
        height: React.PropTypes.number.isRequired,
        zoom: React.PropTypes.number.isRequired,
        scale: React.PropTypes.number,
        /* eslint-enable react/no-unused-prop-types */
    }).isRequired,
    onReady: React.PropTypes.func,
};

export default RouteMap;
