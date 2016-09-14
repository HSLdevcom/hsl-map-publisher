import React from "react";
import Header from "components/header";
import Footer from "components/footer";

import { JustifiedColumn } from "components/util";

import styles from "./app.css";

const App = () => (
    <div className={styles.root}>
        <JustifiedColumn>
            <Header/>

            <Footer/>
        </JustifiedColumn>
    </div>
);

export default App;
