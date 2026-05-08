using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a progress bar control.
    /// </summary>
    public class ControlProgress : Control
    {
        /// <summary>
        /// Gets or sets the format of the progress bar.
        /// </summary>
        public Func<IRenderControlContext, TypeFormatProgress> Format { get; set; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeProgress> Size
        {
            get => (Func<IRenderControlContext, TypeSizeProgress>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass(), () => value?.Invoke(null).ToStyle());
        }

        /// <summary>
        /// Gets or sets the progress bar color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorProgress> Color { get; set; }

        /// <summary>
        /// Gets or sets the text color.
        /// </summary>
        public new Func<IRenderControlContext, PropertyColorText> TextColor { get; set; }

        /// <summary>
        /// Gets or sets the value.
        /// </summary>
        public Func<IRenderControlContext, uint> Value { get; set; } = _ => 0;

        /// <summary>
        /// Gets or sets the minimum value.
        /// </summary>
        public Func<IRenderControlContext, uint> Min { get; set; } = _ => 0;

        /// <summary>
        /// Gets or sets the maximum value.
        /// </summary>
        public Func<IRenderControlContext, uint> Max { get; set; } = _ => 100;

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlProgress(string id = null)
            : base(id)
        {
            BackgroundColor = _ => new PropertyColorBackground(TypeColorBackground.Default);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var role = Role?.Invoke(renderContext);
            var format = Format?.Invoke(renderContext) ?? TypeFormatProgress.Default;
            var color = Color?.Invoke(renderContext);
            var textColor = TextColor?.Invoke(renderContext);
            var value = Value?.Invoke(renderContext) ?? 0;
            var min = Min?.Invoke(renderContext) ?? 0;
            var max = Max?.Invoke(renderContext) ?? 100;
            var text = Text?.Invoke(renderContext);

            if (format == TypeFormatProgress.Default)
            {
                return new HtmlElementFormProgress(value + "%")
                {
                    Id = Id,
                    Class = GetClasses(),
                    Style = GetStyles(),
                    Role = role,
                    Min = min.ToString(),
                    Max = max.ToString(),
                    Value = value.ToString()
                };
            }

            var bar = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(renderContext.Request?.Culture, text)))
            {
                Role = "progressbar",
                Class = Css.Concatenate
                (
                    "progress-bar",
                    color?.ToClass(),
                    textColor?.ToClass(),
                    format.ToClass()
                ),
                Style = Css.Concatenate
                (
                    "width: " + value + "%;",
                    color?.ToStyle(),
                    textColor?.ToStyle()
                )
            };
            bar.AddUserAttribute("aria-valuenow", value.ToString());
            bar.AddUserAttribute("aria-valuemin", min.ToString());
            bar.AddUserAttribute("aria-valuemax", max.ToString());

            var html = new HtmlElementTextContentDiv(bar)
            {
                Id = Id,
                Role = role,
                Class = Css.Concatenate
                (
                    "progress",
                    GetClasses()
                ),
                Style = GetStyles()
            };

            return html;
        }
    }
}
