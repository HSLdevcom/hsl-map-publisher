import PropTypes from 'prop-types';
import React from 'react';
import styles from './errorPage.css';
import { omit } from 'lodash';

const ErrorPage = ({ error, renderProps }) => (
  <div className={styles.errorPageContainer}>
    <h1 className={styles.topText}>Aikataulua hakiessa tapahtui virhe.</h1>
    <p className={styles.mainText}>
      Pahoittelemme aiheutunutta vaivaa. Olettehan yhteydessä HSL Asiakastukeen jos tämä ongelma
      jatkuu. <a href="https://www.hsl.fi/asiakaspalvelu">Linkki asiakaspalveluun</a>
    </p>
    <br />
    <p className={styles.technicalText}>Virheen tekniset tiedot:</p>
    <p className={styles.technicalText}>{error.message}</p>
    <p className={styles.technicalText}>{JSON.stringify(omit(renderProps, 'data'))}</p>
  </div>
);

ErrorPage.defaultProps = {
  error: '',
  renderProps: {},
};

ErrorPage.propTypes = {
  error: PropTypes.object,
  renderProps: PropTypes.object,
};

export default ErrorPage;
