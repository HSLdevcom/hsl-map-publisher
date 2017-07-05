
const API_URL = "api";

async function fetchQueueInfo() {
    const response = await fetch(`${API_URL}/queueInfo`);
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
}

async function fetchStops() {
    const response = await fetch(`${API_URL}/stops`);
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
}

async function generate(component, props, filename) {
    const options = { method: "POST", body: JSON.stringify({ component, props, filename }) };

    const response = await fetch(`${API_URL}/generate`, options);
    if (!response.ok) throw new Error(response.statusText);

    const { path } = await response.json();
    return `${API_URL}/${path}/`;
}

export {
    fetchQueueInfo,
    fetchStops,
    generate,
};
