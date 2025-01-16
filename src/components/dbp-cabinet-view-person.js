import {css, html, unsafeCSS} from 'lit';
import {html as staticHtml, unsafeStatic} from 'lit/static-html.js';
import {ref, createRef} from 'lit/directives/ref.js';
import {ScopedElementsMixin} from '@dbp-toolkit/common';
import DBPCabinetLitElement from "../dbp-cabinet-lit-element";
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button, Icon, Modal} from '@dbp-toolkit/common';
import {FileSource} from '@dbp-toolkit/file-handling';
import {PdfViewer} from '@dbp-toolkit/pdf-viewer';
import {pascalToKebab} from '../utils';
import {getIconSVGURL} from '../utils.js';

export class CabinetViewPerson extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.objectTypeFormComponents = {};
        this.objectTypeHitComponents = {};
        this.objectTypeViewComponents = {};
        this.hitData = {
            "id": "",
            "objectType": "",
        };
        this.modalRef = createRef();
        this.documentFile = null;
        this.fileDocumentTypeNames = {};
        this.documentType = '';
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-file-source': FileSource,
            'dbp-pdf-viewer': PdfViewer,
            'dbp-modal': Modal,
            'dbp-button': Button,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            hitData: { type: Object, attribute: false },
            documentFile: { type: File, attribute: false },
            documentType: { type: String, attribute: false },
        };
    }

    setObjectTypeViewComponents(objectTypeViewComponents) {
        this.objectTypeViewComponents = objectTypeViewComponents;
    }

    async openDialogWithHit(hit = null) {
        this.hitData = hit;

        // Wait until hit data is set and rendering is complete
        await this.updateComplete;

        /**
         * @type {Modal}
         */
        const modal = this.modalRef.value;
        console.log('modal', modal);
        modal.open();
    }

    async openDocumentAddDialog() {
        this.documentType = '';

        /**
         * @type {Modal}
         */
        const modal = this.modalRef.value;
        // Make sure the document-add dialog is closed
        modal.close();

        // Open the file source dialog to select a file
        this._('#file-source').setAttribute('dialog-open', '');
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}

            #view-modal .content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px 10px;
                grid-auto-flow: row;
            }

            #view-modal .description { grid-area: 1 / 1 / 2 / 3; }

            #view-modal .pdf-preview { grid-area: 2 / 1 / 3 / 2; }

            #view-modal .form { grid-area: 2 / 2 / 3 / 3; }

            #view-modal {
                --dbp-modal-title-font-size: 24px;
                --dbp-modal-title-font-weight: bold;
                --dbp-modal-title-padding: 0 0 0 40px;
                --dbp-modal-title-background: url("${unsafeCSS(getIconSVGURL('user'))}") left center / 28px 28px no-repeat;
                list-style-type: none;
                --dbp-modal-min-width: min(75vw, 85vw);
            }

        `;
    }

    /**
     * Returns the modal dialog for adding a document to a person after the document was selected
     * in the file source
     */
    getModalHtml() {
        const hit = this.hitData;
        console.log('hit', hit);
        const objectType = hit.objectType;

        if (objectType === '') {
            console.log('objectType empty', objectType);
            return html`<dbp-modal ${ref(this.modalRef)} modal-id="view-modal"></dbp-modal>`;
        }

        const id = hit.id;
        const tagPart = pascalToKebab(objectType);
        const tagName = 'dbp-cabinet-object-type-view-' + tagPart;

        console.log('objectType', objectType);
        console.log('tagName', tagName);
        console.log('this.objectTypeViewComponents[objectType]', this.objectTypeViewComponents[objectType]);

        if (!customElements.get(tagName)) {
            customElements.define(tagName, this.objectTypeViewComponents[objectType]);
        }

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from
        // a variable and need to set the "data" property from a variable too!
        return staticHtml`
            <dbp-modal
                ${ref(this.modalRef)}
                id="view-modal"
                modal-id="view-modal"
                width="80%"
                height="80%"
                min-width="80%"
                min-height="80%"
                subscribe="lang"
                title="${hit.person.fullName}">
                <div slot="content">
                    <${unsafeStatic(tagName)} id="dbp-cabinet-object-type-view-${id}" subscribe="lang" .data=${hit}></${unsafeStatic(tagName)}>
                </div>
                <div slot="footer" class="modal-footer">

                </div>
            </dbp-modal>
        `;

        // return html`
        //     <dbp-modal
        //         ${ref(this.modalRef)}
        //         id="view-modal"
        //         modal-id="view-modal"
        //         width="80%"
        //         height="80%"
        //         min-width="80%"
        //         min-height="80%"
        //         subscribe="lang">
        //         <div slot="content" class="content">
        //             <div class="description">
        //                 <h1>Person View</h1>
        //                 Document ID: ${id}<br />
        //             </div>
        //         </div>
        //         <div slot="footer" class="modal-footer">
        //             Footer
        //         </div>
        //     </dbp-modal>
        // `;
    }

    render() {
        // const i18n = this._i18n;
        console.log('-- Render --');

        return html`
            ${this.getModalHtml()}
        `;
    }

    /**
     * @param ev
     */
    async onDocumentFileSelected(ev) {
        console.log('ev.detail.file', ev.detail.file);
        this.documentFile = ev.detail.file;

        // We need to wait until rendering is complete after this.documentFile has changed
        await this.updateComplete;

        const pdfViewer = this._('#document-add-pdf-viewer');

        // Load the PDF in the PDF viewer with the double reloading workaround,
        // because the page wasn't always shown
        await pdfViewer.showPDF(this.documentFile, {}, true);

        // Workaround to trigger a resize after the PDF was loaded, so the PDF is shown correctly
        pdfViewer._onWindowResize();

        // Opens the modal dialog for adding a document to a person after the document was
        // selected in the file source
        this.modalRef.value.open();
    }
}
