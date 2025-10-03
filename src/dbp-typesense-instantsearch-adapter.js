import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import {CabinetFacets} from './components/dbp-cabinet-facets.js';

// rollup and rolldown resolve the import differently
let TypesenseInstantSearchAdapterClass =
    TypesenseInstantSearchAdapter.default ?? TypesenseInstantSearchAdapter;

export default class DbpTypesenseInstantsearchAdapter extends TypesenseInstantSearchAdapterClass {
    /** @type {CabinetFacets} */
    facetComponent = null;

    facetConfigs = {};

    removedFacetNames = ['person.person'];
    facetsThatNeedGrouping = [
        'study.name',
        'study.type',
        'study.status.text',
        'study.status.textEn',
    ];

    /**
     * @param {CabinetFacets} facetComponent
     */
    setFacetComponent(facetComponent) {
        this.facetComponent = facetComponent;
    }

    setFacetConfigs(facetConfigs) {
        this.facetConfigs = facetConfigs;
    }

    _removeFacets(instantsearchRequests) {
        // Remove facets for which we don't need any data
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

    _customGrouping(instantsearchRequests) {
        // In case we only have facets that don't need grouping we can replace it
        // with a simple filter_by on a per request basis. And in case none of them
        // need grouping we can remove the group_by parameter completely.
        let needGrouping = false;
        for (const request of instantsearchRequests) {
            const hasGroupingFacets = this.facetsThatNeedGrouping.some((item) =>
                request.params.facets.includes(item),
            );
            if (!hasGroupingFacets) {
                if (request.params.filters) {
                    request.params.filters += ' && isPrimary:true';
                } else {
                    request.params.filters = 'isPrimary:true';
                }
            } else {
                needGrouping = true;
            }
        }

        // XXX: this is hacky, and depends on us re-initializing the adapter
        // on facet changes. Ideally we would not change the global configuration
        // but rather pass the grouping parameter to the request.
        if (!needGrouping) {
            this.configuration.additionalSearchParameters.group_by = undefined;
            this.configuration.additionalSearchParameters.group_limit = undefined;
            this.configuration.additionalSearchParameters.group_missing_values = undefined;
        }
    }

    async _adaptAndPerformTypesenseRequest(instantsearchRequests) {
        this._removeFacets(instantsearchRequests);
        this._customGrouping(instantsearchRequests);
        return super._adaptAndPerformTypesenseRequest(instantsearchRequests);
    }
}
