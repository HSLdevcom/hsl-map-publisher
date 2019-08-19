const scale = 5;

/**
 * Returns a map image
 * @param {Object} mapOptions - Options used to generate image
 * @returns {Promise} - Image as data URL
 */
// eslint-disable-next-line import/prefer-default-export
export async function fetchMap(mapOptions, mapStyle) {
  // Server url provided by Puppeteer
  const serverUrl =
    typeof window.getServerUrl === 'function'
      ? await window.getServerUrl()
      : 'http://localhost:8000';

  window.serverLog(`Generating the map with ${serverUrl}`);

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ options: { ...mapOptions, scale }, style: mapStyle }),
  };

  const response = await fetch(`${serverUrl}/generateImage`, options);
  const blob = await response.blob();

  return new Promise(resolve => {
    const reader = new window.FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result);
  });
}
