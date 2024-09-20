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
    `;
}