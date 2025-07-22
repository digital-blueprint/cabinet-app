import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import {CabinetFacets} from './components/dbp-cabinet-facets.js';

export default class DbpTypesenseInstantsearchAdapter extends TypesenseInstantSearchAdapter {
    /** @type {CabinetFacets} */
    facetComponent = null;

    facetConfigs = {};

    // Set this to true to allow removing facet names from the request
    allowFacetByFacetNameRemoval = true;
    removedFacetNames = ['person.person'];

    /**
     * @param {CabinetFacets} facetComponent
     */
    setFacetComponent(facetComponent) {
        this.facetComponent = facetComponent;
    }

    setFacetConfigs(facetConfigs) {
        this.facetConfigs = facetConfigs;
    }

    async _adaptAndPerformTypesenseRequest(instantsearchRequests) {
        if (this.allowFacetByFacetNameRemoval) {
            // Override originalFacetNames in case overrideFacetByData is enabled
            for (const request of instantsearchRequests) {
                let originalFacetNames = request.params.facets;
                // facets can be undefined a string or an array
                if (Array.isArray(originalFacetNames)) {
                    originalFacetNames = originalFacetNames.filter(
                        (item) => !this.removedFacetNames.includes(item),
                    );
                    request.params.facets = originalFacetNames;
                }
            }
        }

        return super._adaptAndPerformTypesenseRequest(instantsearchRequests);
    }
}
