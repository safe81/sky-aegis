import { PLAYFIELD_WIDTH, VIEWPORT_WIDTH } from "../constants.js";
export const CAMERA_SIDE_MARGIN = 190;
function clampCameraX(x, worldWidth = PLAYFIELD_WIDTH, viewportWidth = VIEWPORT_WIDTH) {
    return Math.max(0, Math.min(Math.max(0, worldWidth - viewportWidth), x));
}
export function initialCameraX(playerX, worldWidth = PLAYFIELD_WIDTH, viewportWidth = VIEWPORT_WIDTH) {
    return clampCameraX(playerX - viewportWidth / 2, worldWidth, viewportWidth);
}
export function updateHorizontalCamera(playerX, currentX, worldWidth = PLAYFIELD_WIDTH, viewportWidth = VIEWPORT_WIDTH, sideMargin = CAMERA_SIDE_MARGIN) {
    const safeLeft = currentX + sideMargin;
    const safeRight = currentX + viewportWidth - sideMargin;
    if (playerX < safeLeft)
        return clampCameraX(playerX - sideMargin, worldWidth, viewportWidth);
    if (playerX > safeRight)
        return clampCameraX(playerX - (viewportWidth - sideMargin), worldWidth, viewportWidth);
    return clampCameraX(currentX, worldWidth, viewportWidth);
}
export function worldToScreenX(worldX, cameraX) { return worldX - cameraX; }
