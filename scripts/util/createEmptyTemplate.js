module.exports = function createEmptyTemplate(label, id) {
    return {
        label,
        id,
        areas: JSON.stringify([
            {
                key: "footer",
                orientation: "horizontal",
                background: "#0077C7",
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
