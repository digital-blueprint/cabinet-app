import {html, css} from 'lit';
import {DbpBaseElement} from '@dbp-toolkit/form-elements/src/base-element';
import {getAllNationalityCodes, getNationalityDisplayName, isValidCode} from './nationalityCodes';
import {LangMixin} from '@dbp-toolkit/common';
import {createInstance} from '../i18n.js';

export class NationalityInput extends LangMixin(DbpBaseElement, createInstance, '_i18nSub') {
    static properties = {
        ...super.properties,
        _highlightedIndex: {type: Number, state: true},
        _filteredCodes: {type: Array, state: true},
        _selectedCountry: {type: String, state: true},
        _isUnknown: {type: Boolean, state: true},
        _showResults: {type: Boolean, state: true},
    };

    static get styles() {
        return [
            ...super.styles,
            css`
                :host {
                    display: block;
                }

                .input-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    position: relative;
                }

                :host([disabled]) input {
                    cursor: not-allowed;
                }

                .selected-country {
                    white-space: nowrap;
                }

                .unknown-country {
                    color: var(--dbp-danger);
                    white-space: nowrap;
                }

                .dropdown-results {
                    position: absolute;
                    z-index: 100;
                    width: 100%;
                    max-height: 200px;
                    overflow-y: auto;
                    background: var(--dbp-background);
                    border: var(--dbp-border);
                    top: 100%;
                    left: 0;
                    margin-top: 2px;
                    max-width: 400px;
                }

                .country-option {
                    padding: 8px 12px;
                    cursor: pointer;
                }

                .country-option[aria-selected='true'] {
                    color: var(--dbp-on-primary-surface);
                    background-color: var(--dbp-primary-surface);
                }

                .country-code {
                    font-weight: bold;
                }
            `,
        ];
    }

    constructor() {
        super();
        this.value = '';
        this.disabled = false;
        this._selectedCountry = '';
        this._isUnknown = false;
        this._showResults = false;
        this._highlightedIndex = -1;
        this._filteredCodes = [];
        this._codes = getAllNationalityCodes();
        this.customValidator = (value) => {
            if (!isValidCode(value)) {
                return [this._i18nSub.t('nationality-input.invalid-code-format')];
            } else {
                return [];
            }
        };
    }

    update(changedProperties) {
        super.update(changedProperties);
        changedProperties.forEach((oldValue, propName) => {
            if (propName === 'value') {
                this._selectedCountry = getNationalityDisplayName(this.value, this.lang);
                this._isUnknown = !this._isKnownCode(this.value);
                if (!this.value) {
                    // In case it is empty, don't show the error message
                    this._selectedCountry = '';
                }
            }
        });
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this._handleOutsideClick.bind(this));
    }

    disconnectedCallback() {
        document.removeEventListener('click', this._handleOutsideClick.bind(this));
        super.disconnectedCallback();
    }

    _isKnownCode(code) {
        return this._codes.includes(code);
    }

    _handleOutsideClick(e) {
        if (!this.shadowRoot.contains(e.target) && this._showResults) {
            this._showResults = false;
        }
    }

    _handleInput(e) {
        if (this.disabled) {
            return;
        }
        this._setCode(e.target.value);
        this._updateDropdown(e.target.value);
    }

    _setCode(value) {
        this.value = value;
        const query = value.trim().toUpperCase();
        if (this._isKnownCode(query)) {
            // If the user types in a known code, but lower case and with spaces etc,
            // we replace it with the proper code.
            this.value = query;
        }
    }

    _updateDropdown(value) {
        let query = value.trim().toUpperCase();
        if (!query) {
            this._showResults = false;
            return;
        }
        this._filteredCodes = this._codes.filter(
            (code) =>
                code.includes(query) ||
                getNationalityDisplayName(code, this.lang).toUpperCase().includes(query),
        );
        this._showResults = true;
        this._highlightedIndex = -1;
    }

    _handleKeydown(e) {
        if (this.disabled) return;

        if (e.key === 'Escape') {
            this._showResults = false;
            return;
        }

        if (!this._showResults || !this._filteredCodes.length) {
            return;
        }

        this._handleNavigationKeys(e);
    }

    _handleNavigationKeys(e) {
        const {key} = e;

        switch (key) {
            case 'ArrowDown':
                e.preventDefault();
                this._highlightedIndex = (this._highlightedIndex + 1) % this._filteredCodes.length;
                break;
            case 'ArrowUp':
                e.preventDefault();
                this._highlightedIndex =
                    (this._highlightedIndex - 1 + this._filteredCodes.length) %
                    this._filteredCodes.length;
                break;
            case 'Enter':
                if (this._highlightedIndex >= 0) {
                    e.preventDefault();
                    this._setCode(this._filteredCodes[this._highlightedIndex]);
                }
                break;
        }

        this._scrollHighlightedIntoView();
    }

    _scrollHighlightedIntoView() {
        requestAnimationFrame(() => {
            const highlighted = this.shadowRoot.querySelector(
                '.country-option[aria-selected="true"]',
            );
            highlighted?.scrollIntoView({block: 'nearest'});
        });
    }

    _handleOptionClick(e) {
        if (this.disabled) return;

        const code = e.currentTarget.dataset.code;
        this._setCode(code);
    }

    _renderDropdownOptions() {
        if (!this._filteredCodes.length) {
            return html`
                <div class="country-option" role="option">
                    ${this._i18nSub.t('nationality-input.no-matches-found')}
                </div>
            `;
        }

        return this._filteredCodes.map(
            (code, index) => html`
                <div
                    class="country-option"
                    role="option"
                    aria-selected="${index === this._highlightedIndex}"
                    data-code="${code}"
                    @click="${this._handleOptionClick}">
                    ${getNationalityDisplayName(code, this.lang)} (
                    <span class="country-code">${code}</span>
                    )
                </div>
            `,
        );
    }

    renderInput() {
        return html`
            <div class="input-wrapper">
                <input
                    id="${this.formElementId}"
                    type="text"
                    placeholder="${this._i18nSub.t('nationality-input.placeholder')}"
                    autocomplete="off"
                    .value="${this.value}"
                    ?disabled="${this.disabled}"
                    aria-autocomplete="list"
                    aria-expanded="${this._showResults}"
                    role="combobox"
                    @input="${this._handleInput}"
                    @keydown="${this._handleKeydown}" />
                <span
                    class="${this._isUnknown ? 'unknown-country' : 'selected-country'}"
                    aria-live="polite">
                    ${this._selectedCountry}
                </span>

                ${this._showResults
                    ? html`
                          <div class="dropdown-results" role="listbox">
                              ${this._renderDropdownOptions()}
                          </div>
                      `
                    : ''}
            </div>
        `;
    }
}
