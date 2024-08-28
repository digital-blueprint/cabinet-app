import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';
import * as formElements from './formElements.js';
import * as viewElements from './viewElements.js';

export default class extends BaseObject {
    name = 'file-cabinet-minimalSchema';

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

export const getAdditionalTypes = () => {
    return {
        'BirthCertificate': 'Birth Certificate',
        'DriversLicence': 'Drivers Licence',
        'Passport': 'Passport',
        'PersonalLicence': 'Personal Licence',
    };
};

class CabinetFormElement extends BaseFormElement {
    render() {
        console.log('-- Render CabinetFormElement --');

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/minimalSchema.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/minimalSchema_example.json
        return html`
            <form>
                <h2>fileMinimalSchema Form</h2>
                lang: ${this.lang}<br />
                ${formElements.stringElement('studyField', 'Study field', '', true)}
                ${formElements.enumElement('additionalType', 'Additional type', '', getAdditionalTypes(), false)}
                ${formElements.enumElement('studentLifeCyclePhase', 'Student lifecycle phase', '', formElements.getStudentLifeCyclePhase(), true)}
                ${formElements.dateElement('dateCreated', 'Date created', '', true)}
                ${formElements.stringElement('subjectOf', 'Subject of', '')}
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
                color: #8e24e0;
            }
        `;
    }

    render() {
        return html`
            <form>
                <h2>fileMinimalSchema</h2>
                lang: ${this.lang}<br />
                filename: ${this.data.file.base.fileName}<br />
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        return html`
            <h2>Minimal Schema</h2>
            lang: ${this.lang}<br />
            filename: ${this.data.file.base.fileName}<br />
            ${viewElements.stringElement('Study field', this.data.file.base.studyField)}
            ${viewElements.enumElement('Additional type', this.data.file.base.additionalType, getAdditionalTypes(), false)}
            ${viewElements.enumElement('Student lifecycle phase', this.data.file.base.studentLifeCyclePhase, formElements.getStudentLifeCyclePhase(), true)}
            ${viewElements.dateElement('Date created', this.data.file.base.dateCreated)}
            ${viewElements.stringElement('Subject of', this.data.file.base.subjectOf)}
            ${viewElements.stringElement('Comment', this.data.file.base.comment)}
        `;
    }
}
