import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';
import * as formElements from './formElements.js';

export default class extends BaseObject {
    name = 'file-cabinet-letter';

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
                <h2>Letter Form</h2>
                lang: ${this.lang}<br />
                ${formElements.stringElement('file.letter.sender.givenName', 'Sender given name', '')}
                ${formElements.stringElement('file.letter.sender.familyName', 'Sender family name', '')}
                ${formElements.stringElement('file.letter.sender.worksFor.legalName', 'Works for legal name', '')}
                ${formElements.stringElement('file.communication.abstract', 'Abstract', '', false, 10)}
                ${formElements.stringElement('file-cabinet-letter:comment', 'Comment', '', false, 5)}
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
                color: #f5ab53;
            }
        `;
    }

    render() {
        return html`
            <form>
                <h2>Letter</h2>
                lang: ${this.lang}<br />
                filename: ${this.data.file.base.fileName}<br />
                filesize: ${this.data.filesize}<br />
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        return html`
            <h2>Letter</h2>
            lang: ${this.lang}<br />
            filename: ${this.data.file.base.fileName}<br />
        `;
    }
}
