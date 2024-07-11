import {css, html} from 'lit';
import {createInstance} from '../i18n';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';

export default class extends BaseObject {
    name = 'file-cabinet-email';

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
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.data = {};
        this.userId = '';
    }

    static get scopedElements() {
        return {
        };
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            data: {type: Object},
            userId: {type: String, attribute: 'user-id'},
        };
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}
        `;
    }

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('this.data', this.data);
        const data = this.data;

        return html`
            <form>
                <h2>Email Form</h2>
                lang: ${this.lang}<br />
                user-id: ${this.userId}<br />
                <fieldset>
                    <legend>About</legend>
                    <input type="text" id="about" name="about" value="${data.file.base.fileName}" required>
                    <label for="about">About</label>
                </fieldset>

                <fieldset>
                    <legend>Comment</legend>
                    <textarea id="comment" name="comment">${data.filesize}</textarea>
                    <label for="comment">Comment</label>
                </fieldset>

                <fieldset>
                    <legend>Type</legend>
                    <select id="@type" name="@type" required>
                        <option value="Conversation">Conversation</option>
                    </select>
                    <label for="@type">Type</label>
                </fieldset>

                <fieldset>
                    <legend>Additional Type</legend>
                    <select id="additionalType" name="additionalType" required>
                        <option value="Email">Email</option>
                    </select>
                    <label for="additionalType">Additional Type</label>
                </fieldset>

                <fieldset>
                    <legend>Abstract</legend>
                    <textarea id="abstract" name="abstract" required></textarea>
                    <label for="abstract">Abstract</label>
                </fieldset>

                <fieldset>
                    <legend>Date Created</legend>
                    <input type="datetime-local" id="dateCreated" name="dateCreated" required>
                    <label for="dateCreated">Date Created</label>
                </fieldset>

                <fieldset>
                    <legend>Sender</legend>
                    <fieldset>
                        <legend>Given Name</legend>
                        <input type="text" id="sender_givenName" name="sender_givenName" required>
                        <label for="sender_givenName">Given Name</label>
                    </fieldset>

                    <fieldset>
                        <legend>Family Name</legend>
                        <input type="text" id="sender_familyName" name="sender_familyName" required>
                        <label for="sender_familyName">Family Name</label>
                    </fieldset>

                    <fieldset>
                        <legend>Email</legend>
                        <input type="fileEmail" id="sender_email" name="sender_email" required>
                        <label for="sender_email">Email</label>
                    </fieldset>
                </fieldset>

                <fieldset>
                    <legend>Recipient</legend>
                    <fieldset>
                        <legend>Given Name</legend>
                        <input type="text" id="recipient_givenName" name="recipient_givenName" required>
                        <label for="recipient_givenName">Given Name</label>
                    </fieldset>

                    <fieldset>
                        <legend>Family Name</legend>
                        <input type="text" id="recipient_familyName" name="recipient_familyName" required>
                        <label for="recipient_familyName">Family Name</label>
                    </fieldset>

                    <fieldset>
                        <legend>Email</legend>
                        <input type="fileEmail" id="recipient_email" name="recipient_email" required>
                        <label for="recipient_email">Email</label>
                    </fieldset>
                </fieldset>

                <fieldset>
                    <legend>CC Recipient</legend>
                    <input type="fileEmail" id="ccRecipient" name="ccRecipient">
                    <label for="ccRecipient">CC Recipient</label>
                </fieldset>

                <fieldset>
                    <legend>BCC Recipient</legend>
                    <input type="fileEmail" id="bccRecipient" name="bccRecipient">
                    <label for="bccRecipient">BCC Recipient</label>
                </fieldset>

                <fieldset>
                    <legend>Subject Of</legend>
                    <input type="text" id="subjectOf" name="subjectOf">
                    <label for="subjectOf">Subject Of</label>
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
                color: #2baff5;
            }
        `;
    }

    render() {
        return html`
            <form>
                <h2>Email</h2>
                lang: ${this.lang}<br />
                filename: ${this.data.file.base.fileName}<br />
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        return html`
            <h2>Email</h2>
            lang: ${this.lang}<br />
            filename: ${this.data.file.base.fileName}<br />
        `;
    }
}
