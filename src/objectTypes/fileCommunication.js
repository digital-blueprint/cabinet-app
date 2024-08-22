import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';
import * as formElements from './formElements.js';

export default class extends BaseObject {
    name = 'file-cabinet-communication';

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

const getAdditionalTypes = () => {
    return {
        'Communication': 'Communication',
    };
};

class CabinetFormElement extends BaseFormElement {
    render() {
        console.log('-- Render CabinetFormElement --');

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/communication.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/communication_example.json
        return html`
            <form>
                <h2>Communication Form</h2>
                lang: ${this.lang}<br />
                ${formElements.stringElement('agent[givenName]', 'Given name', '')}
                ${formElements.stringElement('agent[familyName]', 'Family name', '')}
                ${formElements.stringElement('abstract', 'Abstract', '', false, 10)}
                ${formElements.stringElement('studyField', 'Study field', '')}
                ${formElements.enumElement('additionalType', 'Additional types', '', getAdditionalTypes(), false)}
                ${formElements.enumElement('studentLifeCyclePhase', 'Student lifecycle phase', '', formElements.getStudentLifeCyclePhase(), false)}
                ${formElements.dateTimeElement('dateCreated', 'Date created', '', true)}
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
                color: #1ace38;
            }
        `;
    }

    render() {
        return html`
            <form>
                <h2>Communication</h2>
                Some special information here<br />
                lang: ${this.lang}<br />
                filename: ${this.data.file.base.fileName}<br />
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        return html`
            <h2>Communication</h2>
            lang: ${this.lang}<br />
            filename: ${this.data.file.base.fileName}<br />
        `;
    }
}
