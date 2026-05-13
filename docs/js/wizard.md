![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# RestWizardCtrl

The `RestWizardCtrl` component seamlessly transforms a standard HTML form into a highly interactive, multi-step wizard. Extending the foundational `RestFormCtrl`, this component orchestrates complex data entry processes by breaking them down into digestible, sequential steps. It uniquely combines the simplicity of static, pre-rendered HTML form fields with the flexibility of dynamic, asynchronously loaded steps. 

As users navigate through the wizard, the controller automatically handles client-side validation, state preservation, and payload aggregation. A standout feature of this component is its server-driven skip logic: the server can dictate whether a specific step is necessary based on the data entered in previous steps, allowing for highly personalized and dynamic user journeys without requiring complex client-side rules.

```text
   ┌────────────────────────────────────────────────────────┐
   │ ── Basic Data ──── Settings ──── Description ────────  │
   ├────────────────────────────────────────────────────────┤
   │ Name                                                   │
   │ [ John Doe                                           ] │
   │                                                        │
   │ E-Mail                                                 │
   │ [ john@example.com                                   ] │
   ├────────────────────────────────────────────────────────┤
   │ [ Previous ]                                  [ Next ] │
   └────────────────────────────────────────────────────────┘
```

## Configuration

Initialization is handled declaratively. The host `<form>` element requires the `wx-webapp-restwizard` class and a target `data-api` endpoint for the final submission. Individual steps are defined as child containers using the `wx-wizard-page` class.

| Attribute / Class      | Description                                                                                                                                                             | Example                                          |
|------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| `wx-webapp-restwizard` | The controller class required on the host `<form>` element.                                                                                                             | `class="wx-webapp-restwizard"`                   |
| `data-api`             | The primary REST endpoint where the fully aggregated form payload will be submitted upon wizard completion.                                                               | `data-api="/api/wizard/submit"`                  |
| `wx-wizard-page`       | The class used to designate a container as a distinct step (page) within the wizard.                                                                                    | `class="wx-wizard-page"`                         |
| `data-title`           | The human-readable title of the step, which is automatically rendered in the wizard's top progress bar.                                                                 | `data-title="User Details"`                      |
| `data-uri`             | Optional. If provided, the step becomes *dynamic*. The wizard will perform an asynchronous POST request to this URI to fetch the step's HTML content before displaying it.| `data-uri="/api/wizard/step-2"`                  |

## Functionality

The `RestWizardCtrl` automates the entire lifecycle of a multi-step form, abstracting away the complexities of DOM manipulation, asynchronous loading, and state management.

- **Automated Layout Generation**: Upon initialization, the controller extracts all `wx-wizard-page` containers and dynamically builds a surrounding UI. This includes a top-level progress indicator displaying the step titles, and a synchronized bottom navigation bar containing "Previous", "Next", and "Finish" buttons.
- **Static and Dynamic Steps**: Steps without a `data-uri` are treated as static; their DOM is already present and validated immediately. Steps with a `data-uri` are dynamic. When the user attempts to navigate to a dynamic step, the wizard pauses, displays a loading spinner, and sends the *current accumulated form payload* via POST to the step's URI. The server evaluates this payload and returns the relevant HTML fragment, which is safely injected and initialized.
- **Server-Side Skip Logic (HTTP 204)**: If a dynamic step is deemed unnecessary by the server (e.g., asking for shipping details when the user previously selected "Digital Download"), the server responds with a `204 No Content` HTTP status code. The wizard intercepts this, marks the step as permanently skipped, hides it from the progress bar, and seamlessly transitions to the subsequent step. This logic works bidirectionally, ensuring skipped steps are also bypassed when navigating backward.
- **Smart Caching**: To minimize network traffic, the component calculates a hash of the form's payload before requesting a dynamic step. If the user navigates backward and forward again without altering any previous inputs, the wizard utilizes the cached HTML step rather than re-requesting it from the server.
- **Progressive Validation**: Validation is enforced on a per-step basis. A user cannot proceed to the next step if the current step contains invalid inputs. Upon reaching the final step and clicking "Finish", the entire aggregated form undergoes a final validation pass before the payload is submitted to the primary `data-api` endpoint.
- **Error Handling**: If a dynamic step fails to load (e.g., HTTP 500), an error message is rendered securely within the step container, and forward navigation is blocked until the error is resolved.

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