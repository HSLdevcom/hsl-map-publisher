module.exports = function createEmptyTemplate(label, id) {
    return {
        label,
        id,
        areas: JSON.stringify({
            footer: {
                key: "footer",
                orientation: "horizontal",
                background: "#0077C7",
                resizeable: true,
                slots: [
                    {
                        imageName: "",
                        svg: "",
                        size: 1,
                    },
                    {
                        imageName: "",
                        svg: "",
                        size: 1,
                    },
                    {
                        imageName: "",
                        svg: "",
                        size: 1,
                    },
                ],
            },
        }),
    };
};
