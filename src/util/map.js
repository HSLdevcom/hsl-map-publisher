const API_URL = 'https://dev-kartat.hsldev.com';

console.log(process.env.API_URL || 'No api url env');

const scale = 5;

/**
 * Returns a map image
 * @param {Object} mapOptions - Options used to generate image
 * @returns {Promise} - Image as data URL
 */
// eslint-disable-next-line import/prefer-default-export
export function fetchMap(mapOptions, mapStyle) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ options: { ...mapOptions, scale }, style: mapStyle }),
  };

  return fetch(`${API_URL}/generateImage`, options)
    .then(response => response.blob())
    .then(
      blob =>
        new Promise(resolve => {
          const reader = new window.FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => resolve(reader.result);
        }),
    );
}
