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
        /// Returns or sets whether the checkbox should be displayed on a new line.
        /// </summary>
        public bool Inline { get; set; }

        /// <summary>
        /// Returns or sets the description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Returns or sets the layout configuration for the type.
        /// </summary>
        public TypeLayoutCheck Layout { get; set; } = TypeLayoutCheck.Default;

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

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate(Layout.ToClass(), Inline ? "form-check-inline" : null, GetClasses()),
                Style = GetStyles(),
            }
                .Add(new HtmlElementFieldInput()
                {
                    Name = Name,
                    Type = "checkbox",
                    Disabled = Disabled,
                    Class = Css.Concatenate("form-check-input"),
                    Checked = value ?? false,
                })
                .Add(new HtmlElementFieldLabel()
                {
                    Class = Css.Concatenate("form-check-label"),
                    For = Id
                }
                    .Add(new HtmlText(string.IsNullOrWhiteSpace(Description) ?
                        string.Empty :
                        I18N.Translate(renderContext.Request?.Culture, Description)
                    )));

            return html;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be converted. Cannot be null.
        /// </param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>
        /// The value created from the specified string representation.
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
