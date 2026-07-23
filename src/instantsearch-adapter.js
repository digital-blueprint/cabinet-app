import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';

// rollup and rolldown resolve the import differently
let TypesenseInstantSearchAdapterClass =
    TypesenseInstantSearchAdapter.default ?? TypesenseInstantSearchAdapter;

export default class DbpTypesenseInstantsearchAdapter extends TypesenseInstantSearchAdapterClass {
    facetConfigs = {};

    // Maps a faceted attribute (e.g. `person.gender.textEn`) to a map of
    // display value -> parent object (holding each language's sibling value),
    // collected from the `facet_return_parent` data in the Typesense facet
    // response. Used to translate selected facet values across languages.
    facetParentByValue = {};

    facetsThatNeedGrouping = [
        'study.name',
        'study.type',
        'study.status.text',
        'study.status.textEn',
    ];

    setFacetConfigs(facetConfigs) {
        this.facetConfigs = facetConfigs;
    }

    _removeFacets(instantsearchRequests) {
        let removedFacetNames = [];
        for (let config of this.facetConfigs) {
            if (config.hidden) {
                removedFacetNames.push(config.schemaField);
            }
        }

        // Remove facets for which we don't need any data because they are hidden.
        for (const request of instantsearchRequests) {
            let originalFacetNames = request.params.facets;
            // facets can be undefined a string or an array
            if (Array.isArray(originalFacetNames)) {
                originalFacetNames = originalFacetNames.filter(
                    (item) => !removedFacetNames.includes(item),
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
        const response = await super._adaptAndPerformTypesenseRequest(instantsearchRequests);
        this._collectFacetParentKeys(response);
        return response;
    }

    // Capture the parent object exposed via facet_return_parent from the raw
    // Typesense response, before the response adapter drops it, keyed by
    // attribute and display value.
    _collectFacetParentKeys(response) {
        const results = response?.results ?? (response ? [response] : []);
        for (const result of results) {
            for (const facet of result?.facet_counts ?? []) {
                for (const count of facet.counts ?? []) {
                    if (!count.parent) {
                        continue;
                    }
                    const byValue = (this.facetParentByValue[facet.field_name] ??= {});
                    byValue[count.value] = count.parent;
                }
            }
        }
    }

    /**
     * Translates a facet value selected under `fromAttribute` to the equivalent
     * value under `toAttribute`, using the collected parent objects. Both
     * attributes must be sibling leaves of the same parent object (e.g.
     * `<parent>.text` and `<parent>.textEn`); the target value is read from the
     * parent property named by the last path segment of `toAttribute`. Returns
     * null if no mapping is known.
     * @param {string} fromAttribute
     * @param {string} toAttribute
     * @param {string} value
     * @returns {string|null}
     */
    translateFacetValue(fromAttribute, toAttribute, value) {
        console.log('translateFacetValue', this.facetParentByValue);
        const parent = this.facetParentByValue[fromAttribute]?.[value];
        if (!parent) {
            return null;
        }
        const toField = toAttribute.split('.').pop();
        return parent[toField] ?? null;
    }
}
