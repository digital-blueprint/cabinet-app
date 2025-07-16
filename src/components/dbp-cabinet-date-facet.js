import {debounce, formatDateForInput} from '../utils.js';

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
        const dateFacet = facets.find((facet) => facet.attribute === facetField);
        if (!dateFacet) return;
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
                const {instantSearchInstance} = initOptions;
                renderFn(
                    // The render state is the data provided to the render function,
                    // necessary to build the UI.
                    {
                        ...this.getWidgetRenderState(initOptions),
                        instantSearchInstance,
                    },
                    // Calling the function with `isFirstRender=true` lets you perform
                    // conditional logic in the render function.
                    true,
                );
            },
            render(renderOptions) {
                const {instantSearchInstance} = renderOptions;
                renderFn(
                    // The render state is the data provided to the render function,
                    // necessary to build the UI.
                    {
                        ...this.getWidgetRenderState(renderOptions),
                        instantSearchInstance,
                    },
                    // Calling the function with `isFirstRender=false` lets you perform
                    // conditional logic in the render function.
                    false,
                );
            },
            dispose(disposeOptions) {
                unmountFn();
            },
            getWidgetSearchParameters(searchParameters, {uiState}) {
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
    const datePicker = connectComplexDateRangeRefinement((options, isFirstRendering) => {
        if (!isFirstRendering) {
            // Update inputs when refinements change externally
            const {results} = options;
            if (results && results.state && results.state.numericRefinements) {
                const currentRefinements = results.state.numericRefinements[widgetParams.attribute];
                const startDateInput = widgetParams.container.querySelector('input.start-date');
                const endDateInput = widgetParams.container.querySelector('input.end-date');

                if (!startDateInput || !endDateInput) return;
                if (
                    currentRefinements &&
                    currentRefinements['>='] &&
                    currentRefinements['>='].length > 0
                ) {
                    const startTimestampMs = currentRefinements['>='][0] * 1000;
                    startDateInput.value = formatDateForInput(new Date(startTimestampMs));
                } else {
                    startDateInput.value = '';
                }
                if (
                    currentRefinements &&
                    currentRefinements['<='] &&
                    currentRefinements['<='].length > 0
                ) {
                    const endTimestampMs = currentRefinements['<='][0] * 1000;
                    endDateInput.value = formatDateForInput(new Date(endTimestampMs));
                } else {
                    endDateInput.value = '';
                }
            }
            return;
        }

        // ---- MAIN RENDER (first time) ----
        const {widgetParams, refine} = options;
        const isValidDateString = (dateStr) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

        // Helper: make date input + error msg
        function createDateSelector(type, attribute) {
            const input = document.createElement('input');
            input.type = 'date';
            input.classList.add(`${type}-date`);
            input.setAttribute('max', formatDateForInput(new Date()));

            const errorSpan = document.createElement('span');
            errorSpan.style.color = 'red';
            errorSpan.style.fontSize = '12px';
            errorSpan.style.display = 'none';
            errorSpan.textContent = 'Please enter a valid date (MM-DD-YYYY)';

            // Show error while typing
            input.addEventListener('input', () => {
                // If user typed more than 4 digits for year, trim
                // Chrome input is always in "YYYY-MM-DD"
                const val = input.value;
                const m = val.match(/^(\d{4,})-(\d{2})-(\d{2})$/);
                if (m && m[1].length > 4) {
                    // Limit year to 4 digits
                    input.value = `${m[1].slice(0, 4)}-${m[2]}-${m[3]}`;
                }
                if (input.value && !isValidDateString(input.value)) {
                    errorSpan.style.display = '';
                } else {
                    errorSpan.style.display = 'none';
                }
            });

            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'flex-start';
            wrapper.appendChild(input);
            wrapper.appendChild(errorSpan);
            return {wrapper, input};
        }

        // Make & mount the start/end date pickers
        const {wrapper: startDateWrapper, input: startDateInput} = createDateSelector(
            'start',
            widgetParams.attribute,
        );
        widgetParams.container.appendChild(startDateWrapper);
        const {wrapper: endDateWrapper, input: endDateInput} = createDateSelector(
            'end',
            widgetParams.attribute,
        );
        widgetParams.container.appendChild(endDateWrapper);

        // Debounced refine logic
        const debouncedRefineAndAttributeUpdate = debounce(() => {
            const startDateString = startDateInput.value;
            const endDateString = endDateInput.value;

            // Only run refine if both are blank, or valid full dates (independently)
            const canRefine =
                (startDateString === '' || isValidDateString(startDateString)) &&
                (endDateString === '' || isValidDateString(endDateString));

            if (!canRefine) {
                // Wait for more user input, do NOT refine or search
                return;
            }

            let startTimestamp = null;
            let endTimestamp = null;

            let selectedStartDateObj =
                startDateString && isValidDateString(startDateString)
                    ? startDateInput.valueAsDate
                    : null;
            let selectedEndDateObj =
                endDateString && isValidDateString(endDateString) ? endDateInput.valueAsDate : null;

            if (selectedStartDateObj && !isNaN(selectedStartDateObj.getTime())) {
                selectedStartDateObj.setUTCHours(0, 0, 0, 0);
                startTimestamp = selectedStartDateObj.getTime();
            }
            if (selectedEndDateObj && !isNaN(selectedEndDateObj.getTime())) {
                selectedEndDateObj.setUTCHours(23, 59, 59, 999);
                endTimestamp = selectedEndDateObj.getTime();
            }

            if (
                startTimestamp !== null ||
                endTimestamp !== null ||
                (startDateString === '' && endDateString === '')
            ) {
                refine([startTimestamp, endTimestamp]);
            }

            // Update min/max on fields
            const minDateForEndDate =
                selectedStartDateObj && !isNaN(selectedStartDateObj.getTime())
                    ? formatDateForInput(selectedStartDateObj)
                    : '';
            if (minDateForEndDate !== '') {
                endDateInput.setAttribute('min', minDateForEndDate);
            } else {
                endDateInput.removeAttribute('min');
            }

            const maxDateForStartDate =
                selectedEndDateObj && !isNaN(selectedEndDateObj.getTime())
                    ? formatDateForInput(selectedEndDateObj)
                    : '';
            if (maxDateForStartDate !== '') {
                startDateInput.setAttribute('max', maxDateForStartDate);
            } else {
                startDateInput.removeAttribute('max');
            }
        }, 120000);

        // Only listen to 'change' for triggering refine
        startDateInput.addEventListener('change', debouncedRefineAndAttributeUpdate);
        endDateInput.addEventListener('change', debouncedRefineAndAttributeUpdate);

        // Optionally, run on mount to set min/max for prefilled fields
        setTimeout(debouncedRefineAndAttributeUpdate, 0);

        // Pre-fill initial values from refinement
        const initialRefinements =
            options.results?.state?.numericRefinements?.[widgetParams.attribute];
        if (initialRefinements) {
            if (initialRefinements['>='] && initialRefinements['>='].length > 0) {
                const startTimestampMs = initialRefinements['>='][0] * 1000;
                startDateInput.value = formatDateForInput(new Date(startTimestampMs));
            }
            if (initialRefinements['<='] && initialRefinements['<='].length > 0) {
                const endTimestampMs = initialRefinements['<='][0] * 1000;
                endDateInput.value = formatDateForInput(new Date(endTimestampMs));
            }
        }
    });
    return datePicker(widgetParams);
}
