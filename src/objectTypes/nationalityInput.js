import { LitElement, html, css } from 'lit';

export class NationalityInput extends LitElement {
  static properties = {
    value: { type: String, reflect: true },
    selectedCountry: { type: String },
    isUnknown: { type: Boolean },
    filteredCountries: { type: Array },
    showResults: { type: Boolean },
    highlightedIndex: { type: Number },
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: block;
    }
    
    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
    }
    
    input {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 16px;
      width: 150px;
      font-family: monospace;
      letter-spacing: 1px;
    }
    
    input:focus {
      outline: 2px solid #4d90fe;
    }

    :host([disabled]) input {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
    
    .selected-country {
      font-size: 16px;
      color: #333;
      padding-left: 10px;
    }
    
    .unknown-country {
      font-size: 16px;
      color: #ff6b6b;
      padding-left: 10px;
      font-style: italic;
    }
    
    .dropdown-results {
      position: absolute;
      z-index: 100;
      width: 100%;
      max-height: 200px;
      overflow-y: auto;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      top: 100%;
      left: 0;
      margin-top: 2px;
    }
    
    .country-option {
      padding: 8px 12px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .country-option[aria-selected="true"] {
      background-color: #e8f0fe;
    }
    
    .country-code {
      font-weight: bold;
      color: #0066cc;
    }
  `;

  constructor() {
    super();
    this.value = '';
    this.selectedCountry = '';
    this.isUnknown = false;
    this.filteredCountries = [];
    this.showResults = false;
    this.highlightedIndex = -1;
    this.label = 'Nationality Code';
    this.disabled = false;
    
    // Generate unique IDs for ARIA references
    this.inputId = `nat-input-${Math.random().toString(36).slice(2, 9)}`;
    this.listId = `nat-list-${Math.random().toString(36).slice(2, 9)}`;

    // Country data
    this.countries = [
      { name: "United States", code: "USA" },
      { name: "United Kingdom", code: "GBR" },
      { name: "Canada", code: "CAN" },
      { name: "Australia", code: "AUS" },
      { name: "Germany", code: "DEU" },
      { name: "France", code: "FRA" },
      { name: "Japan", code: "JPN" },
      { name: "China", code: "CHN" },
      { name: "India", code: "IND" },
      { name: "Brazil", code: "BRA" },
      { name: "Mexico", code: "MEX" },
      { name: "Spain", code: "ESP" },
      { name: "Italy", code: "ITA" },
      { name: "Netherlands", code: "NLD" },
      { name: "Sweden", code: "SWE" },
      { name: "Austria", code: "AUT" }
    ];

    // Create maps for quick lookups
    this.codeToCountry = new Map(this.countries.map(country => [country.code, country.name]));
    this.nameToCode = new Map(this.countries.map(country => [country.name.toLowerCase(), country.code]));
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick.bind(this));
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._handleOutsideClick.bind(this));
    super.disconnectedCallback();
  }

  _handleOutsideClick(e) {
    if (!this.shadowRoot.contains(e.target) && this.showResults) {
      this.showResults = false;
      this.requestUpdate();
    }
  }

  _handleInput(e) {
    if (this.disabled) return;
    
    const query = e.target.value.trim().toUpperCase();
    this.value = e.target.value;
    
    if (query.length === 0) {
      this.showResults = false;
      this.selectedCountry = '';
      this.isUnknown = false;
      return;
    }
    
    // If exactly 3 characters, check if it's a valid code
    if (query.length === 3 && /^[A-Z]{3}$/.test(query)) {
      if (this.codeToCountry.has(query)) {
        this.selectedCountry = this.codeToCountry.get(query);
        this.isUnknown = false;
      } else {
        this.selectedCountry = 'Unknown country';
        this.isUnknown = true;
      }
    } else {
      this.selectedCountry = '';
      this.isUnknown = false;
    }
    
    // Search for matches
    this.filteredCountries = this.countries.filter(country => 
      country.name.toUpperCase().includes(query) || 
      country.code.includes(query)
    );
    
    this.showResults = true;
    this.highlightedIndex = -1;
  }

  _handleKeydown(e) {
    if (this.disabled) return;
    
    // Close dropdown on Escape
    if (e.key === 'Escape') {
      this.showResults = false;
      return;
    }
    
    if (!this.showResults || !this.filteredCountries.length) return;
    
    // Arrow down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.highlightedIndex = (this.highlightedIndex + 1) % this.filteredCountries.length;
    }
    // Arrow up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightedIndex = (this.highlightedIndex - 1 + this.filteredCountries.length) % this.filteredCountries.length;
    }
    // Enter key
    else if (e.key === 'Enter' && this.highlightedIndex >= 0) {
      e.preventDefault();
      const selectedCountry = this.filteredCountries[this.highlightedIndex];
      this._selectCountry(selectedCountry.code);
    }

    this.requestUpdate();
    
    // Scroll highlighted item into view
    setTimeout(() => {
      const highlighted = this.shadowRoot.querySelector('.country-option[aria-selected="true"]');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  _handleBlur() {
    if (this.disabled) return;
    
    // Give time for click events to process first
    setTimeout(() => {
      const value = this.value.trim().toUpperCase();
      if (value.length === 3 && /^[A-Z]{3}$/.test(value)) {
        this._validateCode(value);
      } else if (value.length > 0) {
        // Try to match a country name
        const countryName = this.value.trim();
        const code = this.nameToCode.get(countryName.toLowerCase());
        if (code) {
          this._selectCountry(code);
        }
      }
    }, 200);
  }

  _handleOptionClick(e) {
    if (this.disabled) return;
    
    const code = e.currentTarget.dataset.code;
    this._selectCountry(code);
  }

  _selectCountry(code) {
    const input = this.shadowRoot.querySelector('input');
    input.value = code;
    this.value = code;
    this.selectedCountry = this.codeToCountry.get(code);
    this.isUnknown = false;
    this.showResults = false;
    
    // Dispatch a change event
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: code, country: this.selectedCountry },
      bubbles: true,
      composed: true
    }));
    
    this.requestUpdate();
  }

  _validateCode(code) {
    code = code.toUpperCase();
    if (this.codeToCountry.has(code)) {
      this.selectedCountry = this.codeToCountry.get(code);
      this.isUnknown = false;
    } else {
      this.selectedCountry = 'Unknown country';
      this.isUnknown = true;
    }
    
    // Dispatch a change event
    this.dispatchEvent(new CustomEvent('change', {
      detail: { 
        value: code, 
        country: this.selectedCountry,
        isValid: !this.isUnknown
      },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      ${this.label ? html`<label for="${this.inputId}">${this.label}</label>` : ''}
      
      <div class="input-wrapper">
        <input 
          id="${this.inputId}"
          type="text" 
          placeholder="Enter code" 
          autocomplete="off"
          .value="${this.value}"
          ?disabled="${this.disabled}"
          aria-autocomplete="list"
          aria-controls="${this.showResults ? this.listId : ''}"
          aria-expanded="${this.showResults}"
          role="combobox"
          @input="${this._handleInput}"
          @keydown="${this._handleKeydown}"
          @blur="${this._handleBlur}"
        >
        <span class="${this.isUnknown ? 'unknown-country' : 'selected-country'}" 
              aria-live="polite">
          ${this.selectedCountry}
        </span>
        
        ${this.showResults ? html`
          <div id="${this.listId}" 
               class="dropdown-results" 
               role="listbox">
            ${this.filteredCountries.length ? 
              this.filteredCountries.map((country, index) => html`
                <div 
                  class="country-option" 
                  role="option"
                  aria-selected="${index === this.highlightedIndex}"
                  data-code="${country.code}"
                  @click="${this._handleOptionClick}"
                >
                  ${country.name} (<span class="country-code">${country.code}</span>)
                </div>
              `) : 
              html`<div class="country-option" role="option">No matches found</div>`
            }
          </div>
        ` : ''}
      </div>
    `;
  }
}
