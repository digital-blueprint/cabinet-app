import {css} from 'lit';

export function getCurrentRefinementCSS() {
    // language=css
    return css`
        .visually-hidden {
            position: absolute !important;
            clip: rect(1px, 1px, 1px, 1px);
            overflow: hidden;
            height: 1px;
            width: 1px;
            word-wrap: normal;
        }

        .ais-CurrentRefinements--noRefinement {
            min-height: 4em;
        }

        .refinement-container {
            min-height: 3em;
            grid-area: header;
        }

        .ais-CurrentRefinements-list {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.5em 1em;
            margin: 0;
            padding: 0 0 1em 0;
            height: 100%;
            list-style: none;
        }

        .ais-CurrentRefinements-item {
            list-style: none;
            display: flex;
            flex-wrap: wrap;
            gap: 0 1em;
        }

        .ais-CurrentRefinements-label {
            display: none;
        }

        .ais-CurrentRefinements-category {
            border: 1px solid var(--dbp-content);
            padding: .25em 0.4em;
            display: flex;
            gap: .5em;
            white-space: nowrap;
        }

        .ais-CurrentRefinements-delete {
            position: relative;
            background: none;
            border: none 0;
            cursor: pointer;
            color: var(--dbp-content);
        }

        .ais-CurrentRefinements-category:hover .filter-close-icon {
            transform: rotate(90deg);
        }

        .filter-close-icon {
            display: block;
            transition: transform .1s ease-in;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/%3E%3C/svg%3E");
            width: 10px;
            height: 10px;
            background-size: 10px;
            color: var(--dbp-content);
            background: var(--dbp-content);
        }

        .clear-refinements-button {
            background: transparent;
            border: 1px solid transparent;
            color: var(--dbp-content);
            padding: 10px 10px 10px 30px;
            border-radius: 0;
            font-size: 13px;
            position: relative;
            cursor: pointer;
        }

        .clear-refinements-button:before {
            content: "";
            width: 12px;
            height: 12px;
            display: block;
            position: absolute;
            left: 10px;
            top: 11px;
            mask: url("data:image/svg+xml,%3Csvg width='12px' height='12px' stroke-width='1.03' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' color='%23000000'%3E%3Cg clip-path='url(%23restart_svg__clip0_1735_6488)' stroke='%23000000' stroke-width='1.03' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6.677 20.567C2.531 18.021.758 12.758 2.717 8.144 4.875 3.06 10.745.688 15.829 2.846c5.084 2.158 7.456 8.029 5.298 13.113a9.954 9.954 0 01-3.962 4.608'%3E%3C/path%3E%3Cpath d='M17 16v4.4a.6.6 0 00.6.6H22M12 22.01l.01-.011'%3E%3C/path%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='restart_svg__clip0_1735_6488'%3E%3Cpath fill='%23fff' d='M0 0h24v24H0z'%3E%3C/path%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E");
            background-repeat: no-repeat;
            transition: transform .3s ease;
            background-color: var(--dbp-content);
        }

        .clear-refinements-button[disabled] {
            display: none;
        }

        .clear-refinements-button:focus,
        .clear-refinements-button:hover {
            /* border: 1px solid #999; */
            background: transparent;
            text-decoration: underline;
            text-underline-offset: 3px;
        }

        .clear-refinements-button:focus:before,
        .clear-refinements-button:hover:before {
            transform: rotate(360deg);
        }

        .ais-SearchBox-resetIcon path {
            fill: var(--dbp-override-accent);
        }

    `;
}

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
            padding-top:20px;
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
            padding: 0 .7em;
            border:none;
        }

        .ais-Pagination-link:hover{
            color: var(--dbp-content);
            background-color: #e4154b;
        }

        .ais-Pagination-link {
            color:var(--dbp-content);
            border:none;
            border-radius:0;
        }

        .ais-Pagination-item--selected .ais-Pagination-link {
            font-weight: bold;
            background-color: var(--dbp-muted);
            color: var(--dbp-override-secondary-surface);
        }

        .ais-Pagination-item--disabled {
            cursor: not-allowed;
            border: 1px solid var(--dbp-muted);
            color: var(--dbp-muted);
        }
    `;
}

export function getSelectorFixCSS() {
    // language=css
    return css`
        /* For some reasons the selector chevron was very large */
        select:not(.select), .dropdown-menu {
            background-size: 1em;
        }
    `;
}
