
function fetchStops() {
    return fetch("http://localhost:4000/stops").then(response => response.json());
}

export {
    fetchStops,
};
