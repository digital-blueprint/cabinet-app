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

                .superseded {
                    text-decoration: line-through;
                    color: var(--dbp-muted);
                }
            `,
        ];
    }

    render() {
        let hit = getDocumentHit(this.data);

        const i18n = this._i18n;

        const lastModified = new Date(hit.file.base.modifiedTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        const dateCreated = new Date(hit.file.base.createdTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        return html`
            <form>
                <header class="ais-doc-Hits-header">
                    <div class="ais-doc-title-wrapper">
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
                            ${renderFieldWithHighlight(hit, 'person.birthDateDe')}
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
                        <br />
                        ${hit.file.base.subjectOf
                            ? html`
                                  <span>
                                      ${i18n.t('subject-of')}:
                                      ${renderFieldWithHighlight(hit, 'file.base.subjectOf')}
                                  </span>
                                  <br />
                              `
                            : ''}
                        <span>${i18n.t('Added')}: ${dateCreated}</span>
                        <br />
                        <span>${i18n.t('last-modified')}: ${lastModified}</span>
                        <br />
                    </div>
                    ${this.renderViewButton(hit)}
                </main>
            </form>
        `;
    }

    _renderContent() {
        throw new Error('not implemented');
    }
}
