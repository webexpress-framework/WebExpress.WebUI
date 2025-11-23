using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a modal form control that can display a form in a modal dialog.
    /// </summary>
    public class ControlModalForm : ControlModal, IControlForm
    {
        private readonly ControlForm _form;

        /// <summary>
        /// Event is raised when the form's data needs to be determined.
        /// </summary>
        public event Action<ControlFormEventFormInitialize> InitializeForm;

        /// <summary>
        /// Event to validate the input values.
        /// </summary>
        public event Action<ControlFormEventFormValidate> ValidateForm;

        /// <summary>
        /// Event is raised when the form is about to be processed.
        /// </summary>
        public event Action<ControlFormEventFormProcess> ProcessForm;

        /// <summary>
        /// Returns or sets the name of the form.
        /// </summary>
        public string Name { get => _form.Name; set => _form.Name = value; }

        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        public IUri Uri { get => _form.Uri; set => _form.Uri = value; }

        /// <summary>
        /// Returns or sets the redirect uri.
        /// </summary>
        public IUri RedirectUri { get => _form.RedirectUri; set => _form.RedirectUri = value; }

        /// <summary>
        /// Returns the form items.
        /// </summary>
        public IEnumerable<IControlFormItem> Items => _form.Items;

        /// <summary>
        /// Returns or sets the request method.
        /// </summary>
        public RequestMethod Method { get => _form.Method; set => _form.Method = value; }

        /// <summary>
        /// Returns or sets the confirmation control that is displayed 
        /// instead of the form after the form has been successfully submitted.
        /// </summary>
        public IControl Conformation { get => _form.Conformation; set => _form.Conformation = value; }

        /// <summary>
        /// Returns or sets the form layout.
        /// </summary>
        public TypeLayoutForm FormLayout { get => _form.FormLayout; set => _form.FormLayout = value; }

        /// <summary>
        /// Returns or sets the item layout.
        /// </summary>
        public TypeLayoutFormItem ItemLayout { get => _form.ItemLayout; set => _form.ItemLayout = value; }

        /// <summary>
        /// Return the current state of the form.
        /// </summary>
        public TypeFormState State => _form.State;

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">
        /// The name of the calling member. This is automatically provided by the compiler.
        /// </param>
        /// <param name="file">
        /// The file path of the source file where this instance is created. This is automatically 
        /// provided by the compiler.
        /// </param>
        /// <param name="line">
        /// The line number in the source file where this instance is created. This is automatically 
        /// provided by the compiler.
        /// </param>
        /// <param name="items">The form controls.</param>
        public ControlModalForm
        (
            [CallerMemberName] string instance = null,
            [CallerFilePath] string file = null,
            [CallerLineNumber] int? line = null, params IControlFormItem[] items
        )
            : this($"modal_{instance}_{file}_{line}".GetHashCode().ToString("X"), items)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The form controls.</param>
        public ControlModalForm(string id, params IControlFormItem[] items)
            : base(id)
        {
            _form = new ControlForm(id is not null ? $"form_{id}" : null, items ?? []);

            _form.InitializeForm += (e) => InitializeForm?.Invoke(e);
            _form.ValidateForm += (e) => ValidateForm?.Invoke(e);
            _form.ProcessForm += (e) => ProcessForm?.Invoke(e);
        }

        /// <summary>
        /// Initialize the form with data using the specified action.
        /// </summary>
        /// <param name="handler">The action to execute for filling the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm Initialize(Action<ControlFormEventFormInitialize> handler)
        {
            _form.InitializeForm += handler;

            return this;
        }

        /// <summary>
        /// Checks the form for correctness of the data.
        /// </summary>
        /// <param name="handler">The action to execute for validation the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm Validate(Action<ControlFormEventFormValidate> handler)
        {
            _form.ValidateForm += handler;

            return this;
        }

        /// <summary>
        /// Processes the form with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm Process(Action<ControlFormEventFormProcess> handler)
        {
            _form.ProcessForm += handler;

            return this;
        }

        /// <summary> 
        /// Adds one or more form items to the content of the form.
        /// </summary> 
        /// <param name="items">The form items to add to the form.</param> 
        /// <returns>The current instance for method chaining.</returns>
        /// <remarks> 
        /// This method allows adding one or multiple form items to the <see cref="ControlFormItem"/> collection of 
        /// the form. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the form's content. 
        /// 
        /// Example usage: 
        /// <code> 
        /// var form = new ControlForm(); 
        /// var button1 = new ControlButton { Text = "Save" };
        /// var button2 = new ControlButton { Text = "Cancel" };
        /// form.Add(button1, button2);
        /// </code> 
        /// 
        /// This method accepts any control that implements the <see cref="ControlFormItem"/> interface.
        /// </remarks>
        public virtual IControlForm Add(params IControlFormItem[] items)
        {
            _form.Add(items);

            return this;
        }

        /// <summary> 
        /// Adds one or more form items to the content of the form.
        /// </summary> 
        /// <param name="items">The form items to add to the form.</param> 
        /// <returns>The current instance for method chaining.</returns>
        /// <remarks> 
        /// This method allows adding one or multiple form items to the <see cref="ControlFormItem"/> collection of 
        /// the form. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the form's content. 
        /// 
        /// Example usage: 
        /// <code> 
        /// var form = new ControlForm(); 
        /// var button1 = new ControlButton { Text = "Save" };
        /// var button2 = new ControlButton { Text = "Cancel" };
        /// form.Add(button1, button2);
        /// </code> 
        /// 
        /// This method accepts any control that implements the <see cref="ControlFormItem"/> interface.
        /// </remarks>
        public virtual IControlForm Add(IEnumerable<IControlFormItem> items)
        {
            _form.Add(items);

            return this;
        }

        /// <summary>
        /// Removes a form item from the content of the form.
        /// </summary>
        /// <param name="item">The form item to remove from the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        /// <remarks>
        /// This method allows removing a specific form item of the form.
        /// </remarks>
        public virtual IControlForm Remove(IControlFormItem item)
        {
            _form.Remove(item);

            return this;
        }

        /// <summary>
        /// Adds a preferences control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm AddPreferencesControl(params IControlFormItem[] controls)
        {
            _form.AddPreferencesControl(controls);

            return this;
        }

        /// <summary>
        /// Adds a preferences form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm AddPreferencesButton(params IControlFormItemButton[] buttons)
        {
            _form.AddPreferencesButton(buttons);

            return this;
        }

        /// <summary>
        /// Adds a primary control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm AddPrimaryControl(params IControlFormItem[] controls)
        {
            _form.AddPrimaryControl(controls);

            return this;
        }

        /// <summary>
        /// Adds a primary form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm AddPrimaryButton(params IControlFormItemButton[] buttons)
        {
            _form.AddPrimaryButton(buttons);

            return this;
        }

        /// <summary>
        /// Adds a secondary control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm AddSecondaryControl(params IControlFormItem[] controls)
        {
            _form.AddSecondaryControl(controls);

            return this;
        }

        /// <summary>
        /// Adds a secondary form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm AddSecondaryButton(params IControlFormItemButton[] buttons)
        {
            _form.AddSecondaryButton(buttons);

            return this;
        }

        /// <summary>
        /// Removes a form control button from the form.
        /// </summary>
        /// <param name="button">The form button.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm RemoveButton(IControlFormItemButton button)
        {
            _form.RemoveButton(button);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return Render(renderContext, visualTree, _form.Items);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="items">The form items.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlFormItem> items)
        {
            var classes = Classes.ToList();
            var formElement = _form.Render(renderContext, visualTree, items);
            var header = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(renderContext, Header)))
            {
                Class = "wx-modal-header"
            };
            var content = new HtmlElementTextContentDiv()
            {
                Class = "wx-modal-content"
            };
            var footer = new HtmlElementTextContentDiv()
            {
                Class = "wx-modal-footer"
            };
            var modal = new HtmlElementTextContentDiv(header, content, footer)
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-modal", classes),
                Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                Role = "dialog"
            }
            .AddUserAttribute("data-size", Size.ToClass())
            .AddUserAttribute("data-close-label", I18N.Translate(renderContext, CloseLabel));

            if (formElement is HtmlElementFormForm form && _form.State != TypeFormState.Success)
            {
                var elements = form.Elements.Where(x => x is not HtmlElementSectionFooter && x is not HtmlElementTextContentDiv);
                var buttons = form.Elements.Find(x => x is HtmlElementFieldButton).Select(x => x as HtmlElementFieldButton)
                    .Where(x => x.Type == TypeButton.Submit.ToTypeString() || x.Type == TypeButton.Reset.ToTypeString());
                var autoShow = State switch
                {
                    TypeFormState.Default => null,
                    TypeFormState.Error => "true",
                    TypeFormState.Success => _form.Conformation is not null ? "true" : null,
                    _ => null
                };

                content.Add(elements);
                footer.Add(buttons);

                modal.AddUserAttribute("data-auto-show", State != TypeFormState.Default ? "true" : null);

                var html = new HtmlElementFormForm()
                {
                    Id = !string.IsNullOrWhiteSpace(Id) ? $"{Id}-form" : null,
                    Class = _form.FormLayout == TypeLayoutForm.Inline ? Css.Concatenate("wx-form-inline", GetClasses()) : GetClasses(),
                    Role = _form.Role,
                    Action = Uri?.ToString() ?? renderContext.Request.Uri?.ToString(),
                    Method = (Method == RequestMethod.NONE ? RequestMethod.POST : Method).ToString(),
                    Enctype = TypeEnctype.None,
                    Name = Name
                }
                .Add(modal);

                return html;
            }

            content.Add(_form.Conformation?.Render(renderContext, visualTree));
            modal.AddUserAttribute("data-auto-show", _form.Conformation is not null ? "true" : null);

            return modal;
        }
    }
}
