'use strict';

import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import {CabinetFacets} from './components/dbp-cabinet-facets.js';

export default class DbpTypesenseInstantsearchAdapter extends TypesenseInstantSearchAdapter {
    /** @type {CabinetFacets} */
    facetComponent = null;

    facetConfigs = {};

    // Set this to true to override data in _adaptAndPerformTypesenseRequest
    overrideFacetByData = false;

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
        const originalFacetNames = instantsearchRequests[0].params.facets;
        if (this.overrideFacetByData) {
            // Override facet names with names of activated widgets
            instantsearchRequests[0].params.facets =
                this.facetComponent.gatherActivatedWidgetsFacetNames(
                    this.facetConfigs,
                    originalFacetNames,
                );
        }

        var typesenseResponse = await super._adaptAndPerformTypesenseRequest(instantsearchRequests);
        const facetCountsData = typesenseResponse.results[0].facet_counts;

        if (this.overrideFacetByData && facetCountsData) {
            // Fake data we didn't get
            typesenseResponse.results[0].facet_counts = this.generateFacetCountsData(
                facetCountsData,
                originalFacetNames,
            );
        }

        return typesenseResponse;
    }

    /**
     * Generate fake facet counts data for schema fields that we didn't get from Typesense,
     * because we didn't request it
     * @param facetCountsData
     * @param originalFacetNames
     * @returns {*}
     */
    generateFacetCountsData(facetCountsData, originalFacetNames) {
        const generatedFacetNames = this.facetComponent.gatherActivatedWidgetsFacetNames(
            this.facetConfigs,
            originalFacetNames,
        );
        const schemaFieldNames = Object.values(
            this.facetComponent.getSchemaFieldHash(this.facetConfigs),
        );

        // Iterate of all schema field names to add data we didn't get from Typesense
        schemaFieldNames.forEach((schemaFieldName) => {
            // We don't need to generate data we got from Typesense, or we didn't need in the first place
            if (
                generatedFacetNames.includes(schemaFieldName) ||
                !originalFacetNames.includes(schemaFieldName)
            ) {
                return;
            }

            // Generate data for the schema field name
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
