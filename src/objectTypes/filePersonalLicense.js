import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import {css, html} from 'lit';
import {createInstance} from '../i18n';
import * as commonStyles from '@dbp-toolkit/common/styles';

export default class {
    name = 'filePersonalLicense';

    constructor() {
    }

    /**
     * @returns {string}
     */
    getFormComponent() {
        return CabinetFormElement;
    }

    getHitComponent() {
        return CabinetHitElement;
    }

    getInstantSearchConfig() {
        return {
            "data": "Settings for instantsearch"
        };
    }
}

class CabinetFormElement extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.userId = '';
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
        console.log('-- Render CabinetFormElement --');

        return html`
            <form>
                <h2>filePersonalLicense Form</h2>
                lang: ${this.lang}<br />
                user-id: ${this.userId}<br />
                <fieldset>
                    <legend>About</legend>
                    <input type="text" id="about" name="about" required>
                    <label for="about">About</label>
                </fieldset>
                <button class="button is-primary" type="submit">Submit</button>
            </form>
        `;
    }
}

class CabinetHitElement extends ScopedElementsMixin(DBPLitElement) {
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
                color: #8e24e0;
            }

            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}
        `;
    }

    render() {
        return html`
            <form>
                <h2>filePersonalLicense</h2>
                lang: ${this.lang}<br />
                filename: ${this.data['file-filename']}<br />
        `;
    }
}
