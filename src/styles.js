import {css} from 'lit';

export function getCurrentRefinementCSS() {
    // language=css
    return css`
        .ais-CurrentRefinements--noRefinement {
            min-height: 4em;
        }
        .ais-CurrentRefinements {
            min-height: 4em;
            grid-area: header;
        }
        .ais-CurrentRefinements-list {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0 1em;
            margin: 0;
            padding: 0 0 1em 0;
            height: 100%;
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
            margin-bottom: .5em;
        }

        .ais-CurrentRefinements-delete {
            background: none;
            border: none 0;
            cursor: pointer;
        }
    `;
}