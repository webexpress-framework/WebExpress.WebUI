using System;
using System.Collections.Generic;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Base of the text inputs whose value follows a fixed notation - an e-mail address, a domain
    /// account, a host name, an IP address. Each is a native input the browser fills and checks
    /// as far as it can; the server brings the posted text into its normalized form, so the page
    /// processes one spelling of a value, and refuses a text that is no such value.
    /// </summary>
    public abstract class ControlFormItemInputFormatted : ControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Gets or sets the text shown while the field is empty. Left unset, the input shows an
        /// example of its notation where it has one.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets the type of the native input, which picks the keyboard on a touch device and the
        /// check the browser applies.
        /// </summary>
        protected abstract string InputType { get; }

        /// <summary>
        /// Gets the autocomplete token that lets the browser offer what it knows for the field.
        /// </summary>
        protected virtual string AutoComplete => null;

        /// <summary>
        /// Gets the internationalization key of the message for a text that is no such value.
        /// </summary>
        protected abstract string InvalidMessage { get; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        protected ControlFormItemInputFormatted(string id)
            : base(id)
        {
            Margin = _ => new PropertySpacingMargin(PropertySpacing.Space.None, PropertySpacing.Space.Two, PropertySpacing.Space.None, PropertySpacing.Space.None);
        }

        /// <summary>
        /// Brings a text into the normalized form of the value.
        /// </summary>
        /// <param name="value">The text as posted.</param>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The normalized value, or null if the text is no such value.</returns>
        protected abstract string Normalize(string value, IRenderControlContext renderContext);

        /// <summary>
        /// Says why a text is no such value, where the field can tell more than that it is invalid.
        /// </summary>
        /// <param name="value">The text as posted.</param>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The internationalization key of the message.</returns>
        protected virtual string Reject(string value, IRenderControlContext renderContext)
        {
            return InvalidMessage;
        }

        /// <summary>
        /// Applies the rules of the field beyond the notation, such as a list of permitted domains.
        /// </summary>
        /// <param name="value">The normalized value.</param>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The internationalization key of the message, or null if the value is accepted.</returns>
        protected virtual string Check(string value, IRenderControlContext renderContext)
        {
            return null;
        }

        /// <summary>
        /// Returns the example of the notation shown while the field is empty.
        /// </summary>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The internationalization key or text of the example, or null for none.</returns>
        protected virtual string DefaultPlaceholder(IRenderControlContext renderContext)
        {
            return null;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var placeholder = Placeholder?.Invoke(renderContext) ?? DefaultPlaceholder(renderContext);

            var html = new HtmlElementFieldInput()
            {
                Id = Id,
                Value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text,
                Name = Name?.Invoke(renderContext),
                Required = Required?.Invoke(renderContext) ?? false,
                Type = InputType,
                Disabled = disabled,
                Class = Css.Concatenate("form-control", disabled ? "disabled" : null, GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext),
                Placeholder = I18N.Translate(renderContext, placeholder)
            };

            // a value of fixed notation is neither a word to correct nor a sentence to capitalize
            html.AddUserAttribute("autocomplete", AutoComplete)
                .AddUserAttribute("spellcheck", "false")
                .AddUserAttribute("autocapitalize", "off");

            return html;
        }

        /// <summary>
        /// Validates the input: besides the rules of every input, the text must be a value of the
        /// notation and keep the rules of the field.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated.</param>
        /// <returns>The validation results.</returns>
        public override IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext)
        {
            // an empty field is left to the required rule; optional, it has no notation to break
            var current = renderContext.GetValue<ControlFormInputValueString>(this);
            if ((Disabled?.Invoke(renderContext) ?? false) || IsEmpty(current, renderContext))
            {
                return base.Validate(renderContext);
            }

            var value = current.Text;
            var normalized = Normalize(value, renderContext);
            var message = normalized is null ? Reject(value, renderContext) : Check(normalized, renderContext);

            return message is null
                ? base.Validate(renderContext)
                : [new ValidationResult(TypeInputValidity.Error, message)];
        }

        /// <summary>
        /// Creates the value from the posted text: normalized where it is a value of the
        /// notation, as posted where it is not, so the field shows the user what was refused.
        /// </summary>
        /// <param name="value">The posted text.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The value.</returns>
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(Normalize(value, renderContext) ?? value);
        }
    }
}
