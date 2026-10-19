# Agent guidelines

## Commit messages

- Follow the existing history: use a short, specific subject in the form
  `<area>: <change>`, with a lowercase area and an imperative description.
  Use the affected component or topic as the area, such as `matomo`, `hitbox`,
  `file modal`, `tugonline`, `api`, or `translations`.
- Examples include `matomo: set production site ID to 226`,
  `hitbox: adjust style of TUGrazonline document tag`,
  and `finetuning: remove form placeholders`. Use a general prefix such as
  `fix` when appropriate; strict Conventional Commits are not required.
- Keep the subject focused on the main change, without a trailing period.
- The commit description (body) can also be used. Separate it from the
  subject with a blank line and explain why the change is needed, relevant
  context, or details that do not fit in the subject. Short paragraphs or
  bullet lists are both consistent with the history. Omit the body when the
  subject is sufficient.

Example with a description:

```text
finetuning: remove form placeholders

- replace informative placeholders with field descriptions
- remove placeholders that duplicate labels
```
