import { LitElement, html, css } from 'lit';

export class RefinementList extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--font-family, system-ui, sans-serif);
    }

    .search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .refinement-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .refinement-item {
      margin-bottom: 8px;
    }

    .refinement-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
      user-select: none;
    }

    .refinement-label:hover {
      background-color: var(--hover-bg, #f5f5f5);
    }

    .refinement-checkbox {
      margin-right: 8px;
      cursor: pointer;
    }

    .refinement-text {
      flex: 1;
      min-width: 0; /* Allow text to shrink */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 8px;
    }

    .refinement-count {
      color: var(--count-color, #666);
      font-size: 0.9em;
      flex-shrink: 0; /* Prevent count from shrinking */
    }

    .show-more-button {
      margin-top: 12px;
      padding: 8px 16px;
      background-color: var(--button-bg, #0066cc);
      color: var(--button-color, white);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .show-more-button:hover:not(:disabled) {
      background-color: var(--button-hover-bg, #0052a3);
    }

    .show-more-button:disabled {
      background-color: var(--button-disabled-bg, #ccc);
      cursor: not-allowed;
    }

    .empty-state {
      color: var(--empty-color, #666);
      font-style: italic;
      text-align: center;
      padding: 20px;
    }
  `;

  static properties = {
    refinementListRenderOptions: { type: Object },
    _searchValue: { type: String, state: true }
  };

  constructor() {
    super();
    this.refinementListRenderOptions = {};
    this._searchValue = '';
  }

  updated(changedProperties) {
    if (changedProperties.has('refinementListRenderOptions')) {
      // Reset search value if not from search
      if (this.refinementListRenderOptions.isFromSearch === false && this._searchValue) {
        this._searchValue = '';
      }
    }
  }

  _handleSearchInput(event) {
    const value = event.target.value;
    this._searchValue = value;
    
    if (this.refinementListRenderOptions.searchForItems) {
      this.refinementListRenderOptions.searchForItems(value);
    }
  }

  _handleRefinementChange(event, item) {
    event.preventDefault();
    
    if (this.refinementListRenderOptions.refine) {
      this.refinementListRenderOptions.refine(item.value);
    }
    
    // Send analytics event
    if (this.refinementListRenderOptions.sendEvent) {
      this.refinementListRenderOptions.sendEvent('click', item.value);
    }
  }

  _handleShowMoreClick() {
    if (this.refinementListRenderOptions.toggleShowMore) {
      this.refinementListRenderOptions.toggleShowMore();
    }
  }

  _renderSearchInput() {
    if (!this.refinementListRenderOptions.searchForItems) {
      return '';
    }

    return html`
      <input
        type="text"
        class="search-input"
        placeholder="Search..."
        .value=${this._searchValue}
        @input=${this._handleSearchInput}
      />
    `;
  }

  _renderRefinementList() {
    const { items = [], canRefine = true } = this.refinementListRenderOptions;

    if (!canRefine) {
      return html`<div class="empty-state">No refinements available</div>`;
    }

    if (items.length === 0) {
      return html`<div class="empty-state">No items found</div>`;
    }

    return html`
      <ul class="refinement-list">
        ${items.map(item => html`
          <li class="refinement-item">
            <label class="refinement-label">
              <input
                type="checkbox"
                class="refinement-checkbox"
                .checked=${item.isRefined}
                @change=${(e) => this._handleRefinementChange(e, item)}
              />
              <span class="refinement-text" title="${item.label}">
                ${item.label}
              </span>
              <span class="refinement-count">
                (${item.count})
              </span>
            </label>
          </li>
        `)}
      </ul>
    `;
  }

  _renderShowMoreButton() {
    const { 
      canToggleShowMore = false, 
      isShowingMore = false, 
      toggleShowMore 
    } = this.refinementListRenderOptions;

    if (!toggleShowMore) {
      return '';
    }

    return html`
      <button
        class="show-more-button"
        ?disabled=${!canToggleShowMore}
        @click=${this._handleShowMoreClick}
      >
        ${isShowingMore ? 'Show less' : 'Show more'}
      </button>
    `;
  }

  render() {
    return html`
      ${this._renderSearchInput()}
      ${this._renderRefinementList()}
      ${this._renderShowMoreButton()}
    `;
  }
}

customElements.define('refinement-list', RefinementList);