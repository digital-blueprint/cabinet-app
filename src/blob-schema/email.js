class EmailCorrespondence {
    constructor() {
    }

    /**
     * TODO: Handle translation
     * TODO: Handle parameter with object
     * @returns {string}
     */
    generateFormHtml() {
        return `
          <form>
            <h2>Email Correspondence Form</h2>
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
                <input type="email" id="sender_email" name="sender_email" required>
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
                <input type="email" id="recipient_email" name="recipient_email" required>
                <label for="recipient_email">Email</label>
              </fieldset>
            </fieldset>

            <fieldset>
              <legend>CC Recipient</legend>
              <input type="email" id="ccRecipient" name="ccRecipient">
              <label for="ccRecipient">CC Recipient</label>
            </fieldset>

            <fieldset>
              <legend>BCC Recipient</legend>
              <input type="email" id="bccRecipient" name="bccRecipient">
              <label for="bccRecipient">BCC Recipient</label>
            </fieldset>

            <fieldset>
              <legend>Subject Of</legend>
              <input type="text" id="subjectOf" name="subjectOf">
              <label for="subjectOf">Subject Of</label>
            </fieldset>

            <button type="submit">Submit</button>
          </form>
        `;
    }
}
