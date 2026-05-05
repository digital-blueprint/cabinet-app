import {css} from 'lit';

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
            color: var(--dbp-hover-color);
            background-color: var(--dbp-hover-background-color);
        }

        .ais-Pagination-link {
            color: var(--dbp-content);
            border: none;
            border-radius: 0;
        }

        .ais-Pagination-item--selected .ais-Pagination-link {
            font-weight: bold;
            background-color: var(--dbp-selected);
            color: var(--dbp-on-selected-surface);
        }

        .ais-Pagination-item--disabled .ais-Pagination-link {
            cursor: not-allowed;
            color: var(--dbp-muted);
        }

        .ais-Pagination-item--disabled .ais-Pagination-link:hover {
            background-color: var(--dbp-hover-background-color);
            color: var(--dbp-hover-color);
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
