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
        /// Event to validate the input values.
        /// </summary>
        event EventHandler<ValidationEventArgs> Validation;

        /// <summary>
        /// Event is raised when the form has been initialized.
        /// </summary>
        event EventHandler<FormEventArgs> InitializeForm;

        /// <summary>
        /// Event is raised when the form's data needs to be determined.
        /// </summary>
        event EventHandler<FormEventArgs> FillForm;

        /// <summary>
        /// Event is raised when the form is about to be processed.
        /// </summary>
        event EventHandler<FormEventArgs> ProcessForm;

        /// <summary>
        /// Event is raised when the form is to be processed and the next data is to be loaded.
        /// </summary>
        event EventHandler<FormEventArgs> ProcessAndNextForm;

        /// <summary>
        /// Returns or sets the name of the form.
        /// </summary>
        string Name { get; set; }

        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        string Uri { get; set; }

        /// <summary>
        /// Returns or sets the redirect uri.
        /// </summary>
        string RedirectUri { get; set; }

        /// <summary>
        /// Returns or sets the form items.
        /// </summary>
        IEnumerable<ControlFormItem> Items { get; }

        /// <summary>
        /// Returns or sets the request method.
        /// </summary>
        RequestMethod Method { get; set; }

        /// <summary>
        /// Adds one or more form control items to the form.
        /// </summary>
        /// <param name="items">The form control items to add to the form.</param>
        /// <remarks>
        /// This method allows adding one or multiple form control items to the form, enabling dynamic construction and 
        /// management of form elements. It appends the specified controls to the form's content, making it flexible for 
        /// runtime modifications.
        /// Example usage:
        /// <code>
        /// var form = new FormControl();
        /// var textBox = new ControlFormItemInputTextBox { Name = "TextBox1", Label = "Enter Text" };
        /// var checkBox = new ControlFormItem { Name = "CheckBox1", Label = "Accept Terms" };
        /// form.Add(textBox, checkBox);
        /// </code>
        /// This method accepts any item that derives from <see cref="ControlFormItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm Add(params ControlFormItem[] item);

        /// <summary> 
        /// Adds one or more form items to the content of the form.
        /// </summary> 
        /// <param name="controls">The form items to add to the form.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple form items to the <see cref="ControlFormItem"/> collection of 
        /// the form. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the form's content. 
        /// Example usage: 
        /// <code> 
        /// var form = new ControlForm(); 
        /// var button1 = new ControlButton { Text = "Save" };
        /// var button2 = new ControlButton { Text = "Cancel" };
        /// form.Add(button1, button2);
        /// </code> 
        /// This method accepts any control that implements the <see cref="ControlFormItem"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm Add(IEnumerable<ControlFormItem> items);

        /// <summary>
        /// Removes a form control item from the form.
        /// </summary>
        /// <param name="formItem">The form item.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm Remove(ControlFormItem formItem);

        /// <summary>
        /// Adds a preferences control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddPreferencesControl(params ControlFormItem[] controls);

        /// <summary>
        /// Adds a preferences form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddPreferencesButton(params ControlFormItemButton[] buttons);

        /// <summary>
        /// Adds a primary control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddPrimaryControl(params ControlFormItem[] controls);

        /// <summary>
        /// Adds a primary form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddPrimaryButton(params ControlFormItemButton[] buttons);

        /// <summary>
        /// Adds a secondary control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddSecondaryControl(params ControlFormItem[] controls);

        /// <summary>
        /// Adds a secondary form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm AddSecondaryButton(params ControlFormItemButton[] buttons);

        /// <summary>
        /// Removes a form control button from the form.
        /// </summary>
        /// <param name="button">The form button.</param>
        /// <returns>The current instance for method chaining.</returns>

        IControlForm RemoveButton(ControlFormItemButton button);

        /// <summary>
        /// Instructs to reload the initial form data.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        IControlForm Reset();

        /// <summary>
        /// Validates the input elements for correctness of the data.
        /// </summary>
        /// <param name="renderContext">The render context in which the inputs are validated.</param>
        /// <returns>True if all form items are valid, false otherwise.</returns>
        bool Validate(IRenderControlFormContext renderContext);
    }
}
