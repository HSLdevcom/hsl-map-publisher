
const API_URL = "api";

async function fetchStops() {
    const response = await fetch(`${API_URL}/stops`);
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
}

async function generate(component, props) {
    const options = { method: "POST", body: JSON.stringify({ component, props }) };

    const response = await fetch(API_URL, options);
    if (!response.ok) throw new Error(response.statusText);

    const { url } = await response.json();
    return url;
}

export {
    fetchStops,
    generate,
};
