const runtimeConfig = (typeof window !== 'undefined' && window.PublisherConfig) || {};

const config = {
  DIGITRANSIT_APIKEY: runtimeConfig.DIGITRANSIT_APIKEY || process.env.DIGITRANSIT_APIKEY,
  DIGITRANSIT_URL: runtimeConfig.DIGITRANSIT_URL || process.env.DIGITRANSIT_URL,
  GENERATE_API_URL:
    runtimeConfig.GENERATE_API_URL || process.env.GENERATE_API_URL || 'https://kartat.hsl.fi',
  JORE_GRAPHQL_URL:
    runtimeConfig.JORE_GRAPHQL_URL ||
    process.env.JORE_GRAPHQL_URL ||
    'https://kartat.hsl.fi/jore/graphql',
  REACT_APP_PUBLISHER_SERVER_URL:
    runtimeConfig.REACT_APP_PUBLISHER_SERVER_URL || process.env.REACT_APP_PUBLISHER_SERVER_URL,
  SALES_POINT_DATA_URL:
    runtimeConfig.SALES_POINT_DATA_URL || process.env.SALES_POINT_DATA_URL,
};

export default config;
