using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using WebExpress.WebCore;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebScope;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebFragment;
using WebExpress.WebUI.WebPage;
using WebExpress.WebUI.WebSection;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form with various input fields and controls.
    /// </summary>
    public class ControlForm : Control, IControlForm, IScope
    {
        private readonly List<IControlFormItem> _items = [];
        private readonly List<IControlFormItemButton> _preferencesButtons = [];
        private readonly List<IControlFormItemButton> _primaryButtons = [];
        private readonly List<IControlFormItemButton> _secondaryButtons = [];
        private readonly List<IControlFormItem> _preferencesControls = [];
        private readonly List<IControlFormItem> _primaryControls = [];
        private readonly List<IControlFormItem> _secondaryControls = [];

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
        public event Action<ControlFormEventFormProzess> ProcessForm;

        /// <summary>
        /// Returns the form items.
        /// </summary>
        public IEnumerable<IControlFormItem> Items => _items;

        /// <summary>
        /// Returns or sets the name of the form.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Returns or sets the redirect uri.
        /// </summary>
        public IUri RedirectUri { get; set; }

        /// <summary>
        /// Returns or sets the form layout.
        /// </summary>
        public TypeLayoutForm FormLayout { get; set; } = TypeLayoutForm.Default;

        /// <summary>
        /// Returns or sets the item layout.
        /// </summary>
        public TypeLayoutFormItem ItemLayout { get; set; } = TypeLayoutFormItem.Vertical;

        /// <summary>
        /// Return the current state of the form.
        /// </summary>
        public TypeFormState State { get; protected set; } = TypeFormState.Default;

        /// <summary>
        /// Returns or sets the hidden field that contains the session id.
        /// </summary>
        public ControlFormItemInputHidden FormId { get; } = new ControlFormItemInputHidden().Initialize
        (
            x => x.Value = x.Context?.Request.Session.Id.ToString()
        ) as ControlFormItemInputHidden;

        /// <summary>
        /// Returns or sets the request method.
        /// </summary>
        public RequestMethod Method { get; set; } = RequestMethod.POST;

        /// <summary>
        /// Returns or sets the header preferences section.
        /// </summary>
        protected IEnumerable<IFragmentContext> HeaderPreferences { get; } = [];

        /// <summary>
        /// Returns or sets the header primary section.
        /// </summary>
        protected IEnumerable<IFragmentContext> HeaderPrimary { get; } = [];

        /// <summary>
        /// Returns or sets the header secondary section.
        /// </summary>
        protected IEnumerable<IFragmentContext> HeaderSecondary { get; } = [];

        /// <summary>
        /// Returns or sets the button panel preferences section.
        /// </summary>
        protected IEnumerable<IFragmentContext> ButtonPanelPreferences { get; } = [];

        /// <summary>
        /// Returns or sets the button panel primary section.
        /// </summary>
        protected IEnumerable<IFragmentContext> ButtonPanelPrimary { get; } = [];

        /// <summary>
        /// Returns or sets the button panel secondary section.
        /// </summary>
        protected IEnumerable<IFragmentContext> ButtonPanelSecondary { get; } = [];

        /// <summary>
        /// Returns or sets the footer preferences section.
        /// </summary>
        protected IEnumerable<IFragmentContext> FooterPreferences { get; } = [];

        /// <summary>
        /// Returns or sets the footer primary section.
        /// </summary>
        protected IEnumerable<IFragmentContext> FooterPrimary { get; } = [];

        /// <summary>
        /// Returns or sets the footer secondary section.
        /// </summary>
        protected IEnumerable<IFragmentContext> FooterSecondary { get; } = [];

        /// <summary>
        /// Returns the form buttons.
        /// </summary>
        public IEnumerable<IControlFormItemButton> Buttons => _preferencesButtons.Union(_primaryButtons).Union(_secondaryButtons);

        /// <summary>
        /// Returns or sets the horizontal alignment of the items.
        /// </summary>
        public virtual TypeJustifiedFlexbox Justify
        {
            get => (TypeJustifiedFlexbox)GetProperty(TypeJustifiedFlexbox.Start);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the confirmation control that is displayed 
        /// instead of the form after the form has been successfully submitted.
        /// </summary>
        public IControl Conformation { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">The name of the calling member. This is automatically provided by the compiler.</param>
        /// <param name="file">The file path of the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="line">The line number in the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="items">The form items to add to the form.</param>
        public ControlForm([CallerMemberName] string instance = null, [CallerFilePath] string file = null, [CallerLineNumber] int? line = null, params IControlFormItem[] items)
            : this($"{instance}_{file}_{line}".GetHashCode().ToString("X"), items)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The controls that are associated with the form.</param>
        public ControlForm(string id, params IControlFormItem[] items)
            : base(id)
        {
            FormId.Name = id;
            _items.AddRange(items);
        }

        /// <summary>
        /// Initialize the form with data using the specified action.
        /// </summary>
        /// <param name="handler">The action to execute for filling the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm Initialize(Action<ControlFormEventFormInitialize> handler)
        {
            InitializeForm += handler;

            return this;
        }

        /// <summary>
        /// Checks the form for correctness of the data.
        /// </summary>
        /// <param name="handler">The action to execute for validation the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm Validate(Action<ControlFormEventFormValidate> handler)
        {
            ValidateForm += handler;

            return this;
        }

        /// <summary>
        /// Processes the form with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm Process(Action<ControlFormEventFormProzess> handler)
        {
            ProcessForm += handler;

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
            return Render(renderContext, visualTree, Items);
        }

        /// <summary>
        /// Convert to html.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="items">The form items.</param>
        /// <returns>The control as html.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlFormItem> items)
        {
            var renderFormContext = new RenderControlFormContext(renderContext, this);
            var validationResults = new List<ValidationResult>();

            // check if and how the form was submitted
            if (!renderContext.Request.HasParameter(FormId.Name) || State == TypeFormState.Success)
            {
                State = TypeFormState.Default;

                // uninizialized form
                // fill the form with data
                foreach (var item in items)
                {
                    item.Initialize(renderFormContext);
                }
                foreach (var item in Buttons)
                {
                    item.Initialize(renderFormContext);
                }

                OnInitialize(new ControlFormEventFormInitialize() { Context = renderFormContext });
            }
            else
            {
                State = TypeFormState.Error;

                foreach (var item in items.Where(x => x is IControlFormItemInput).Select(x => x as IControlFormItemInput))
                {
                    renderFormContext.SetValue(item, renderFormContext.Request.GetParameter(item.Name)?.Value);
                }

                // valid the form
                var validateEventArgument = new ControlFormEventFormValidate() { Context = renderFormContext };

                foreach (var item in items.Where(x => x is IControlFormValidation).Select(x => x as IControlFormValidation))
                {
                    validationResults.AddRange(item.Validate(renderFormContext));
                }

                OnValidate(validateEventArgument);
                validationResults.AddRange(validateEventArgument.Results);

                if (validationResults.Count == 0)
                {
                    State = TypeFormState.Success;

                    foreach (var item in items.Where(x => x is IControlFormProcess).Select(x => x as IControlFormProcess))
                    {
                        item.Process(renderFormContext);
                    }

                    // valid form
                    OnProcess(new ControlFormEventFormProzess() { Context = renderFormContext });

                    if (RedirectUri?.Empty == false)
                    {
                        throw new RedirectException(RedirectUri);
                    }

                    if (Conformation != null)
                    {
                        return Conformation.Render(renderContext, visualTree);
                    }
                }
            }

            // generate html
            var form = new HtmlElementFormForm()
            {
                Id = Id,
                Class = FormLayout == TypeLayoutForm.Inline ? Css.Concatenate("wx-form-inline", GetClasses()) : GetClasses(),
                Style = GetStyles(),
                Role = Role,
                Action = Uri?.ToString() ?? renderFormContext.Uri?.ToString(),
                Method = (Method == RequestMethod.NONE ? RequestMethod.POST : Method).ToString(),
                Enctype = TypeEnctype.None,
                Name = Name
            };

            form.Add(FormId.Render(renderFormContext, visualTree));

            var header = new HtmlElementSectionHeader();

            var headerPreferences = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControl, SectionFormHeaderPreferences>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );
            var headerPrimary = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControl, SectionFormHeaderPrimary>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );
            var headerSecondary = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControl, SectionFormHeaderSecondary>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );
            header.Add(headerPreferences.Select(x => x.Render(renderFormContext, visualTree)));
            header.Add(headerPrimary.Select(x => x.Render(renderFormContext, visualTree)));
            header.Add(headerSecondary.Select(x => x.Render(renderFormContext, visualTree)));

            foreach (var v in validationResults)
            {
                var bgColor = new PropertyColorBackgroundAlert(TypeColorBackground.Default);

                switch (v.Type)
                {
                    case TypeInputValidity.Error:
                        bgColor = new PropertyColorBackgroundAlert(TypeColorBackground.Danger);
                        break;
                    case TypeInputValidity.Warning:
                        bgColor = new PropertyColorBackgroundAlert(TypeColorBackground.Warning);
                        break;
                }

                header.Add(new ControlAlert()
                {
                    BackgroundColor = bgColor,
                    Text = I18N.Translate(renderContext.Request?.Culture, v.Text),
                    Dismissible = TypeDismissibleAlert.Dismissible,
                    Fade = TypeFade.FadeShow
                }.Render(renderFormContext, visualTree));
            }

            foreach (var item in items.Where(x => x is ControlFormItemInputHidden))
            {
                form.Add(item.Render(renderFormContext, visualTree));
            }

            var main = new HtmlElementSectionMain();

            var group = default(ControlFormItemGroup);

            group = ItemLayout switch
            {
                TypeLayoutFormItem.Horizontal => new ControlFormItemGroupHorizontal(),
                TypeLayoutFormItem.Mix => new ControlFormItemGroupMix(),
                _ => new ControlFormItemGroupVertical(),
            };

            foreach (var item in items.Where(x => x is not ControlFormItemInputHidden))
            {
                group.Items.Add(item);
            }

            main.Add(group.Render(renderFormContext, visualTree));

            var buttonPannel = new HtmlElementTextContentDiv()
            {
                Class = FormLayout == TypeLayoutForm.Inline ? "ms-2" : ""
            };
            buttonPannel.Add(Buttons.Select(x => x.Render(renderFormContext, visualTree)));

            var footer = new HtmlElementSectionFooter();
            var footerPreferences = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControl, SectionFormFooterPreferences>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );
            var footerPrimary = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControl, SectionFormFooterPrimary>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );
            var footerSecondary = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControl, SectionFormFooterSecondary>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );
            footer.Add(footerPreferences.Select(x => x.Render(renderFormContext, visualTree)));
            footer.Add(footerPrimary.Select(x => x.Render(renderFormContext, visualTree)));
            footer.Add(footerSecondary.Select(x => x.Render(renderFormContext, visualTree)));

            if (header.Elements.Any())
            {
                form.Add(header);
            }

            form.Add(main);
            form.Add(buttonPannel);

            if (footerPreferences.Any() || footerPrimary.Any() || footerSecondary.Any())
            {
                form.Add(footer);
            }

            visualTree.AddScript(Id, $"new webexpress.webui.form.progess('{Id}', '{Method}');");

            return form;
        }

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
        public IControlForm Add(params IControlFormItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

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
        public IControlForm Add(IEnumerable<IControlFormItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a form item from the content of the form.
        /// </summary>
        /// <param name="item">The form item to remove from the form.</param>
        /// <remarks>
        /// This method allows removing a specific form item from the <see cref="Items"/> collection of 
        /// the form.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlForm Remove(IControlFormItem item)
        {
            _items.Remove(item);

            return this;
        }

        /// <summary>
        /// Adds a preferences control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddPreferencesControl(params IControlFormItem[] controls)
        {
            _preferencesControls.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Adds a preferences form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddPreferencesButton(params IControlFormItemButton[] buttons)
        {
            _preferencesButtons.AddRange(buttons);

            return this;
        }

        /// <summary>
        /// Adds a primary control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddPrimaryControl(params IControlFormItem[] controls)
        {
            _primaryControls.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Adds a primary form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddPrimaryButton(params IControlFormItemButton[] buttons)
        {
            _primaryButtons.AddRange(buttons);

            return this;
        }

        /// <summary>
        /// Adds a secondary control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddSecondaryControl(params IControlFormItem[] controls)
        {
            _secondaryControls.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Adds a secondary form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddSecondaryButton(params IControlFormItemButton[] buttons)
        {
            _secondaryButtons.AddRange(buttons);

            return this;
        }

        /// <summary>
        /// Removes a form control button from the form.
        /// </summary>
        /// <param name="button">The form button.</param>
        /// <returns>The current instance for method chaining.</returns>

        public IControlForm RemoveButton(IControlFormItemButton button)
        {
            _preferencesButtons.Remove(button);
            _primaryButtons.Remove(button);
            _secondaryButtons.Remove(button);

            return this;
        }

        /// <summary>
        /// Instructs to reload the initial form data.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        protected IControlForm Reset()
        {
            Initialize(null);

            return this;
        }

        /// <summary>
        /// Raises the data delivery event.
        /// </summary>
        /// <param name="eventArgument">The context in which the control is rendered.</param>
        protected virtual void OnInitialize(ControlFormEventFormInitialize eventArgument)
        {
            InitializeForm?.Invoke(eventArgument);
        }

        /// <summary>
        /// Raises the validation event.
        /// </summary>
        /// <param name="eventArgument">The event argument.</param>
        protected virtual void OnValidate(ControlFormEventFormValidate eventArgument)
        {
            ValidateForm?.Invoke(eventArgument);
        }

        /// <summary>
        /// Raises the process event.
        /// </summary>
        /// <param name="eventArgument">The context in which the control is rendered.</param>
        protected virtual void OnProcess(ControlFormEventFormProzess eventArgument)
        {
            ProcessForm?.Invoke(eventArgument);
        }
    }
}
