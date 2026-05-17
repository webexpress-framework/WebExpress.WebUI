using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a radio button input form item control.
    /// </summary>
    public class ControlFormItemInputRadio : ControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Gets or sets the value of the option.
        /// </summary>
        public Func<IRenderControlContext, string> Option { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the content should be rendered inline.
        /// </summary>
        public Func<IRenderControlContext, bool> Inline { get; set; }

        /// <summary>
        /// Gets or sets the description.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets whether the radio button is selected.
        /// </summary>
        public Func<IRenderControlContext, bool> Checked { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputRadio()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputRadio(string id)
            : base(id)
        {

        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext?.GetValue<ControlFormInputValueString>(this)?.Text;
            var name = Name?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var option = Option?.Invoke(renderContext);
            var inline = Inline?.Invoke(renderContext) ?? false;
            var description = Description?.Invoke(renderContext);
            var @checked = Checked?.Invoke(renderContext) ?? false;

            if (!string.IsNullOrWhiteSpace(value))
            {
                @checked = value == option;
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("form-check", inline ? "form-check-inline" : null, GetClasses()),
                Style = GetStyles(),
            }
                .Add(new HtmlElementFieldInput()
                {
                    Name = name,
                    Type = "radio",
                    Value = option,
                    Disabled = disabled,
                    Class = Css.Concatenate("form-check-input"),
                    Checked = @checked
                })
                .Add(new HtmlElementFieldLabel()
                {
                    Class = Css.Concatenate("form-check-label"),
                    For = Id
                }
                    .Add(new HtmlText(string.IsNullOrWhiteSpace(description) ?
                        string.Empty :
                        I18N.Translate(renderContext.Request?.Culture, description)
                    )));

            return html;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be parsed and stored.
        /// </param>
        /// <param name="renderContext">
        /// The context in which the control is rendered.
        /// </param>
        /// <returns>
        /// A instance representing the parsed value, or an instance with a default 
        /// value if parsing fails.
        /// </returns>
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(value);
        }
    }
}
