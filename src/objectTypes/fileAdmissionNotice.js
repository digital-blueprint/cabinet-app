import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';
import * as formElements from './formElements.js';

export default class extends BaseObject {
    name = 'file-admission-notice';

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
        console.log('this.data', this.data);
        // const data = this.data;

        return html`
            <form>
                <h2>admissionNotice Form</h2>
                ${formElements.stringElement('sender[givenName]', 'Sender given name', '')}
                ${formElements.stringElement('sender[familyName]', 'Sender family name', '')}
                ${formElements.stringElement('sender[email]', 'Sender email', '')}
                ${formElements.stringElement('comment', 'Comment', '', false, 5)}
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
                color: #2baff5;
            }
        `;
    }

    render() {
        return html`
            <form>
                <h2>Email</h2>
                lang: ${this.lang}<br />
                filename: ${this.data.file.base.fileName}<br />
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        return html`
            <h2>Email</h2>
            lang: ${this.lang}<br />
            filename: ${this.data.file.base.fileName}<br />
        `;
    }
}
