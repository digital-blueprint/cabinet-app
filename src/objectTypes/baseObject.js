import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import {css, html} from 'lit';
import {createInstance} from '../i18n';
import * as commonStyles from '@dbp-toolkit/common/styles';

export class BaseObject {
    name = 'baseObject';

    constructor() {
    }

    getFormComponent() {
        return BaseFormElement;
    }

    getHitComponent() {
        return BaseHitElement;
    }

    getViewComponent() {
        return BaseViewElement;
    }

    getInstantSearchConfig() {
        return {
            "data": "Generic settings for instantsearch"
        };
    }
}

export class BaseFormElement extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.userId = '';
        this.data = {};
    }

    static get scopedElements() {
        return {
        };
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            userId: {type: String, attribute: 'user-id'},
            data: {type: Object},
        };
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}
        `;
    }

    render() {
        console.log('-- Render BaseFormElement --');
        const data = this.data;

        return html`
            <form>
                <h2>${data.objectType}</h2>
                <button class="button is-primary" type="submit">Submit</button>
            </form>
        `;
    }
}

export class BaseHitElement extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.userId = '';
        this.data = {};
    }

    static get scopedElements() {
        return {
        };
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            userId: {type: String, attribute: 'user-id'},
            data: {type: Object},
        };
    }

    static get styles() {
        // language=css
        return css`
            h2 {
                margin: 0;
                font-size: 1.2em;
            }

            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}
        `;
    }

    render() {
        return html`
            <form>
                <h2>BaseHit</h2>
                lang: ${this.lang}<br />
        `;
    }
}

export class BaseViewElement extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.userId = '';
        this.data = {};
    }

    static get scopedElements() {
        return {
        };
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            userId: {type: String, attribute: 'user-id'},
            data: {type: Object},
        };
    }

    static get styles() {
        // language=css
        return css`
            h2 {
                margin: 0;
                font-size: 1.2em;
            }

            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}
        `;
    }

    render() {
        return html`
            <form>
                <h2>BaseView</h2>
                lang: ${this.lang}<br />
        `;
    }
}
