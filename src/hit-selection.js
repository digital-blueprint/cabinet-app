export const HitSelectionType = {
    PERSON: 'Person',
    DOCUMENT_FILE: 'DocumentFile',
};

export const HitSelectionEventType = {
    HIT_SELECTION_CHANGED: 'hitSelectionChanged',
};

/**
 * Returns a fresh copy of the empty hit selection object.
 * Use this instead of a shared constant to avoid mutation issues.
 */
export function createEmptyHitSelection() {
    return {
        [HitSelectionType.PERSON]: {},
        [HitSelectionType.DOCUMENT_FILE]: {},
    };
}

/**
 * @param {EventTarget} element
 * @param {string} type - One of HitSelectionType values
 * @param {string} identifier
 * @param {boolean} state
 * @param {object|null} hit
 */
export function sendHitSelectionEvent(element, type, identifier, state, hit = null) {
    if (!Object.values(HitSelectionType).includes(type)) {
        throw new Error(
            `Invalid type: ${type}. Must be one of ${Object.values(HitSelectionType).join(', ')}`,
        );
    }

    const customEvent = new CustomEvent(HitSelectionEventType.HIT_SELECTION_CHANGED, {
        detail: {
            type: type,
            identifier: identifier,
            state: state,
            hit: hit,
        },
        bubbles: true,
        composed: true,
    });

    element.dispatchEvent(customEvent);
}
