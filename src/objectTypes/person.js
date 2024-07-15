import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';

export default class extends BaseObject {
    name = 'person';

    getFormComponent() {
        return CabinetFormElement;
    }

    getHitComponent() {
        return CabinetHitElement;
    }

    getViewComponent() {
        return CabinetViewElement;
    }
}

class CabinetFormElement extends BaseFormElement {
    render() {
        console.log('-- Render CabinetFormElement --');
        const data = this.data;

        return html`
            <form>
                <h2>Person Form</h2>
                lang: ${this.lang}<br />
                user-id: ${this.userId}<br />
                <fieldset>
                    <legend>Firstname</legend>
                    <input type="text" id="firstname" name="firstname" value="${data.base.givenName}" required>
                    <label for="firstname">Firstname</label>
                </fieldset>

                <fieldset>
                    <legend>Lastname</legend>
                    <input type="text" id="lastname" name="lastname" value="${data.base.familyName}" required>
                    <label for="lastname">Lastname</label>
                </fieldset>

                <button class="button is-primary" type="submit">Submit</button>
            </form>
        `;
    }
}

class CabinetHitElement extends BaseHitElement {
    static get styles() {
        // language=css
        return css`
            ${super.styles}

            h2 {
                color: #f3aa13;
            }
        `;
    }

    render() {
        return html`
            <h2>Person</h2>
            lang: ${this.lang}<br />
            firstname: ${this.data.base.givenName}<br />
            lastname: ${this.data.base.familyName}<br />
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        return html`
            <h2>Person</h2>
            lang: ${this.lang}<br />
            firstname: ${this.data.base.givenName}<br />
            lastname: ${this.data.base.familyName}<br />
        `;
    }
}
