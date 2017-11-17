
/**
 * Returns updated position
 * @param {Object} position
 * @param {Object} diff - Changes to position (Optional; only refresh left and right values)
 * @param {number} diff.angles - Degrees to rotate
 * @param {number} diff.distance - Pixels to add to distance from anchor x, y
 * @returns {Object} - Updated position
 */
function updatePosition(position, diff = {}) {
    if (position.isFixed) return position;

    let distance = "distance" in position ? position.distance : position.initialDistance;
    let angle = "angle" in position ? position.angle : position.initialAngle;

    if (diff.angle) angle = (angle + diff.angle) % 360;
    if (diff.distance) distance += diff.distance;

    if (distance < position.initialDistance) return null;

    const a = position.width / 2;
    const b = position.height / 2;
    const cos = Math.cos((angle * Math.PI) / 180);
    const sin = Math.sin((angle * Math.PI) / 180);

    let radius = Math.min(a, b) + distance;
    let cx;
    let cy;
    let dx;
    let dy;

    do {
        cx = radius * cos;
        cy = radius * sin;
        dx = Math.max(Math.abs(cx) - a, 0);
        dy = Math.max(Math.abs(cy) - b, 0);
        radius += 1;
    } while (Math.sqrt((dx * dx) + (dy * dy)) < distance);

    return {
        ...position,
        left: Math.round((position.x + cx) - (position.width / 2)),
        top: Math.round((position.y + cy) - (position.height / 2)),
        distance,
        angle,
        cx,
        cy,
    };
}

export default updatePosition;
