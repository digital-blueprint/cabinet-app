'use strict';

import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import {SearchRequestAdapter} from 'typesense-instantsearch-adapter/lib/SearchRequestAdapter.js';
import {CabinetFacets} from './components/dbp-cabinet-facets.js';
import {mergeNestedConditions} from './utils.js';

class CustomSearchRequestAdapter extends SearchRequestAdapter {
    // When filtering on facets of nested objects we want to merge the conditions
    // So all the conditions need to be true for one specific nested object
    _buildSearchParameters(instantsearchRequest) {
        let result = super._buildSearchParameters(instantsearchRequest);
        result.filter_by = mergeNestedConditions('studies', result.filter_by);
        console.log(result.filter_by);
        return result;
    }
}

export default class DbpTypesenseInstantsearchAdapter extends TypesenseInstantSearchAdapter {
    /** @type {CabinetFacets} */
    facetComponent = null;

    facetConfigs = {};

    // Set this to true to override data in _adaptAndPerformTypesenseRequest
    overrideData = true;

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
        if (this.overrideData) {
            // Override facet names with names of activated widgets
            instantsearchRequests[0].params.facets =
                this.facetComponent.gatherActivatedWidgetsFacetNames(this.facetConfigs);
        }

        const requestAdapter = new CustomSearchRequestAdapter(
            instantsearchRequests,
            this.typesenseClient,
            this.configuration,
        );
        const typesenseResponse = await requestAdapter.request();

        if (this.overrideData) {
            // Fake data we didn't get
            typesenseResponse.results[0].facet_counts = this.generateFacetCountsData(
                typesenseResponse.results[0].facet_counts,
            );
        }

        return typesenseResponse;
    }

    /**
     * Generate fake facet counts data for schema fields that we didn't get from Typesense,
     * because we didn't request it
     * @param facetCountsData
     * @returns {*}
     */
    generateFacetCountsData(facetCountsData) {
        const facetNames = this.facetComponent.gatherActivatedWidgetsFacetNames(this.facetConfigs);
        const schemaFieldNames = Object.values(
            this.facetComponent.getSchemaFieldHash(this.facetConfigs),
        );

        // Iterate of all schema field names to add data we didn't get from Typesense
        schemaFieldNames.forEach((schemaFieldName) => {
            // We don't need to generate data we got from Typesense
            if (facetNames.includes(schemaFieldName)) {
                return;
            }

            // Generate data for this schema field name
            facetCountsData.push({
                field_name: schemaFieldName,
                counts: [{}],
                sampled: false,
                stats: {
                    total_values: 1,
                },
            });
        });

        return facetCountsData;
    }
}
