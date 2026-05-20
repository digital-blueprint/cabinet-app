export class CabinetSettings {
    constructor() {
        this._userId = null;
    }

    setAuth(auth) {
        this._userId = auth?.['user-id'] || null;
    }

    get #prefix() {
        if (!this._userId) {
            throw new Error('CabinetSettings: no user-id set');
        }
        return `dbp-cabinet:${this._userId}:`;
    }

    /**
     * Load a value from localStorage under this user's namespace.
     * Returns null if the key doesn't exist.
     * Throws if no user-id is set.
     * @param {string} key
     * @returns {*|null}
     */
    get(key) {
        const raw = localStorage.getItem(this.#prefix + key);
        if (raw === null) {
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.warn(`CabinetSettings: failed to parse value for key "${key}"`, e);
            return null;
        }
    }

    /**
     * Save a value to localStorage under this user's namespace.
     * Throws if no user-id is set.
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
        localStorage.setItem(this.#prefix + key, JSON.stringify(value));
    }
}
