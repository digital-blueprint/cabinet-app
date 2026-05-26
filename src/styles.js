import {css} from 'lit';

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
