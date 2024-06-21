import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import {css, html} from 'lit';
import {createInstance} from '../i18n';
import * as commonStyles from '@dbp-toolkit/common/styles';

export default class {
    name = 'student';

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
        `;
    }

    render() {
        console.log('-- Render CabinetFormElement --');

        return html`
            <form>
                <h2>Student Form</h2>
                lang: ${this.lang}<br />
                user-id: ${this.userId}<br />
                <fieldset>
                    <legend>Firstname</legend>
                    <input type="text" id="firstname" name="firstname" value="${data['student-firstname']}" required>
                    <label for="firstname">Firstname</label>
                </fieldset>

                <fieldset>
                    <legend>Lastname</legend>
                    <input type="text" id="lastname" name="lastname" value="${data['student-lastname']}" required>
                    <label for="lastname">Lastname</label>
                </fieldset>

                <button type="submit">Submit</button>
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
                color: #1a9ece;
            }

            ${commonStyles.getGeneralCSS(false)}
        `;
    }

    render() {
        return html`
            <form>
                <h2>Student</h2>
                lang: ${this.lang}<br />
                firstname: ${this.data['student-firstname']}<br />
                lastname: ${this.data['student-lastname']}<br />
        `;
    }
}
