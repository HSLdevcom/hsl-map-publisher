
const API_URL = "http://kartat.hsl.fi";

// This enables us to set a global scale from app.js
let scale = 1;

export function setScale(newScale) {
    scale = newScale;
}

/**
 * Returns a map image
 * @param {Object} mapOptions - Options used to generate image
 * @returns {Promise} - Image as data URL
 */
// eslint-disable-next-line import/prefer-default-export
export function fetchMap(mapOptions, mapStyle) {
    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: { ...mapOptions, scale }, style: mapStyle }),
    };

    return fetch(`${API_URL}/generateImage`, options)
        .then(response => response.blob())
        .then(blob => new Promise((resolve) => {
            const reader = new window.FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result);
        }));
}
