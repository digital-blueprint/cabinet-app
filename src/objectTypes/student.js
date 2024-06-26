import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';

export default class extends BaseObject {
    name = 'student';

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
                <h2>Student Form</h2>
                lang: ${this.lang}<br />
                user-id: ${this.userId}<br />
                <fieldset>
                    <legend>Firstname</legend>
                    <input type="text" id="firstname" name="firstname" value="${data['student-firstname']}" required>
                    <label for="firstname">Firstname</label>
                </fieldset>

                <fieldset>
                    <legend>Lastname</legend>
                    <input type="text" id="lastname" name="lastname" value="${data['student-lastname']}" required>
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
            <h2>Student</h2>
            lang: ${this.lang}<br />
            firstname: ${this.data['student-firstname']}<br />
            lastname: ${this.data['student-lastname']}<br />
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        return html`
            <h2>Student</h2>
            lang: ${this.lang}<br />
            firstname: ${this.data['student-firstname']}<br />
            lastname: ${this.data['student-lastname']}<br />
        `;
    }
}
