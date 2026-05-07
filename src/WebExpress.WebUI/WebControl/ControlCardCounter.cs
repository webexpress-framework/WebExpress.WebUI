using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a counter with an icon, value, progress, and text.
    /// </summary>
    public class ControlCardCounter : Control
    {
        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the counter value.
        /// </summary>
        public Func<IRenderControlContext, int?> Value { get; set; }

        /// <summary>
        /// Gets or sets the value of the progrss.
        /// </summary>
        public Func<IRenderControlContext, uint?> Progress { get; set; }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlCardCounter(string id = null)
            : base(id)
        {
            TextColor = _ => new PropertyColorText(TypeColorText.Default);
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
            var icon = Icon?.Invoke(renderContext);
            var value = Value?.Invoke(renderContext);
            var text = Text?.Invoke(renderContext);
            var progress = Progress?.Invoke(renderContext);

            var html = new HtmlElementTextSemanticsSpan()
            {
                Id = Id,
                Class = Css.Concatenate("card-counter", GetClasses()),
                Style = GetStyles(),
                Role = role
            };

            if (Icon is not null)
            {
                html.Add(new ControlIcon()
                {
                    Icon = icon,
                    TextColor = TextColor,
                    HorizontalAlignment = _ => TypeHorizontalAlignment.Right
                }.Render(renderContext, visualTree));
            }

            var textCtrl = new ControlText(string.IsNullOrWhiteSpace(Id) ? null : Id + "_header")
            {
                Text = value.HasValue ? value.Value.ToString() : null,
                Format = TypeFormatText.H4
            };

            var info = new ControlText()
            {
                Text = text,
                Format = TypeFormatText.Span,
                TextColor = new PropertyColorText(TypeColorText.Muted)
            };

            html.Add(new ControlPanel(null, textCtrl, info) { }.Render(renderContext, visualTree));

            if (progress.HasValue)
            {
                html.Add(new ControlProgress()
                {
                    Value = progress.Value,
                    Format = TypeFormatProgress.Striped,
                    BackgroundColor = BackgroundColor,
                    //Color = Color,
                    Size = TypeSizeProgress.Small
                }.Render(renderContext, visualTree));
            }

            return html;
        }
    }
}
