
const getRefinedState = function getRefinedState(helper, attribute, value) {
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
};

/**
 *
 * @param {object} res - object containing results and state information
 * @param {Array} facets - array of facets config objects
 */
export function updateDatePickersForExternalRefinementChange(res, facets) {
    Object.entries(res.state.numericRefinements).forEach(([facetField, numRefinement]) => {
        const dateFacet = facets.find(facet => facet.attribute === facetField);

        // Clear start dates if refinement is removed
        if ('>=' in numRefinement && numRefinement['>='].length === 0) {
            const startDate = dateFacet.container.querySelector('input.start-date');
            if (startDate) {
                startDate.value = '';
            }
        }

        // Clear end dates if refinement is removed
        if ('<=' in numRefinement && numRefinement['<='].length === 0) {
            const endDate = dateFacet.container.querySelector('input.end-date');
            if (endDate) {
                endDate.value = '';
            }
        }
    });
}

function connectComplexDateRangeRefinement(renderFn, unmountFn = noop) {
    return function complexDateRangeRefinement(widgetParams) {
        const connectorState = {};
        const { attribute } = widgetParams;

        const dateFacet =  {
            $$type: 'cabinet.complexDateRangeRefinement',
            getWidgetRenderState({ results, helper }) {
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
                    return { items: [], refine: connectorState.refine, widgetParams };
                }
                return {
                    items: results.hits,
                    // A function to toggle a value when selected.
                    // If the value is already excluded, the exclusion is unset.
                    // Otherwise, it's added to the exclusion list.
                    // Then, a search is triggered.
                    refine: connectorState.refine,
                    widgetParams,
                };
            },
            getRenderState(renderState, renderOptions) {
                // The global render state is merged with a new one to store the render
                // state of the current widget.
                // console.log('getRenderState renderState', renderState);
                // console.log('getRenderState renderOptions', renderOptions);
                return {
                    ...renderState,
                    complexDateRangeRefinement: {
                        ...renderState.complexDateRangeRefinement,
                        // You can use multiple `negativeRefinementList` widgets in a single
                        // app so you need to register each of them separately.
                        // Each `complexDateRangeRefinement` widget's render state is stored
                        // by the `attribute` it impacts.
                        [attribute]: this.getWidgetRenderState(renderOptions),
                    },
                };
            },
            init(initOptions) {
                const { instantSearchInstance } = initOptions;

                renderFn(
                    // The render state is the data provided to the render function,
                    // necessary to build the UI.
                    {
                        ...this.getWidgetRenderState(initOptions),
                        instantSearchInstance,
                    },
                    // Calling the function with `isFirstRender=true` lets you perform
                    // conditional logic in the render function.
                    true
                );
            },
            render(renderOptions) {
                const { instantSearchInstance } = renderOptions;

                renderFn(
                    // The render state is the data provided to the render function,
                    // necessary to build the UI.
                    {
                        ...this.getWidgetRenderState(renderOptions),
                        instantSearchInstance,
                    },
                    // Calling the function with `isFirstRender=false` lets you perform
                    // conditional logic in the render function.
                    false
                );
            },
            dispose(disposeOptions) {
                unmountFn();
            },
            getWidgetSearchParameters(searchParameters, { uiState }) {
                // return searchParameters.addDisjunctiveFacetRefinement(
                //     'myAttribute',
                //     uiState.myWidgetName.myAttribute
                // );
                return searchParameters;
            },
        };

        return dateFacet;
    };
}

const noop = () => {};

export function createDateRefinement(widgetParams) {
    const datePicker = connectComplexDateRangeRefinement(
        (options, isFirstRendering) => {
            if (!isFirstRendering) return;

            const { widgetParams, refine } = options;

            let updateRefinement = () => {
                // Convert date to timestamp in seconds (UTC)
                let startDate, endDate = null;
                // Don't allow end date to be before start date
                if (startDateSelector.value !== "") {
                    startDate = startDateSelector.value + 'T00:00:00.000Z';
                    const minDate = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(startDate));
                    endDateSelector.setAttribute('min', minDate);
                }
                // Don't allow start date to be before end date
                if (endDateSelector.value !== "") {
                    endDate = endDateSelector.value + 'T23:59:59.000Z';
                    const maxDate = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date(startDate));
                    startDateSelector.setAttribute('max', maxDate);
                }
                const startTimestamp = Date.parse(startDate) || null;
                const endTimestamp = Date.parse(endDate) || null;

                refine([startTimestamp, endTimestamp]);
            };

            function createDateSelector(type, attribute) {
                const dateSelector = document.createElement('input');
                dateSelector.type = 'date';
                const kebabAttribute = schemaNameToKebabCase(attribute);
                const id = `${type}-date-${kebabAttribute}`;
                dateSelector.setAttribute('id', id);
                dateSelector.classList.add(`${type}-date`);
                // Set max date to today as a iso date string in local time
                const maxDate = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
                dateSelector.setAttribute('max', maxDate);
                dateSelector.addEventListener('change', updateRefinement);

                return dateSelector;
            }

            const startDateSelector = createDateSelector('start', widgetParams.attribute);
            widgetParams.container.appendChild(startDateSelector);

            const endDateSelector = createDateSelector('end', widgetParams.attribute);
            widgetParams.container.appendChild(endDateSelector);
        }
    );
    return datePicker(widgetParams);
}

/**
 * Convert a Date object to a timestamp in seconds.
 * @param {Date} date - The Date object to be processed.
 * @returns {number|null} The processed date in seconds.
 */
// function dateToTimestamp(date) {
//     let milli = date.getTime();
//     if (isNaN(milli)) {
//         return null;
//     }
//     return Math.floor(milli / 1000.0);
// }

/**
 * Convert schema name to kebabCase for css classes and translation keys
 * @param input {string}
 * @returns {string}
 */
function schemaNameToKebabCase(input) {
    return input
        .split('.')
        .map((part) => part.replace(/([A-Z])/g, '-$1').toLowerCase())
        .join('-');
}
