![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# RestWizardCtrl

The `RestWizardCtrl` component seamlessly transforms a standard HTML form into a highly interactive, multi-step wizard. Extending the foundational `RestFormCtrl`, this component orchestrates complex data entry processes by breaking them down into digestible, sequential steps. It uniquely combines the simplicity of static, pre-rendered HTML form fields with the flexibility of dynamic, asynchronously loaded steps. 

As users navigate through the wizard, the controller automatically handles client-side validation, state preservation, and payload aggregation. A standout feature of this component is its server-driven skip logic: the server can dictate whether a specific step is necessary based on the data entered in previous steps, allowing for highly personalized and dynamic user journeys without requiring complex client-side rules.

```text
   ┌──────────────────────────────────────────────────────────────┐
   │ (✓) Basic Data ───── (2) Settings ───── (3) Description      │
   │     John Doe            What may we send?    Tell us more    │
   ├──────────────────────────────────────────────────────────────┤
   │ Name                                                       ▲ │
   │ [ John Doe                                               ] ░ │
   │                                                            ░ │
   │ E-Mail                                                     ▼ │
   ├──────────────────────────────────────────────────────────────┤
   │ ‹ Back   Step 2 of 3                   [ Cancel ] [ Next › ] │
   └──────────────────────────────────────────────────────────────┘
```

The marker of a completed step shows a check, the current one its position. The second
line of a step states what it asks for, and reads back the answer once it has been given.
Only the pages scroll; the indicator and the buttons stay in view.

## Configuration

Initialization is handled declaratively. The host `<form>` element requires the `wx-webapp-restwizard` class and a target `data-api` endpoint for the final submission. Individual steps are defined as child containers using the `wx-wizard-page` class.

| Attribute / Class      | Description                                                                                                                                                             | Example                                          |
|------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| `wx-webapp-restwizard` | The controller class required on the host `<form>` element.                                                                                                             | `class="wx-webapp-restwizard"`                   |
| `data-api`             | The primary REST endpoint where the fully aggregated form payload will be submitted upon wizard completion.                                                               | `data-api="/api/wizard/submit"`                  |
| `wx-wizard-page`       | The class used to designate a container as a distinct step (page) within the wizard.                                                                                    | `class="wx-wizard-page"`                         |
| `data-title`           | The human-readable title of the step, which is automatically rendered in the wizard's top progress bar.                                                                 | `data-title="User Details"`                      |
| `data-subtitle`        | Optional. The secondary text below the title, stating what the step asks for while it is still open.                                                                     | `data-subtitle="Who is it for?"`                 |
| `data-summary-source`  | Optional. The name of an input in the step whose selected label replaces the subtitle once the step has been answered, so the indicator reads back the choice.            | `data-summary-source="WorkspaceId"`              |
| `data-uri`             | Optional. If provided, the step becomes *dynamic*. The wizard will perform an asynchronous POST request to this URI to fetch the step's HTML content before displaying it.| `data-uri="/api/wizard/step-2"`                  |
| `data-finish-label`    | Optional, on the host `<form>`. Replaces the generic "Finish" wording of the button that completes the wizard. `data-finish-icon` adds an icon class in front of it.       | `data-finish-label="Create issue"`               |

## Functionality

The `RestWizardCtrl` automates the entire lifecycle of a multi-step form, abstracting away the complexities of DOM manipulation, asynchronous loading, and state management.

- **Automated Layout Generation**: Upon initialization, the controller extracts all `wx-wizard-page` containers and dynamically builds a surrounding UI. This includes a top-level progress indicator built as the shared step indicator (`wx-steps`, see [Steps](steps.md)), and a synchronized bottom navigation bar containing "Back", a step counter, "Next", and "Finish" buttons. A step already passed is clickable in the indicator and returns to it.
- **Answers in the Indicator**: A step that names a `data-summary-source` shows the label of the chosen option in place of its subtitle as soon as the choice is made, so the header states what was decided rather than what was asked.
- **Static and Dynamic Steps**: Steps without a `data-uri` are treated as static; their DOM is already present and validated immediately. Steps with a `data-uri` are dynamic. When the user attempts to navigate to a dynamic step, the wizard pauses, displays a loading spinner, and sends the *current accumulated form payload* via POST to the step's URI. The server evaluates this payload and returns the relevant HTML fragment, which is safely injected and initialized.
- **Server-Side Skip Logic (HTTP 204)**: If a dynamic step is deemed unnecessary by the server (e.g., asking for shipping details when the user previously selected "Digital Download"), the server responds with a `204 No Content` HTTP status code. The wizard intercepts this, marks the step as permanently skipped, hides it from the progress bar, and seamlessly transitions to the subsequent step. This logic works bidirectionally, ensuring skipped steps are also bypassed when navigating backward.
- **Smart Caching**: To minimize network traffic, the component calculates a hash of the form's payload before requesting a dynamic step. If the user navigates backward and forward again without altering any previous inputs, the wizard utilizes the cached HTML step rather than re-requesting it from the server.
- **Progressive Validation**: Validation is enforced on a per-step basis. A user cannot proceed to the next step if the current step contains invalid inputs. Upon reaching the final step and clicking "Finish", the entire aggregated form undergoes a final validation pass before the payload is submitted to the primary `data-api` endpoint.
- **Error Handling**: If a dynamic step fails to load (e.g., HTTP 500), an error message is rendered securely within the step container, and forward navigation is blocked until the error is resolved.

## Layout

Inside a modal the wizard confines scrolling to its pages: the dialog body stops scrolling
and the page container carries the overflow instead, so the progress indicator at the top
and the buttons at the bottom stay in place however long a step is. This requires the chain
from the dialog body down to the pages to be a flex column that may shrink; the stylesheet
of the form (`webexpress.webapp.form.css`) declares it, and a rule outranking bootstrap's
`.modal-dialog-scrollable .modal-body` turns the scrolling of the body off.

The error, confirmation and prologue banners the form control keeps as direct children of
the dialog body stay above the scrolling area, so a validation message cannot scroll out of
sight.

## Required Values Without Native Validation

A control that stores its value in a hidden input — a tile picker, a segmented choice — is
barred from native constraint validation, so `required` has no effect on it. Such a control
declares `data-wx-required="true"` on its hidden input instead, which the form controller
honours in the same pass as the native rules. `data-wx-required-message` overrides the
default wording.

## Programmatic Control

While the wizard operates autonomously based on user interaction, the controller instance can be accessed to perform manual validations or trigger navigation.

### Accessing an Automatically Created Instance

```javascript
// find the host form element in the DOM
const formElement = document.getElementById('restWizard');

// retrieve the controller instance associated with the element
const wizardCtrl = webexpress.webui.Controller.getInstanceByElement(formElement);

if (wizardCtrl) {
    // manually trigger validation for the currently visible page
    const isCurrentPageValid = wizardCtrl.validateCurrentPage();

    // programmatically trigger the submission process (simulating the Finish button)
    wizardCtrl.submit();
}
```

## Use Case Examples

The wizard supports both fully static configurations, where all DOM elements are pre-rendered, and hybrid configurations involving dynamic server communication.

### Static Wizard

In this example, all pages are immediately available in the DOM. Navigation between them is instant and purely client-side.

```html
<form id="staticWizard" name="registration"
      class="wx-webapp-restwizard"
      data-api="/api/users/register">
    
    <confirm>The data was <b>successfully</b> transmitted to the server.</confirm>
    <h3>Registration</h3>

    <!-- Step 1 -->
    <div class="wx-wizard-page" data-title="Basic Data">
        <div class="mb-3">
            <label for="name" class="form-label">Name</label>
            <input id="name" name="name" type="text" class="form-control" required minlength="2" />
        </div>
    </div>

    <!-- Step 2 -->
    <div class="wx-wizard-page" data-title="Settings">
        <div class="mb-3 form-check">
            <input id="newsletter" name="newsletter" type="checkbox" class="form-check-input" value="true" />
            <label for="newsletter" class="form-check-label">Subscribe to newsletter</label>
        </div>
    </div>
</form>
```

### Dynamic Wizard with Skip Logic

In this example, the second and third steps are dynamic. When the user clicks "Next" on the first step, the wizard sends the `name` and `email` data to `/api/wizard/settings`. Depending on that data, the server either returns an HTML form fragment for the settings, or returns `204 No Content` to skip directly to the "Description" step.

```html
<form id="dynamicWizard" name="profileWizard"
      class="wx-webapp-restwizard"
      data-api="/api/profile/complete">
    
    <confirm>Your profile has been updated.</confirm>
    <h3>Setup Profile</h3>
    
    <!-- Step 1: Static -->
    <div class="wx-wizard-page" data-title="Basic Data">
        <div class="mb-3">
            <label for="name" class="form-label">Name</label>
            <input id="name" name="name" type="text" class="form-control" required />
        </div>
    </div>
    
    <!-- Step 2: Dynamic (Server evaluates Step 1 data) -->
    <div class="wx-wizard-page" 
         data-title="Settings" 
         data-uri="/api/wizard/settings">
    </div>
    
    <!-- Step 3: Dynamic -->
    <div class="wx-wizard-page" 
         data-title="Description" 
         data-uri="/api/wizard/description">
    </div>
</form>
```