using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebMessage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Interface for a form control, extending the base control interface.
    /// </summary>
    public interface IControlForm : IControl
    {
        /// <summary>
        /// Event is raised when the form's data needs to be determined.
        /// </summary>
        event Action<ControlFormEventFormInitialize> InitializeForm;

        /// <summary>
        /// Event to validate the input values.
        /// </summary>
        event Action<ControlFormEventFormValidate> ValidateForm;

        /// <summary>
        /// Event is raised when the form is about to be processed.
        /// </summary>
        event Action<ControlFormEventFormProzess> ProcessForm;

        /// <summary>
        /// Returns or sets the name of the form.
        /// </summary>
        string Name { get; set; }

        /// <summary>
        /// Returns or sets the target URI.
        /// </summary>
        string Uri { get; set; }

        /// <summary>
        /// Returns or sets the redirect URI.
        /// </summary>
        string RedirectUri { get; set; }

        /// <summary>
        /// Returns or sets the form items.
        /// </summary>
        IEnumerable<IControlFormItem> Items { get; }

        /// <summary>
        /// Returns or sets the request method.
        /// </summary>
        RequestMethod Method { get; set; }

        /// <summary>
        /// Initialize the form with data using the specified action.
        /// </summary>
        /// <param name="handler">The action to execute for filling the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm Initialize(Action<ControlFormEventFormInitialize> handler);

        /// <summary>
        /// Checks the form for correctness of the data.
        /// </summary>
        /// <param name="handler">The action to execute for validation the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm Validate(Action<ControlFormEventFormValidate> handler);

        /// <summary>
        /// Processes the form with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm Process(Action<ControlFormEventFormProzess> handler);

        /// <summary>
        /// Adds one or more form control items to the form.
        /// </summary>
        /// <param name="items">The form control items to add to the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm Add(params IControlFormItem[] items);

        /// <summary>
        /// Adds one or more form items to the content of the form.
        /// </summary>
        /// <param name="items">The form items to add to the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm Add(IEnumerable<IControlFormItem> items);

        /// <summary>
        /// Removes a form control item from the form.
        /// </summary>
        /// <param name="formItem">The form item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm Remove(IControlFormItem formItem);

        /// <summary>
        /// Adds a preferences control.
        /// </summary>
        /// <param name="controls">The controls to add as preferences.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddPreferencesControl(params IControlFormItem[] controls);

        /// <summary>
        /// Adds a preferences form control button.
        /// </summary>
        /// <param name="buttons">The form buttons to add as preferences.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddPreferencesButton(params IControlFormItemButton[] buttons);

        /// <summary>
        /// Adds a primary control.
        /// </summary>
        /// <param name="controls">The controls to add as primary controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddPrimaryControl(params IControlFormItem[] controls);

        /// <summary>
        /// Adds a primary form control button.
        /// </summary>
        /// <param name="buttons">The form buttons to add as primary buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddPrimaryButton(params IControlFormItemButton[] buttons);

        /// <summary>
        /// Adds a secondary control.
        /// </summary>
        /// <param name="controls">The controls to add as secondary controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddSecondaryControl(params IControlFormItem[] controls);

        /// <summary>
        /// Adds a secondary form control button.
        /// </summary>
        /// <param name="buttons">The form buttons to add as secondary buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddSecondaryButton(params IControlFormItemButton[] buttons);

        /// <summary>
        /// Removes a form control button from the form.
        /// </summary>
        /// <param name="button">The form button to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm RemoveButton(IControlFormItemButton button);
    }
}
