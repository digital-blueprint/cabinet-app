import {createInstance} from '../i18n.js';
// import {CabinetFacets} from '../components/dbp-cabinet-facets.js';

export default class {

    constructor() {
        this._i18n = createInstance();
        this.lang = this._i18n.language;
    }

    getFacetWidgets() {
        // const cabinetFacests = new CabinetFacets();
        // return [
        //     cabinetFacests.createPersonNationalitiesRefinementList(),
        // ];
        // return { "something" : "foo" };
    }
}