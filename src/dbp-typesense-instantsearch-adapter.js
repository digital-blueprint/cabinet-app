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
        let originalFacetNames = instantsearchRequests[0].params.facets;

        if (this.allowFacetByFacetNameRemoval) {
            // Override originalFacetNames in case overrideFacetByData is enabled
            originalFacetNames = originalFacetNames.filter(
                (item) => !this.removedFacetNames.includes(item),
            );
            instantsearchRequests[0].params.facets = originalFacetNames;
        }

        var typesenseResponse = await super._adaptAndPerformTypesenseRequest(instantsearchRequests);

        return typesenseResponse;
    }
}
