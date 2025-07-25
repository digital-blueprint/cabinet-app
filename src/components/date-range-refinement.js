import {html, css} from 'lit-element';
import {LangMixin} from '@dbp-toolkit/common';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element.js';
import {createInstance} from '../i18n.js';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {live} from 'lit/directives/live.js';

function debounce(func, delay) {
    let timerId;
    return function (...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => func.apply(this, args), delay);
    };
}

function getRefinedState(helper, attribute, value) {
    const startDate = value[0];
    const endDate = value[1];

    let resolvedState = helper.state;
    resolvedState = resolvedState.removeNumericRefinement(attribute);

    if (startDate !== null) {
        resolvedState = resolvedState.addNumericRefinement(attribute, '>=', startDate);
    }

    if (endDate !== null) {
        resolvedState = resolvedState.addNumericRefinement(attribute, '<=', endDate);
    }

    return resolvedState;
}

/**
 * Returns the unix timestamp representing the end of the (local time) day (23:59:59.999)
 * for the given date string.
 * @param {string} dateString - The date string in the format 'YYYY-MM-DD'
 * @returns {number} The timestamp
 */
function getLocalEndOfDayUnixTimestamp(dateString) {
    const date = new Date(dateString);
    date.setHours(23, 59, 59, 999);
    return Math.floor(date.getTime() / 1000);
}

/**
 * Returns the unix timestamp representing the end of the (UTC) day (23:59:59.999)
 * for the given date string.
 * @param {string} dateString - The date string in the format 'YYYY-MM-DD'
 * @returns {number} The timestamp
 */
function getUTCEndOfDayUnixTimestamp(dateString) {
    const date = new Date(dateString + 'T00:00:00.000Z');
    date.setUTCHours(23, 59, 59, 999);
    return Math.floor(date.getTime() / 1000);
}

/**
 * Returns the unix timestamp representing the start of the (local time) day (00:00:00.000)
 * for the given date string.
 * @param {string} dateString - The date string in the format 'YYYY-MM-DD'
 * @returns {number} The timestamp
 */
function getLocalStartOfDayUnixTimestamp(dateString) {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return Math.floor(date.getTime() / 1000);
}

/**
 * Returns the unix timestamp representing the start of the (UTC) day (00:00:00.000)
 * for the given date string.
 * @param {string} dateString - The date string in the format 'YYYY-MM-DD'
 * @returns {number} The timestamp
 */
function getUTCStartOfDayUnixTimestamp(dateString) {
    const date = new Date(dateString + 'T00:00:00.000Z');
    date.setUTCHours(0, 0, 0, 0);
    return Math.floor(date.getTime() / 1000);
}

/**
 * Converts a Unix timestamp (in seconds) to a date string in the format 'YYYY-MM-DD' in local time.
 * @param {number} unixTimestamp - The Unix timestamp in seconds.
 * @returns {string} The formatted date string in 'YYYY-MM-DD' format.
 */
function getLocalDateStringFromUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const year = String(date.getFullYear()).padStart(4, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Converts a Unix timestamp (in seconds) to a date string in the format 'YYYY-MM-DD' in UTC.
 * @param {number} unixTimestamp - The Unix timestamp in seconds.
 * @returns {string} The formatted date string in 'YYYY-MM-DD' format.
 */
function getUTCDateStringFromUnixTimestamp(unixTimestamp) {
    return new Date(unixTimestamp * 1000).toISOString().split('T')[0];
}

const DEBOUNCE_DELAY = 150;

/**
 * A web component for selecting and refining a date range.
 * if the widgetParam `inputIsUtc` is set to true, the date inputs will be treated as UTC,
 * otherwise they will be treated as local time.
 */
export class DateRangeRefinement extends LangMixin(DBPLitElement, createInstance) {
    constructor() {
        super();
        this.refinementRenderOptions = {};
        this._startDateValue = '';
        this._endDateValue = '';
        this._startDateMax = '';
        this._endDateMin = '';
        this._startFocused = false;
        this._endFocused = false;
        this._startManuallySet = false;
        this._endManuallySet = false;
        this._debounce = debounce((func, ...args) => {
            func(...args);
        }, DEBOUNCE_DELAY);
        this._debounceBlur = debounce((func, ...args) => {
            func(...args);
        }, DEBOUNCE_DELAY);
    }

    static get properties() {
        return {
            refinementRenderOptions: {type: Object},
            _startDateValue: {type: String, state: true},
            _endDateValue: {type: String, state: true},
            _startDateMax: {type: String, state: true},
            _endDateMin: {type: String, state: true},
        };
    }

    get _inputIsUtc() {
        // In case the visual date is in UTC you need to set this
        // (for example for the birthdate which is stored in UTC in the backend)
        return this.refinementRenderOptions?.widgetParams?.inputIsUtc ?? false;
    }

    static get styles() {
        return [
            commonStyles.getThemeCSS(),
            commonStyles.getGeneralCSS(false),
            css`
                :host {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .date-input {
                    padding: 0.5em;
                    border: var(--dbp-border);
                    border-radius: var(--dbp-border-radius);
                    color: var(--dbp-content);
                    background-color: var(--dbp-background);
                }

                ::-webkit-datetime-edit {
                    max-width: max-content;
                    padding-right: 0.5em;
                }

                ::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                }
            `,
        ];
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        if (changedProperties.has('refinementRenderOptions')) {
            this._updateFromRefinements();
        }
    }

    render() {
        return html`
            <div class="date-wrapper">
                <input
                    type="date"
                    class="date-input start-date"
                    .value=${live(this._startDateValue)}
                    max=${this._startDateMax}
                    @change=${(e) => this._handleDateChange(e, true)}
                    @focus=${(e) => this._handleFocus(e, true)}
                    @blur=${(e) => this._handleBlur(e, true)} />
            </div>

            <div class="date-wrapper">
                <input
                    type="date"
                    class="date-input end-date"
                    .value=${live(this._endDateValue)}
                    min=${this._endDateMin}
                    @change=${(e) => this._handleDateChange(e, false)}
                    @focus=${(e) => this._handleFocus(e, false)}
                    @blur=${(e) => this._handleBlur(e, false)} />
            </div>
        `;
    }

    _updateFromRefinements() {
        if (!this.refinementRenderOptions?.results?._state?.numericRefinements) return;

        const {results, widgetParams} = this.refinementRenderOptions;
        const refinements = results._state.numericRefinements[widgetParams.attribute];

        // In case the user is focused on the input, we ignore the refinements
        // updates to avoid overwriting the user's input.

        if (!this._startFocused) {
            if (refinements && refinements['>='] && refinements['>='].length > 0) {
                let startTimestamp = refinements['>='][0];
                if (this._inputIsUtc) {
                    this._startDateValue = getUTCDateStringFromUnixTimestamp(startTimestamp);
                } else {
                    this._startDateValue = getLocalDateStringFromUnixTimestamp(startTimestamp);
                }
            } else {
                this._startDateValue = '';
                this._startManuallySet = false;
            }
        }

        if (!this._endFocused) {
            if (refinements && refinements['<='] && refinements['<='].length > 0) {
                let endTimestamp = refinements['<='][0];
                if (this._inputIsUtc) {
                    this._endDateValue = getUTCDateStringFromUnixTimestamp(endTimestamp);
                } else {
                    this._endDateValue = getLocalDateStringFromUnixTimestamp(endTimestamp);
                }
            } else {
                this._endDateValue = '';
                this._endManuallySet = false;
            }
        }

        this._updateConstraints();
    }

    _handleFocus(e, isStart) {
        if (isStart) {
            this._startFocused = true;
        } else {
            this._endFocused = true;
        }
    }

    _handleBlur(e, isStart) {
        if (isStart) {
            this._startFocused = false;
            if (!this._endDateValue) {
                this._handleDateChange(e, false);
            }
        } else {
            this._endFocused = false;
            if (!this._startDateValue) {
                this._handleDateChange(e, true);
            }
        }
        // We ignore refinements updates when focused, and due to debouncing
        // those focused changes can come back after the blur event, so we have
        // to mirror the debounce logic here, to not re-apply outdated values
        // when the user blurs the input.
        this._debounceBlur(this._updateFromRefinements.bind(this));
    }

    _handleDateChange(e, isStart) {
        if (isStart) {
            this._startDateValue = e.target.value;
            this._startManuallySet = !!this._startDateValue && this._startFocused;
            if (!this._endManuallySet && this._startDateValue) {
                this._handleDateChange(e, false);
            }
        } else {
            this._endDateValue = e.target.value;
            this._endManuallySet = !!this._endDateValue && this._endFocused;
            if (!this._startManuallySet && this._endDateValue) {
                this._handleDateChange(e, true);
            }
        }
        this._updateConstraints();
        this._refine();
    }

    _updateConstraints() {
        // Changing min/max during editing breaks breaks the input in chrome
        // while typing, so avoid updating them while the user is focused.
        // We will update them on the next blur event instead.

        if (!this._endFocused) {
            // Update end date minimum based on start date
            if (this._startDateValue) {
                this._endDateMin = this._startDateValue;
            } else {
                this._endDateMin = '';
            }
        }

        if (!this._startFocused) {
            // Update start date maximum based on end date
            if (this._endDateValue) {
                this._startDateMax = this._endDateValue;
            } else {
                this._startDateMax = '';
            }
        }
    }

    _refine() {
        if (!this.refinementRenderOptions?.refine) return;

        let startTimestamp = null;
        let endTimestamp = null;

        if (this._startDateValue) {
            if (this._inputIsUtc) {
                startTimestamp = getUTCStartOfDayUnixTimestamp(this._startDateValue);
            } else {
                startTimestamp = getLocalStartOfDayUnixTimestamp(this._startDateValue);
            }
        }

        if (this._endDateValue) {
            if (this._inputIsUtc) {
                endTimestamp = getUTCEndOfDayUnixTimestamp(this._endDateValue);
            } else {
                endTimestamp = getLocalEndOfDayUnixTimestamp(this._endDateValue);
            }
        }

        this._debounce(this.refinementRenderOptions.refine, [startTimestamp, endTimestamp]);
    }
}

export function connectComplexDateRangeRefinement(renderFn, unmountFn = () => {}) {
    return function complexDateRangeRefinement(widgetParams) {
        const connectorState = {};
        const {attribute} = widgetParams;

        const dateFacet = {
            $$type: 'cabinet.complexDateRangeRefinement',

            getWidgetRenderState({results, helper}) {
                if (!connectorState.refine) {
                    connectorState.refine = (value) => {
                        let refinedState = getRefinedState(helper, attribute, value);
                        if (refinedState) {
                            helper.setState(refinedState).search();
                        }
                        return helper.search();
                    };
                }

                if (!results) {
                    return {items: [], refine: connectorState.refine, widgetParams};
                }

                return {
                    items: results.hits,
                    refine: connectorState.refine,
                    widgetParams,
                    results,
                };
            },

            getRenderState(renderState, renderOptions) {
                return {
                    ...renderState,
                    complexDateRangeRefinement: {
                        ...renderState.complexDateRangeRefinement,
                        [attribute]: this.getWidgetRenderState(renderOptions),
                    },
                };
            },

            init(initOptions) {
                const {instantSearchInstance} = initOptions;
                renderFn(
                    {
                        ...this.getWidgetRenderState(initOptions),
                        instantSearchInstance,
                    },
                    true, // isFirstRender
                );
            },

            render(renderOptions) {
                const {instantSearchInstance} = renderOptions;
                renderFn(
                    {
                        ...this.getWidgetRenderState(renderOptions),
                        instantSearchInstance,
                    },
                    false, // isFirstRender
                );
            },

            dispose(disposeOptions) {
                unmountFn();
            },

            getWidgetSearchParameters(searchParameters, {uiState}) {
                return searchParameters;
            },
        };

        return dateFacet;
    };
}
