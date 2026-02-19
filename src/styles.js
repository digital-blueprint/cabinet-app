import {css} from 'lit';

/**
 * Currently we don't need this
 */
export function getAlgoliaMinCSS() {
    // language=css
    return css`
        .ais-SearchBox-reset {
            padding: 0;
            overflow: visible;
            font: inherit;
            line-height: normal;
            color: inherit;
            background: none;
            border: 0;
            cursor: pointer;
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            position: absolute;
            z-index: 1;
            width: 20px;
            height: 20px;
            top: 50%;
            /*top: 1em;*/
            right: 0.3rem;
            transform: translateY(-50%);
        }

        .ais-SearchBox-reset::-moz-focus-inner {
            padding: 0;
            border: 0;
        }

        .ais-SearchBox-reset[disabled] {
            cursor: default;
        }
    `;
}

export function getPaginationCSS() {
    // language=css
    return css`
        .ais-Pagination-list {
            list-style: none;
            display: flex;
            justify-content: right;
            gap: 3px;
            margin-bottom: 0;
            overflow: hidden;
            padding-top: 20px;
        }

        .ais-Pagination-item {
            border: 1px solid var(--dbp-content);
            background-color: var(--dbp-background);
            color: var(--dbp-content);
        }

        .ais-Pagination-link {
            min-width: 1em;
            height: 2em;
            display: block;
            text-align: center;
            line-height: 2em;
            padding: 0 0.7em;
            border: none;
        }

        .ais-Pagination-link:hover {
            color: var(--dbp-content);
            background-color: #e4154b;
        }

        .ais-Pagination-link {
            color: var(--dbp-content);
            border: none;
            border-radius: 0;
        }

        .ais-Pagination-item--selected .ais-Pagination-link {
            font-weight: bold;
            background-color: var(--dbp-muted);
            color: var(--dbp-secondary-surface);
        }

        .ais-Pagination-item--disabled .ais-Pagination-link {
            cursor: not-allowed;
            color: var(--dbp-muted);
        }

        .ais-Pagination-item--disabled .ais-Pagination-link:hover {
            background-color: initial;
        }

        @media (max-width: 489px) {
            .ais-Pagination-list {
                justify-content: space-between;
            }
            .ais-Pagination-item {
                width: 100%;
            }
        }
    `;
}

export function getSelectorFixCSS() {
    // language=css
    return css`
        /* For some reasons the selector chevron was very large */
        select:not(.select),
        .dropdown-menu {
            background-size: 1em;
            padding: 0.14rem 2rem 0.14rem 1rem;
            background-color: var(--dbp-background);
        }
    `;
}
