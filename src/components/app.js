import React, { Component } from 'react';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloProvider } from 'react-apollo';
import qs from 'qs';
import get from 'lodash/get';

import StopPoster from 'components/stopPoster/stopPosterContainer';
import Timetable from 'components/timetable/timetableContainer';
import A3StopPoster from 'components/a3stopPoster/a3StopPosterContainer';
import TerminalPoster from 'components/stopPoster/terminalPosterContainer';
import LineTimetable from 'components/lineTimetable/lineTimetableContainer';
import CoverPage from 'components/coverPage/coverPageContainer';
import StopRoutePlate from './stopRoutePlate/stopRoutePlateContainer';
import renderQueue from 'util/renderQueue';

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
      params = qs.parse(window.location.search, {
        ignoreQueryPrefix: true,
        decoder: str => {
          // Make booleans booleans again
          // qs encodes booleans to strings, we need to make sure that they are real booleans.
          if (str === 'true') {
            return true;
          }
          if (str === 'false') {
            return false;
          }

          return decodeURIComponent(str);
        },
      });
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

    return (
      <div
        style={rootStyle}
        ref={ref => {
          this.root = ref;
        }}>
        <ApolloProvider client={client}>
          <ComponentToRender {...props} standalone template={template} />
        </ApolloProvider>
      </div>
    );
  }
}

export default App;
