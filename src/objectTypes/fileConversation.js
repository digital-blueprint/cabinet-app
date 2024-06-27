import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';

export default class extends BaseObject {
    name = 'fileConversation';

    /**
     * @returns {string}
     */
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

        return html`
            <form>
                <h2>Conversation Form</h2>
                lang: ${this.lang}<br />
                user-id: ${this.userId}<br />
                <fieldset>
                    <legend>About</legend>
                    <input type="text" id="about" name="about" required>
                    <label for="about">About</label>
                </fieldset>

                <fieldset>
                    <legend>Comment</legend>
                    <textarea id="comment" name="comment"></textarea>
                    <label for="comment">Comment</label>
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
                color: #1ace38;
            }
        `;
    }

    render() {
        return html`
            <form>
                <h2>Conversation</h2>
                Some special information here<br />
                lang: ${this.lang}<br />
                filename: ${this.data['file-filename']}<br />
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        return html`
            <h2>Conversation</h2>
            lang: ${this.lang}<br />
            filename: ${this.data['file-filename']}<br />
        `;
    }
}
