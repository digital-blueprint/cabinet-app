import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';
import * as formElements from './formElements.js';

export default class extends BaseObject {
    name = 'file-cabinet-admissionNotice';

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
    getAdditionalTypes = () => {
        return {
            'AdmissionNotice': 'Admission Notice',
        };
    };

    getDecisions = () => {
        return {
            'rejected': 'Rejected',
            'refused': 'Refused',
            'granted': 'Granted',
        };
    };

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('this.data', this.data);
        // const data = this.data;

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/admissionNotice.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/admissionNotice_example.json
        return html`
            <form>
                <h2>admissionNotice Form</h2>
                ${formElements.enumElement('studentLifeCyclePhase', 'Student lifecycle phase', '', formElements.getStudentLifeCyclePhase(), true)}
                ${formElements.stringElement('studyField', 'Study field', '', true)}
                ${formElements.stringElement('subjectOf', 'Subject of', '')}
                ${formElements.enumElement('additionalType', 'Additional type', '', this.getAdditionalTypes(), false)}
                ${formElements.dateElement('dateCreated', 'Date created', '', true)}
                ${formElements.stringElement('previousStudy', 'Previous study', '')}
                ${formElements.enumElement('decision', 'Decision', '', this.getDecisions(), false)}
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
