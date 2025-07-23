import {html, css} from 'lit-element';
import {LangMixin} from '@dbp-toolkit/common';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element.js';
import {createInstance} from '../i18n.js';
import * as commonStyles from '@dbp-toolkit/common/styles';

function getRefinedState(helper, attribute, value) {
    const startDate = value[0];
    const endDate = value[1];

    let resolvedState = helper.state;
    resolvedState = resolvedState.removeNumericRefinement(attribute);

    if (startDate !== null) {
        const startDateTimestamp = Math.round(startDate / 1000);
        resolvedState = resolvedState.addNumericRefinement(attribute, '>=', startDateTimestamp);
    }

    if (endDate !== null) {
        const endDateTimestamp = Math.round(endDate / 1000);
        resolvedState = resolvedState.addNumericRefinement(attribute, '<=', endDateTimestamp);
    }

    return resolvedState;
}

/**
 * Safely formats a Date object into DD-MM-YYYY string for input[type="date"] min/max attributes.
 * Returns an empty string for invalid/null Date objects.
 * @param {Date} dateObj - The Date object to format.
 * @returns {string} The formatted date string (YYYY-MM-DD) or empty string.
 */
function formatDateForInput(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) {
        return '';
    }
    return dateObj.toISOString().split('T')[0];
}

/**
 * A web component for selecting and refining a date range.
 */
export class DateRangeRefinement extends LangMixin(DBPLitElement, createInstance) {
    constructor() {
        super();
        this.refinementRenderOptions = {};
        this.startDateValue = '';
        this.endDateValue = '';
        this.startDateMax = '';
        this.endDateMin = '';
    }

    static get properties() {
        return {
            refinementRenderOptions: {type: Object},
            startDateValue: {type: String},
            endDateValue: {type: String},
            startDateMax: {type: String},
            endDateMin: {type: String},
        };
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
                    .value=${this.startDateValue}
                    max=${this.startDateMax}
                    @change=${this._handleStartDateChange} />
            </div>

            <div class="date-wrapper">
                <input
                    type="date"
                    class="date-input end-date"
                    .value=${this.endDateValue}
                    min=${this.endDateMin}
                    @change=${this._handleEndDateChange} />
            </div>
        `;
    }

    _updateFromRefinements() {
        if (!this.refinementRenderOptions?.results?._state?.numericRefinements) return;

        const {results, widgetParams} = this.refinementRenderOptions;
        const refinements = results._state.numericRefinements[widgetParams?.attribute];

        if (!refinements) {
            this.startDateValue = '';
            this.endDateValue = '';
            this._updateConstraints();
            return;
        }

        if (refinements['>='] && refinements['>='].length > 0) {
            const startTimestampMs = refinements['>='][0] * 1000;
            this.startDateValue = formatDateForInput(new Date(startTimestampMs));
        } else {
            this.startDateValue = '';
        }

        if (refinements['<='] && refinements['<='].length > 0) {
            const endTimestampMs = refinements['<='][0] * 1000;
            this.endDateValue = formatDateForInput(new Date(endTimestampMs));
        } else {
            this.endDateValue = '';
        }

        this._updateConstraints();
    }

    _handleStartDateChange(e) {
        this.startDateValue = e.target.value;
        this._updateConstraints();
        this._refine();
    }

    _handleEndDateChange(e) {
        this.endDateValue = e.target.value;
        this._updateConstraints();
        this._refine();
    }

    _updateConstraints() {
        // Update end date minimum based on start date
        if (this.startDateValue) {
            this.endDateMin = this.startDateValue;
        } else {
            this.endDateMin = '';
        }

        // Update start date maximum based on end date
        if (this.endDateValue) {
            this.startDateMax = this.endDateValue;
        } else {
            this.startDateMax = '';
        }
    }

    _refine() {
        if (!this.refinementRenderOptions?.refine) return;

        let startTimestamp = null;
        let endTimestamp = null;

        if (this.startDateValue) {
            const startDateObj = new Date(this.startDateValue + 'T00:00:00.000Z');
            startDateObj.setUTCHours(0, 0, 0, 0);
            startTimestamp = startDateObj.getTime();
        }

        if (this.endDateValue) {
            const endDateObj = new Date(this.endDateValue + 'T00:00:00.000Z');
            endDateObj.setUTCHours(23, 59, 59, 999);
            endTimestamp = endDateObj.getTime();
        }

        this.refinementRenderOptions.refine([startTimestamp, endTimestamp]);
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
