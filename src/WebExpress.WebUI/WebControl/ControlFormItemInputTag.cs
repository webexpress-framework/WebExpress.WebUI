using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tag input control.
    /// </summary>
    public class ControlFormItemInputTag : ControlFormItemInput<ControlFormInputValueStringList>
    {
        /// <summary>
        /// Gets or sets a placeholder text.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the color of the tags.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorTag> Color { get; set; } = _ => new PropertyColorTag(TypeColorTag.Default);

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputTag()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputTag(string id)
            : base(id)
        {
            Margin = _ => new PropertySpacingMargin(PropertySpacing.Space.None, PropertySpacing.Space.Two, PropertySpacing.Space.None, PropertySpacing.Space.None);
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
            base.Initialize(renderContext);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var id = Id;
            var classes = new List<string>(Classes);
            var value = renderContext.GetValue<ControlFormInputValueStringList>(this)?.ToString
            (
                null,
                renderContext?.Request?.Culture
            );
            var name = Name?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var role = Role?.Invoke(renderContext);
            var placeholder = Placeholder?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);

            if (disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-tag", classes),
                Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                Role = role
            }
                .AddUserAttribute("name", name)
                .AddUserAttribute("placeholder", I18N.Translate(renderContext.Request?.Culture, placeholder))
                .AddUserAttribute("data-value", value)
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle());

            return html;
        }

        /// <summary>
        /// Validates the input elements within a form for correctness of the data.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>A collection of validation results indicating any issues found.</returns>
        public override IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext)
        {
            var validationResults = new List<ValidationResult>(base.Validate(renderContext));
            var disabled = Disabled?.Invoke(renderContext) ?? false;

            if (disabled)
            {
                return [];
            }

            return validationResults;
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
        protected override ControlFormInputValueStringList CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueStringList(value);
        }
    }
}
