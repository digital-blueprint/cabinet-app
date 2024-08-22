import {css, html} from 'lit';
import {BaseFormElement, BaseHitElement, BaseObject, BaseViewElement} from './baseObject';
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
    getNationalityItems() {
        return {
            ALB: "Albanian",
            AND: "Andorran",
            AUT: "Austrian",
            BLR: "Belarusian",
            BEL: "Belgian",
            BIH: "Bosnian",
            BGR: "Bulgarian",
            HRV: "Croatian",
            CYP: "Cypriot",
            CZE: "Czech",
            DNK: "Danish",
            EST: "Estonian",
            FIN: "Finnish",
            FRA: "French",
            DEU: "German",
            GRC: "Greek",
            HUN: "Hungarian",
            ISL: "Icelandic",
            IRL: "Irish",
            ITA: "Italian",
            LVA: "Latvian",
            LIE: "Liechtensteiner",
            LTU: "Lithuanian",
            LUX: "Luxembourgish",
            MLT: "Maltese",
            MDA: "Moldovan",
            MCO: "Monégasque",
            MNE: "Montenegrin",
            NLD: "Dutch",
            MKD: "North Macedonian",
            NOR: "Norwegian",
            POL: "Polish",
            PRT: "Portuguese",
            ROU: "Romanian",
            RUS: "Russian",
            SMR: "Sammarinese",
            SRB: "Serbian",
            SVK: "Slovak",
            SVN: "Slovenian",
            ESP: "Spanish",
            SWE: "Swedish",
            CHE: "Swiss",
            UKR: "Ukrainian",
            GBR: "British",
            VAT: "Vatican"
        };
    }
    render() {
        console.log('-- Render CabinetFormElement --');

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/citizenshipCertificate.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/citizenshipCertificate_example.json
        return html`
            <form>
                <h2>fileCitizenshipCertificate Form</h2>
                lang: ${this.lang}<br />
                ${formElements.stringElement('comment', 'Comment', '', false, 5)}
                ${formElements.enumElement('nationality', 'Nationality', '', this.getNationalityItems(), false)}
                ${formElements.dateElement('dateCreated', 'Date created', '', true)}
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
