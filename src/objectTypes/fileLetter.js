import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import {css, html} from 'lit';
import {createInstance} from '../i18n';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';

export default class extends BaseObject {
    name = 'fileLetter';

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
                <h2>Letter Form</h2>
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
                color: #f5ab53;
            }
        `;
    }

    render() {
        return html`
            <form>
                <h2>Letter</h2>
                lang: ${this.lang}<br />
                filename: ${this.data['file-filename']}<br />
                filesize: ${this.data.filesize}<br />
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        return html`
            <h2>Letter</h2>
            lang: ${this.lang}<br />
            filename: ${this.data['file-filename']}<br />
        `;
    }
}
