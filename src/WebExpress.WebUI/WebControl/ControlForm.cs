using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebScope;
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
        private readonly List<ControlFormItem> _items = [];
        private readonly List<ControlFormItemButton> _preferencesButtons = [];
        private readonly List<ControlFormItemButton> _primaryButtons = [];
        private readonly List<ControlFormItemButton> _secondaryButtons = [];
        private readonly List<ControlFormItem> _preferencesControls = [];
        private readonly List<ControlFormItem> _primaryControls = [];
        private readonly List<ControlFormItem> _secondaryControls = [];

        /// <summary>
        /// Event to validate the input values.
        /// </summary>
        public event EventHandler<ValidationEventArgs> Validation;

        /// <summary>
        /// Event nach Abschluss der Validation
        /// </summary>
        public event EventHandler<ValidationResultEventArgs> Validated;

        /// <summary>
        /// Event is raised when the form has been initialized.
        /// </summary>
        public event EventHandler<FormEventArgs> InitializeForm;

        /// <summary>
        /// Event is raised when the form's data needs to be determined.
        /// </summary>
        public event EventHandler<FormEventArgs> FillForm;

        /// <summary>
        /// Event is raised when the form is about to be processed.
        /// </summary>
        public event EventHandler<FormEventArgs> ProcessForm;

        /// <summary>
        /// Event is raised when the form is to be processed and the next data is to be loaded.
        /// </summary>
        public event EventHandler<FormEventArgs> ProcessAndNextForm;

        /// <summary>
        /// Returns the form items.
        /// </summary>
        public IEnumerable<ControlFormItem> Items => _items;

        /// <summary>
        /// Returns or sets the name of the form.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        public string Uri { get; set; }

        /// <summary>
        /// Returns or sets the redirect uri.
        /// </summary>
        public string RedirectUri { get; set; }

        /// <summary>
        /// Returns or sets the form layout.
        /// </summary>
        public virtual TypeLayoutForm FormLayout { get; set; } = TypeLayoutForm.Default;

        /// <summary>
        /// Returns or sets the item layout.
        /// </summary>
        public virtual TypeLayoutFormItem ItemLayout { get; set; } = TypeLayoutFormItem.Vertical;

        /// <summary>
        /// Returns or sets the hidden field that contains the id.
        /// </summary>
        public ControlFormItemInputHidden FormId { get; } = new ControlFormItemInputHidden(Guid.NewGuid().ToString())
        {
            Name = "form-id"
        };

        /// <summary>
        /// Returns or sets the hidden field that contains the submit method.
        /// </summary>
        public ControlFormItemInputHidden SubmitHiddenField { get; } = new ControlFormItemInputHidden(Guid.NewGuid().ToString())
        {
            Name = "form-submit-type",
            Value = "update"
        };

        /// <summary>
        /// Returns or sets the request method.
        /// </summary>
        public RequestMethod Method { get; set; } = RequestMethod.POST;

        /// <summary>
        /// Returns or sets the header preferences section.
        /// </summary>
        protected List<IFragmentContext> HeaderPreferences { get; } = [];

        /// <summary>
        /// Returns or sets the header primary section.
        /// </summary>
        protected List<IFragmentContext> HeaderPrimary { get; } = [];

        /// <summary>
        /// Returns or sets the header secondary section.
        /// </summary>
        protected List<IFragmentContext> HeaderSecondary { get; } = [];

        /// <summary>
        /// Returns or sets the button panel preferences section.
        /// </summary>
        protected List<IFragmentContext> ButtonPanelPreferences { get; } = [];

        /// <summary>
        /// Returns or sets the button panel primary section.
        /// </summary>
        protected List<IFragmentContext> ButtonPanelPrimary { get; } = [];

        /// <summary>
        /// Returns or sets the button panel secondary section.
        /// </summary>
        protected List<IFragmentContext> ButtonPanelSecondary { get; } = [];

        /// <summary>
        /// Returns or sets the footer preferences section.
        /// </summary>
        protected List<IFragmentContext> FooterPreferences { get; } = [];

        /// <summary>
        /// Returns or sets the footer primary section.
        /// </summary>
        protected List<IFragmentContext> FooterPrimary { get; } = [];

        /// <summary>
        /// Returns or sets the footer secondary section.
        /// </summary>
        protected List<IFragmentContext> FooterSecondary { get; } = [];

        /// <summary>
        /// Returns the form buttons.
        /// </summary>
        public IEnumerable<ControlFormItemButton> Buttons => _preferencesButtons.Union(_primaryButtons).Union(_secondaryButtons);

        /// <summary>
        /// Returns or sets the horizontal alignment of the items.
        /// </summary>
        public virtual TypeJustifiedFlexbox Justify
        {
            get => (TypeJustifiedFlexbox)GetProperty(TypeJustifiedFlexbox.Start);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlForm(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The controls that are associated with the form.</param>
        public ControlForm(string id, params ControlFormItem[] items)
            : this(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="items">The controls that are associated with the form.</param>
        public ControlForm(params ControlFormItem[] items)
            : this(null, items)
        {
        }

        /// <summary>
        /// Initializes the form.
        /// </summary>
        /// <param name="context">The context in which the control is rendered.</param>
        public virtual void Initialize(RenderControlFormContext context)
        {
            // check id 
            if (string.IsNullOrWhiteSpace(Id))
            {
                //context.ApplicationContext?.PluginContext.Host.Log.Warning(I18N.Translate("webexpress.webui:form.empty.id"));
            }

            FormId.Value = Id;
        }

        /// <summary>
        /// Filling the form.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public virtual void Fill(IRenderControlFormContext renderContext)
        {
            OnFill(renderContext);
        }

        /// <summary>
        /// Checks the input element for correctness of the data.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated.</param>
        /// <returns>True if all form items are valid, false otherwise.</returns>
        public virtual bool Validate(IRenderControlFormContext renderContext)
        {
            var valid = true;
            var validationResults = renderContext.ValidationResults as List<ValidationResult>;

            foreach (var v in Items.Where(x => x is IFormValidation).Select(x => x as IFormValidation))
            {
                v.Validate(renderContext);

                if (v.ValidationResult == TypesInputValidity.Error)
                {
                    valid = false;
                }

                validationResults.AddRange(v.ValidationResults);
            }

            var args = new ValidationEventArgs() { Value = null, Context = renderContext };
            OnValidation(args);

            validationResults.AddRange(args.Results);

            if (args.Results.Where(x => x.Type == TypesInputValidity.Error).Any())
            {
                valid = false;
            }

            var validatedArgs = new ValidationResultEventArgs(valid);
            validatedArgs.Results.AddRange(validationResults);

            OnValidated(validatedArgs);

            return valid;
        }

        /// <summary>
        /// Instructs to reload the initial form data.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm Reset()
        {
            Fill(null);

            return this;
        }

        /// <summary>
        /// Pre-processing of the form.
        /// </summary>
        /// <param name="context">The context in which the control is rendered.</param>
        public virtual void PreProcess(IRenderControlFormContext renderContext)
        {

        }

        /// <summary>
        /// Processing of the form. 
        /// </summary>
        /// <param name="context">The context in which the control is rendered.</param>
        public virtual void Process(IRenderControlFormContext renderContext)
        {
            OnProcess(renderContext);

            if (!string.IsNullOrWhiteSpace(RedirectUri?.ToString()))
            {
                throw new RedirectException(RedirectUri);
            }
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
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<ControlFormItem> items)
        {
            var renderFormContext = new RenderControlFormContext(renderContext, this);
            var fill = false;
            var process = false;

            // check if and how the form was submitted
            if (renderContext.Request.GetParameter("form-id")?.Value == Id && renderContext.Request.HasParameter("form-submit-type"))
            {
                var value = renderContext.Request.GetParameter("form-submit-type")?.Value;
                switch (value)
                {
                    case "submit":
                        process = true;
                        fill = false;
                        break;
                    case "reset":
                        process = false;
                        fill = true;
                        break;
                    case "update":
                    default:
                        break;
                }
            }
            else
            {
                // first call
                fill = true;
                process = false;
            }

            // initialization
            Initialize(renderFormContext);

            foreach (var item in items)
            {
                item.Initialize(renderFormContext);
            }
            foreach (var item in Buttons)
            {
                item.Initialize(renderFormContext);
            }

            OnInitialize(renderFormContext);

            // fill the form with data
            if (fill)
            {
                Fill(renderFormContext);
            }

            // preprocessing
            PreProcess(renderFormContext);

            // process form (e.g. save form data)
            if (process && Validate(renderFormContext))
            {
                Process(renderFormContext);
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
            form.Add(SubmitHiddenField.Render(renderFormContext, visualTree));

            var header = new HtmlElementSectionHeader();
            header.Add(new ControlProgressBar()
            {
                Format = TypeFormatProgress.Animated,
                Color = new PropertyColorProgress(TypeColorProgress.Success),
                Margin = new PropertySpacingMargin(PropertySpacing.Space.None, PropertySpacing.Space.None, PropertySpacing.Space.None, PropertySpacing.Space.Three),
                Styles = ["height: 3px;", "display: none;"],
                Value = 0
            }.Render(renderFormContext, visualTree));


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

            foreach (var v in renderFormContext.ValidationResults)
            {
                var bgColor = new PropertyColorBackgroundAlert(TypeColorBackground.Default);

                switch (v.Type)
                {
                    case TypesInputValidity.Error:
                        bgColor = new PropertyColorBackgroundAlert(TypeColorBackground.Danger);
                        break;
                    case TypesInputValidity.Warning:
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

            var buttonPannel = new HtmlElementTextContentDiv() { Class = FormLayout == TypeLayoutForm.Inline ? "ms-2" : "" };
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

            if (headerPreferences.Any() || headerPrimary.Any() || headerSecondary.Any())
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
        public IControlForm Add(params ControlFormItem[] items)
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
        public IControlForm Add(IEnumerable<ControlFormItem> items)
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
        public virtual IControlForm Remove(ControlFormItem item)
        {
            _items.Remove(item);

            return this;
        }

        /// <summary>
        /// Adds a preferences control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddPreferencesControl(params ControlFormItem[] controls)
        {
            _preferencesControls.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Adds a preferences form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddPreferencesButton(params ControlFormItemButton[] buttons)
        {
            foreach (var button in buttons)
            {
                if (button is ControlFormItemButtonSubmit submitButton)
                {
                    button.OnClick = new PropertyOnClick($"$('#{SubmitHiddenField?.Id}').val('submit');submit();");
                }
                else if (button is ControlFormItemButtonReset resetButton)
                {
                    button.OnClick = new PropertyOnClick($"$('#{SubmitHiddenField?.Id}').val('reset');submit();");
                }
            }

            _preferencesButtons.AddRange(buttons);

            return this;
        }

        /// <summary>
        /// Adds a primary control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddPrimaryControl(params ControlFormItem[] controls)
        {
            _primaryControls.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Adds a primary form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddPrimaryButton(params ControlFormItemButton[] buttons)
        {
            foreach (var button in buttons)
            {
                if (button is ControlFormItemButtonSubmit submitButton)
                {
                    button.OnClick = new PropertyOnClick($"$('#{SubmitHiddenField?.Id}').val('submit');submit();");
                }
                else if (button is ControlFormItemButtonReset resetButton)
                {
                    button.OnClick = new PropertyOnClick($"$('#{SubmitHiddenField?.Id}').val('reset');submit();");
                }
            }

            _primaryButtons.AddRange(buttons);

            return this;
        }

        /// <summary>
        /// Adds a secondary control.
        /// </summary>
        /// <param name="controls">The controls.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddSecondaryControl(params ControlFormItem[] controls)
        {
            _secondaryControls.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Adds a secondary form control button.
        /// </summary>
        /// <param name="button">The form buttons.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlForm AddSecondaryButton(params ControlFormItemButton[] buttons)
        {
            foreach (var button in buttons)
            {
                if (button is ControlFormItemButtonSubmit submitButton)
                {
                    button.OnClick = new PropertyOnClick($"$('#{SubmitHiddenField?.Id}').val('submit');submit();");
                }
                else if (button is ControlFormItemButtonReset resetButton)
                {
                    button.OnClick = new PropertyOnClick($"$('#{SubmitHiddenField?.Id}').val('reset');submit();");
                }
            }

            _secondaryButtons.AddRange(buttons);

            return this;
        }

        /// <summary>
        /// Removes a form control button from the form.
        /// </summary>
        /// <param name="button">The form button.</param>
        /// <returns>The current instance for method chaining.</returns>

        public IControlForm RemoveButton(ControlFormItemButton button)
        {
            _preferencesButtons.Remove(button);
            _primaryButtons.Remove(button);
            _secondaryButtons.Remove(button);

            return this;
        }

        /// <summary>
        /// Raises the process event.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        protected virtual void OnProcess(IRenderControlFormContext renderContext)
        {
            ProcessForm?.Invoke(this, new FormEventArgs() { Context = renderContext });
        }

        /// <summary>
        /// Raises the process event.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        protected virtual void OnProcessAndNextForm(IRenderControlFormContext renderContext)
        {
            ProcessAndNextForm?.Invoke(this, new FormEventArgs() { Context = renderContext });
        }

        /// <summary>
        /// Raises the Initializations event.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        protected virtual void OnInitialize(IRenderControlFormContext renderContext)
        {
            InitializeForm?.Invoke(this, new FormEventArgs() { Context = renderContext });
        }

        /// <summary>
        /// Raises the data delivery event.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        protected virtual void OnFill(IRenderControlFormContext renderContext)
        {
            FillForm?.Invoke(this, new FormEventArgs() { Context = renderContext });
        }

        /// <summary>
        /// Raises the validation event.
        /// </summary>
        /// <param name="e">The event argument.</param>
        protected virtual void OnValidation(ValidationEventArgs e)
        {
            Validation?.Invoke(this, e);
        }

        /// <summary>
        /// Raises the Validated event.
        /// </summary>
        /// <param name="e">The event argument.</param>
        protected virtual void OnValidated(ValidationResultEventArgs e)
        {
            Validated?.Invoke(this, e);
        }
    }
}
