import {css, html} from 'lit';
import {BaseHitElement, getCommonStyles} from '../baseObject.js';
import {renderFieldWithHighlight} from '../utils.js';
import {getDocumentHit} from './schema.js';

export class BaseDocumentHitElement extends BaseHitElement {
    static get styles() {
        return [
            ...super.styles,
            getCommonStyles(),
            css`
                h3 {
                    font-size: 1em;
                }

                .wrapper {
                    padding: 10px;
                    border: 1px solid var(--dbp-content);
                    border-top-width: 0px;
                }

                .spacing-top {
                    margin-top: 1.5em;
                }

                .border-top {
                    border-top-width: 1px;
                }

                .superseded {
                    text-decoration: line-through;
                    color: var(--dbp-muted);
                }

                .hidden {
                    display: none;
                }
            `,
        ];
    }

    render() {
        let hit = getDocumentHit(this.data);
        this.hit = hit;

        const i18n = this._i18n;

        const lastModified = new Date(hit.file.base.modifiedTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        const dateCreated = new Date(hit.file.base.createdTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        let spacingTop = this.isFirstOfGroupOnPage && !this.isFirstOnPage;
        let borderTop = spacingTop || this.isFirstOnPage;

        this.ariaLabel = `${i18n.t('hitbox.document-entry')} ${this.lang === 'de' ? hit.file.base.additionalType.text : hit.file.base.additionalType.textEn} ${i18n.t('hitbox.document-of')} ${hit.person.familyName}, ${hit.person.givenName}`;

        return html`
            <form
                class="wrapper ${spacingTop ? 'spacing-top' : ''} ${borderTop ? 'border-top' : ''}">
                <header class="ais-doc-Hits-header ${!hit.base.isCurrent ? 'hidden' : ''}">
                    <div class="ais-doc-title-wrapper">
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                name="select"
                                class="checkbox"
                                @change=${this.selectCheckboxChanged}
                                ?checked=${this.selected}
                                value="${hit.id}" />
                        </label>
                        <dbp-icon class="icon-container" name="files" aria-hidden="true"></dbp-icon>
                        <h2 class="ais-doc-title ${!hit.base.isCurrent ? 'superseded' : ''}">
                            ${renderFieldWithHighlight(
                                hit,
                                this.lang === 'de'
                                    ? 'file.base.additionalType.text'
                                    : 'file.base.additionalType.textEn',
                            )}
                        </h2>
                    </div>
                    <div class="text-container">
                        <h3
                            class="ais-doc-Hits-header-items header-item1"
                            aria-label="${i18n.t('full-family-name')} ${hit.person
                                .familyName}, ${hit.person.givenName} ${i18n.t('birth-date')} ${hit
                                .person.birthDateDe}">
                            ${renderFieldWithHighlight(hit, 'person.familyName')},
                            ${renderFieldWithHighlight(hit, 'person.givenName')}
                            <span class="text-normal">
                                ${renderFieldWithHighlight(hit, 'person.birthDateDe')}
                            </span>
                        </h3>
                        &nbsp
                        <div
                            class="ais-doc-Hits-header-items header-item2"
                            aria-label="${i18n.t('st-PersonNr')} ${hit.person.studId}">
                            ${renderFieldWithHighlight(hit, 'person.studId')} |
                            ${renderFieldWithHighlight(hit, 'person.stPersonNr')}
                        </div>
                    </div>
                </header>
                <main class="ais-doc-Hits-content">
                    <div class="hit-content-item">
                        ${this._renderContent()}
                        ${hit.file.base.subjectOf
                            ? html`
                                  <span>
                                      ${i18n.t('subject-of')}:
                                      ${renderFieldWithHighlight(hit, 'file.base.subjectOf')}
                                  </span>
                              `
                            : ''}
                        <span>${i18n.t('Added')}: ${dateCreated}</span>

                        <span>${i18n.t('last-modified')}: ${lastModified}</span>
                    </div>
                    ${this.renderViewButton(hit)}
                </main>
            </form>
        `;
    }

    selectCheckboxChanged(e) {
        const id = e.target.value;
        const checked = e.target.checked;
        this.sendHitSelectionEvent(
            this.constructor.HitSelectionType.DOCUMENT_FILE,
            id,
            checked,
            this.hit,
        );
    }

    _renderContent() {
        throw new Error('not implemented');
    }
}
