using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a checkbox input form item control.
    /// </summary>
    public class ControlFormItemInputCheck : ControlFormItemInput<ControlFormInputValueBool>
    {
        /// <summary>
        /// Gets or sets whether the checkbox should be displayed on a new line.
        /// </summary>
        public Func<IRenderControlContext, bool> Inline { get; set; }

        /// <summary>
        /// Gets or sets the description.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets the layout configuration for the type.
        /// </summary>
        public Func<IRenderControlContext, TypeLayoutCheck> Layout { get; set; } = _ => TypeLayoutCheck.Default;

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputCheck()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id.</param>
        public ControlFormItemInputCheck(string id)
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
            var value = renderContext.GetValue<ControlFormInputValueBool>(this)?.Checked;
            var name = Name?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var inline = Inline?.Invoke(renderContext) ?? false;
            var layout = Layout?.Invoke(renderContext) ?? TypeLayoutCheck.Default;
            var description = Description?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Class = Css.Concatenate(layout.ToClass(), inline ? "form-check-inline" : null, GetClasses()),
                Style = GetStyles(),
            }
                .Add(new HtmlElementFieldInput()
                {
                    Id = Id,
                    Name = name,
                    Type = "checkbox",
                    Disabled = disabled,
                    Class = Css.Concatenate("form-check-input"),
                    Checked = value ?? false,
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
        protected override ControlFormInputValueBool CreateValue(string value, IRenderControlFormContext renderContext)
        {
            var @checked = value?.Equals("true", StringComparison.OrdinalIgnoreCase) == true ||
                          value?.Equals("on", StringComparison.OrdinalIgnoreCase) == true;

            return new ControlFormInputValueBool
            {
                Checked = @checked
            };
        }
    }
}
