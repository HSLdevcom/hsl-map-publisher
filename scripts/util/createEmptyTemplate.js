module.exports = function createEmptyTemplate(label, id) {
  return {
    label,
    id,
    areas: JSON.stringify([
      {
        key: 'ads',
        orientation: 'vertical',
        background: '#0077C7',
        resizeable: false,
        slots: [
          {
            image: null,
            size: 1,
          },
          {
            image: null,
            size: 1,
          },
          {
            image: null,
            size: 1,
          },
        ],
      },
      {
        key: 'map',
        orientation: 'vertical',
        background: '#0077C7',
        resizeable: false,
        slots: [
          {
            image: null,
            size: 1,
          },
        ],
      },
      {
        key: 'tram',
        orientation: 'vertical',
        background: '#0077C7',
        resizeable: false,
        slots: [
          {
            image: null,
            size: 1,
          },
        ],
      },
      {
        key: 'footer',
        orientation: 'horizontal',
        background: '#0077C7',
        resizeable: true,
        slots: [
          {
            image: null,
            size: 1,
          },
          {
            image: null,
            size: 1,
          },
          {
            image: null,
            size: 1,
          },
        ],
      },
    ]),
  };
};
