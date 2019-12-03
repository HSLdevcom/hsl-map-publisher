import renderQueue from 'util/renderQueue';

const scale = 5;

/**
 * Returns a map image
 * @param {Object} mapOptions - Options used to generate image
 * @returns {Promise} - Image as data URL
 */
// eslint-disable-next-line import/prefer-default-export
export async function fetchMap(mapOptions, mapStyle) {
  const serverUrl = process.env.GENERATE_API_URL || 'https://kartat.hsl.fi';
  window.serverLog(`Generating the map with ${serverUrl}`);

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ options: { ...mapOptions, scale }, style: mapStyle }),
  };

  const response = await fetch(`${serverUrl}/generateImage`, options);
  const blob = await response.blob();
  if (response && response.status >= 500) {
    console.log(`Received status code ${response.status} from generator-server`);
    renderQueue.remove(this, {
      error: new Error(`Received status code ${response.status} from generator-server`),
    });
  }
  return new Promise(resolve => {
    const reader = new window.FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result);
  });
}
