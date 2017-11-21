const optimizePositions = require("./optimizePositions").default;

self.addEventListener("message", (event) => {
    const { positions, boundingBox } = event.data;
    const optimizedPositions = optimizePositions(positions, boundingBox);
    self.postMessage(optimizedPositions);
});
