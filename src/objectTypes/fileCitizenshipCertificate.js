import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';
import * as formElements from './formElements.js';

export default class extends BaseObject {
    name = 'file-cabinet-citizenshipCertificate';

    /**
     * @returns {string}
     */
    getFormComponent() {
        return CabinetFormElement;
    }

    getHitComponent() {
        return CabinetHitElement;
    }

    getViewComponent() {
        return CabinetViewElement;
    }
}

class CabinetFormElement extends BaseFormElement {
    render() {
        console.log('-- Render CabinetFormElement --');

        return html`
            <form>
                <h2>fileCitizenshipCertificate Form</h2>
                lang: ${this.lang}<br />
                ${formElements.stringElement('file-cabinet-citizenshipCertificate:comment', 'Comment', '', false, 5)}
                ${this.getButtonRowHtml()}
            </form>
        `;
    }
}

class CabinetHitElement extends BaseHitElement {
    static get styles() {
        // language=css
        return css`
            ${super.styles}

            h2 {
                color: #d55e6b;
            }
        `;
    }
    render() {
        return html`
            <form>
                <h2>fileCitizenshipCertificate</h2>
                lang: ${this.lang}<br />
                filename: ${this.data.file.base.fileName}<br />
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        return html`
            <h2>Citizenship Certificate</h2>
            lang: ${this.lang}<br />
            filename: ${this.data.file.base.fileName}<br />
        `;
    }
}
