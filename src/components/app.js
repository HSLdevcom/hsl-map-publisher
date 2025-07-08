import React, { Component } from 'react';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloProvider } from 'react-apollo';
import get from 'lodash/get';

import StopPoster from 'components/stopPoster/stopPosterContainer';
import Timetable from 'components/timetable/timetableContainer';
import A3StopPoster from 'components/a3stopPoster/a3StopPosterContainer';
import TerminalPoster from 'components/stopPoster/terminalPosterContainer';
import LineTimetable from 'components/lineTimetable/lineTimetableContainer';
import CoverPage from 'components/coverPage/coverPageContainer';
import * as StopRoutePlate from './stopRoutePlate/stopRoutePlateContainer';
import renderQueue from 'util/renderQueue';
import { parseRenderParams } from '../util/client';

const components = {
  StopPoster,
  Timetable,
  A3StopPoster,
  TerminalPoster,
  LineTimetable,
  CoverPage,
  StopRoutePlate,
};

const graphqlUrl = process.env.JORE_GRAPHQL_URL || 'https://kartat.hsl.fi/jore/graphql';

const client = new ApolloClient({
  link: createHttpLink({ uri: graphqlUrl }),
  cache: new InMemoryCache(),
});

class App extends Component {
  static handleError(error) {
    if (window.callPhantom) {
      window.callPhantom({ error: error.message });
      return;
    }
    console.error(error); // eslint-disable-line no-console
  }

  constructor(props) {
    super(props);
    this.root = null;
    this.state = { fetchedProps: null };
    this.params = null;
  }

  componentDidMount() {
    if (this.root) {
      renderQueue.onEmpty(error => {
        if (error) {
          App.handleError(error);
          return;
        }

        if (window.callPhantom) {
          window.callPhantom({
            width: this.root.offsetWidth,
            height: this.root.offsetHeight,
          });
        } else {
          console.log('Rendering finished');
        }
      });
    }

    try {
      const params = parseRenderParams(window.location.search);
      const renderComponent = components[get(params, 'component', '')];
      const posterId = get(params, 'id', null);

      if (renderComponent === components.StopRoutePlate && posterId) {
        fetch(`${process.env.REACT_APP_PUBLISHER_SERVER_URL}/posters/${posterId}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch props for id ${posterId}`);
            }
            return response.json();
          })
          .then(data => {
            this.setState({ fetchedProps: { ...data.props, csvFileName: posterId } });
          });
      }
    } catch (error) {
      App.handleError(new Error('Failed to parse url fragment'));
    }
  }

  // eslint-disable-next-line class-methods-use-this
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.log(info);
    App.handleError(error);
  }

  render() {
    let ComponentToRender;
    let props;
    let params;
    let template;

    try {
      params = parseRenderParams(window.location.search);
      ComponentToRender = components[get(params, 'component', '')];
      props = get(params, 'props', '{}');
      template = get(params, 'template', '');
    } catch (error) {
      App.handleError(new Error('Failed to parse url fragment'));
      return null;
    }

    if (!ComponentToRender || !props) {
      App.handleError(new Error('Invalid component or props'));
      return null;
    }

    let rootStyle = {};

    if (!props.printTimetablesAsA4) {
      rootStyle = { display: 'inline-block' };
    }

    if (ComponentToRender === components.LineTimetable) {
      rootStyle = { display: 'block' };
    }

    if (ComponentToRender === components.StopRoutePlate) {
      if (props.useLineQuery) {
        ComponentToRender = StopRoutePlate.LineQueryStopRoutePlateContainer;
      } else {
        ComponentToRender = StopRoutePlate.StopRoutePlateContainer;
      }
    }

    const propsToPass = this.state.fetchedProps ? this.state.fetchedProps : props;

    return (
      <div
        style={rootStyle}
        ref={ref => {
          this.root = ref;
        }}>
        <ApolloProvider client={client}>
          <ComponentToRender {...propsToPass} standalone template={template} />
        </ApolloProvider>
      </div>
    );
  }
}

export default App;
