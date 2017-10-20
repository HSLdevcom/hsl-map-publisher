
const API_URL = "api";
const OUTPUT_URL = `${window.location.protocol}//${window.location.host}/output`;

async function fetchBuilds() {
    const response = await fetch(`${API_URL}/builds`);
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
}

async function fetchStops() {
    const response = await fetch(`${API_URL}/stops`);
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
}

async function generate(component, props, title) {
    const options = { method: "POST", body: JSON.stringify({ component, props, title }) };

    const response = await fetch(`${API_URL}/generate`, options);
    if (!response.ok) throw new Error(response.statusText);

    const { path } = await response.json();
    return `${OUTPUT_URL}/${path}/`;
}

export {
    fetchBuilds,
    fetchStops,
    generate,
};
