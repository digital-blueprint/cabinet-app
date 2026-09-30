import {html} from 'lit';
import {BaseObject, BaseFormElement, BaseViewElement} from './baseObject.js';
import {getSemesters} from './fileCommon.js';
import {getDocumentHit} from './schema.js';
import {until} from 'lit/directives/until.js';
import {CabinetApi} from '../../api.js';

export class BaseCabinetObject extends BaseObject {}

export class BaseCabinetFormElement extends BaseFormElement {
    getCommonFormElements() {
        const fileCommon = getDocumentHit(this._getData()).file.base;
        const additionalType = this.additionalType || fileCommon.additionalType.key;

        // Keep changed values in the data object across re-renders.
        const updateField = (field) => (e) => {
            const value = e.detail?.value ?? e.target?.value;
            const keys = field.split('.');
            const lastKey = keys.pop();
            let current = fileCommon;
            for (const key of keys) {
                current = current[key];
            }
            current[lastKey] = value;
        };

        return html`
            <dbp-form-string-element
                subscribe="lang"
                name="subjectOf"
                label=${this._i18nCustom.t('custom:doc-modal-subject-of')}
                placeholder=${this._i18nCustom.t('custom:doc-modal-subject-of-placeholder', {
                    id: '987654-AB/2023',
                })}
                .value=${fileCommon.subjectOf || ''}
                ?disabled=${this.disabled}
                @change=${updateField('subjectOf')}></dbp-form-string-element>

            <dbp-form-enum-element
                subscribe="lang"
                name="studyField"
                label=${this._i18nCustom.t('custom:doc-modal-study-field')}
                .items=${this.getStudyFields()}
                .value=${fileCommon.studyField.key}
                required
                ?disabled=${this.disabled}
                @change=${updateField('studyField.key')}></dbp-form-enum-element>

            <dbp-form-enum-element
                subscribe="lang"
                name="disposalType"
                label=${this._i18nCustom.t('custom:doc-modal-disposal-type')}
                display-mode="list"
                .disabledItems=${BaseFormElement.getDisposalTypesDisabled(additionalType)}
                .items=${BaseFormElement.getDisposalTypes(this._i18nCustom, additionalType)}
                .value=${fileCommon.disposalType || 'archival'}
                required
                ?disabled=${this.disabled}
                @change=${updateField('disposalType')}></dbp-form-enum-element>

            <dbp-form-enum-element
                subscribe="lang"
                name="semester"
                label=${this._i18nCustom.t('custom:doc-modal-semester')}
                .items=${getSemesters()}
                .value=${fileCommon.semester}
                required
                ?disabled=${this.disabled}
                @change=${updateField('semester')}></dbp-form-enum-element>

            <dbp-form-enum-element
                subscribe="lang"
                name="isPartOf"
                label=${this._i18nCustom.t('custom:doc-modal-purpose-storage')}
                .items=${BaseFormElement.getIsPartOfItems(this._i18nCustom)}
                .value=${fileCommon.isPartOf}
                multiple
                display-mode="tags"
                required
                ?disabled=${this.disabled}
                @change=${updateField('isPartOf')}></dbp-form-enum-element>

            <dbp-form-string-element
                subscribe="lang"
                name="comment"
                label=${this._i18nCustom.t('custom:doc-modal-comment')}
                placeholder=${this._i18nCustom.t('custom:doc-modal-comment')}
                rows="5"
                .value=${fileCommon.comment || ''}
                ?disabled=${this.disabled}
                @change=${updateField('comment')}></dbp-form-string-element>

            <input type="hidden" name="additionalType" value="${additionalType}" />
            ${this._getButtonRowHtml()}
        `;
    }
}

export class BaseCabinetViewElement extends BaseViewElement {
    _getCommonViewElements() {
        const baseData = this.data?.file?.base || {};
        let api = new CabinetApi(this);
        let userFullNamePromise = baseData.lastModifiedBy
            ? api.getUserFullName(baseData.lastModifiedBy)
            : Promise.resolve('-');

        const dateCreated = new Date(baseData.createdTimestamp * 1000).toLocaleString('de-DE', {
            dateStyle: 'medium',
            timeStyle: 'medium',
        });
        const dateModified = new Date(baseData.modifiedTimestamp * 1000).toLocaleString('de-DE', {
            dateStyle: 'medium',
            timeStyle: 'medium',
        });

        return html`
            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-subject-of')}
                .value=${baseData.subjectOf || '–'}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-study-field')}
                .value=${this.getStudyFieldNameForKey(
                    baseData.studyField.key,
                )}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-semester')}
                .value=${baseData.semester || '–'}></dbp-form-string-view>

            <dbp-form-enum-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-storage-purpose-deletion')}
                .value=${baseData.isPartOf}
                .items=${BaseFormElement.getIsPartOfItems(this._i18nCustom)}></dbp-form-enum-view>

            <dbp-form-enum-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-disposal-type')}
                .value=${baseData.disposalType}
                .items=${BaseFormElement.getDisposalTypes(
                    this._i18nCustom,
                    baseData.additionalType.key,
                )}></dbp-form-enum-view>

            <dbp-form-date-view
                .hidden=${
                    baseData.recommendedDeletionTimestamp === undefined &&
                    baseData.recommendedArchivalTimestamp === undefined
                }
                subscribe="lang"
                label=${
                    baseData.disposalType === 'archival'
                        ? this._i18nCustom.t('custom:doc-modal-recommended-archival')
                        : this._i18nCustom.t('custom:doc-modal-recommended-deletion')
                }
                .value=${
                    baseData.disposalType === 'archival'
                        ? new Date(baseData.recommendedArchivalTimestamp * 1000)
                        : new Date(baseData.recommendedDeletionTimestamp * 1000)
                }
                :></dbp-form-date-view>

            <dbp-form-string-view
                .hidden=${
                    baseData.recommendedDeletionTimestamp !== undefined ||
                    baseData.recommendedArchivalTimestamp !== undefined
                }
                subscribe="lang"
                label=${
                    baseData.disposalType === 'archival'
                        ? this._i18nCustom.t('custom:doc-modal-recommended-archival')
                        : this._i18nCustom.t('custom:doc-modal-recommended-deletion')
                }
                .value=${
                    baseData.disposalType === 'archival'
                        ? this._i18nCustom.t('custom:doc-modal-recommended-archival-summary')
                        : this._i18nCustom.t('custom:doc-modal-recommended-deletion-summary', {
                              years: this.getRetentionDurationByDocumentType(
                                  baseData.additionalType.key,
                              ),
                          })
                }></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-comment')}
                .value=${baseData.comment || '–'}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-added')}
                .value=${`${dateCreated}${
                    baseData.fileSource
                        ? ` (${this._i18nCustom.t(`custom:typesense-schema.file.base.fileSource.${baseData.fileSource}`)})`
                        : ''
                }`}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-modified')}
                .value=${dateModified}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-last-modified-by')}
                .value=${until(userFullNamePromise, '')}></dbp-form-string-view>
        `;
    }
}
