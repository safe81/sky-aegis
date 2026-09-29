export function classifyPointerPurpose(action, command, interactive=false) {
    if (command || (interactive && !action))
        return 'ui';
    if (action === 'ability' || action === 'tactical' || action === 'pause')
        return action;
    return 'move';
}
export class PointerController {
    movementPointerId = null;
    lastX = 0;
    lastY = 0;
    dx = 0;
    dy = 0;
    actions = new Set();
    actionOwners = new Map();
    element = null;
    disposers = [];
    keyboard = { left: false, right: false, up: false, down: false };
    pointerDown(id, x, y, purpose = 'move') {
        if (purpose === 'ui')
            return;
        if (purpose === 'move') {
            if (this.movementPointerId === null) {
                this.movementPointerId = id;
                this.lastX = x;
                this.lastY = y;
                this.dx = 0;
                this.dy = 0;
            }
            return;
        }
        this.actionOwners.set(id, purpose);
        this.actions.add(purpose);
    }
    pointerMove(id, x, y) {
        if (id !== this.movementPointerId)
            return;
        this.dx += x - this.lastX;
        this.dy += y - this.lastY;
        this.lastX = x;
        this.lastY = y;
    }
    pointerUp(id) {
        if (id === this.movementPointerId) {
            this.movementPointerId = null;
            this.dx = 0;
            this.dy = 0;
        }
        this.actionOwners.delete(id);
    }
    pointerCancel(id) {
        this.pointerUp(id);
    }
    consumeMovement() {
        let { dx, dy } = this;
        this.dx = 0;
        this.dy = 0;
        const keyboardSpeed = 18;
        if (this.keyboard.left)
            dx -= keyboardSpeed;
        if (this.keyboard.right)
            dx += keyboardSpeed;
        if (this.keyboard.up)
            dy -= keyboardSpeed;
        if (this.keyboard.down)
            dy += keyboardSpeed;
        return { dx, dy };
    }
    consumeAction(id) {
        const hit = this.actions.has(id);
        this.actions.delete(id);
        return hit;
    }
    attach(element) {
        this.dispose();
        this.element = element;
        const purposeFor = (target) => {
            if (!(target instanceof HTMLElement))
                return 'move';
            const action = target.closest('[data-action]')?.dataset.action;
            const command = target.closest('[data-cmd]')?.dataset.cmd;
            const interactive=Boolean(target.closest('button,input,select,textarea,a,[role="button"],.pause-overlay'));
            return classifyPointerPurpose(action, command, interactive);
        };
        const onDown = (event) => {
            const purpose = purposeFor(event.target);
            if (purpose === 'ui')
                return;
            if (purpose === 'move') {
                try {
                    element.setPointerCapture(event.pointerId);
                }
                catch { /* optional */ }
            }
            this.pointerDown(event.pointerId, event.clientX, event.clientY, purpose);
        };
        const onMove = (event) => this.pointerMove(event.pointerId, event.clientX, event.clientY);
        const onUp = (event) => this.pointerUp(event.pointerId);
        const onCancel = (event) => this.pointerCancel(event.pointerId);
        element.addEventListener('pointerdown', onDown);
        element.addEventListener('pointermove', onMove);
        element.addEventListener('pointerup', onUp);
        element.addEventListener('pointercancel', onCancel);
        this.disposers.push(() => element.removeEventListener('pointerdown', onDown));
        this.disposers.push(() => element.removeEventListener('pointermove', onMove));
        this.disposers.push(() => element.removeEventListener('pointerup', onUp));
        this.disposers.push(() => element.removeEventListener('pointercancel', onCancel));
        const onKeyDown = (event) => {
            if (event.code === 'ArrowLeft' || event.code === 'KeyA')
                this.keyboard.left = true;
            if (event.code === 'ArrowRight' || event.code === 'KeyD')
                this.keyboard.right = true;
            if (event.code === 'ArrowUp' || event.code === 'KeyW')
                this.keyboard.up = true;
            if (event.code === 'ArrowDown' || event.code === 'KeyS')
                this.keyboard.down = true;
            if (event.code === 'Space')
                this.actions.add('ability');
            if (event.code === 'KeyB')
                this.actions.add('tactical');
            if (event.code === 'Escape')
                this.actions.add('pause');
        };
        const onKeyUp = (event) => {
            if (event.code === 'ArrowLeft' || event.code === 'KeyA')
                this.keyboard.left = false;
            if (event.code === 'ArrowRight' || event.code === 'KeyD')
                this.keyboard.right = false;
            if (event.code === 'ArrowUp' || event.code === 'KeyW')
                this.keyboard.up = false;
            if (event.code === 'ArrowDown' || event.code === 'KeyS')
                this.keyboard.down = false;
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        this.disposers.push(() => window.removeEventListener('keydown', onKeyDown));
        this.disposers.push(() => window.removeEventListener('keyup', onKeyUp));
    }
    dispose() {
        for (const fn of this.disposers.splice(0))
            fn();
        this.element = null;
        this.movementPointerId = null;
        this.dx = 0;
        this.dy = 0;
        this.actions.clear();
        this.actionOwners.clear();
        this.keyboard = { left: false, right: false, up: false, down: false };
    }
}
