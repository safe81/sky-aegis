export function sweptCircleHit(start, end, center, radius) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const fx = start.x - center.x;
    const fy = start.y - center.y;
    const a = dx * dx + dy * dy;
    if (a <= Number.EPSILON)
        return fx * fx + fy * fy <= radius * radius ? 0 : null;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0)
        return null;
    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);
    if (t1 >= 0 && t1 <= 1)
        return t1;
    if (t2 >= 0 && t2 <= 1)
        return t2;
    return null;
}
