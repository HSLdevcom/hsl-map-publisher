import React, { Component } from 'react';
import { hot } from 'react-hot-loader';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloProvider } from 'react-apollo';
import qs from 'qs';
import get from 'lodash/get';

import StopPoster from 'components/stopPoster/stopPosterContainer';
import Timetable from 'components/timetable/timetableContainer';
import renderQueue from 'util/renderQueue';

const components = {
  StopPoster,
  Timetable,
};

const graphqlUrl =
  process.env.NODE_ENV === 'development'
    ? 'https://kartat.hsldev.com/jore/graphql'
    : 'http://kartat.hsl.fi/jore/graphql';

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

    return (
      <div
        style={rootStyle}
        ref={ref => {
          this.root = ref;
        }}>
        <ApolloProvider client={client}>
          <ComponentToRender {...props} template={template} />
        </ApolloProvider>
      </div>
    );
  }
}

export default hot(module)(App);
