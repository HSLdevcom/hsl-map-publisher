module.exports = function createEmptyTemplate(label, id) {
    return {
        label,
        id,
        area: "footer",
        images: JSON.stringify([
            {
                name: "",
                svg: "",
                size: 1,
            }, {
                name: "",
                svg: "",
                size: 1,
            }, {
                name: "",
                svg: "",
                size: 1,
            },
        ]),
    };
};
