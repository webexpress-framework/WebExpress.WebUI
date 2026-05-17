using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that displays multiple progress bars.
    /// </summary>
    public class ControlMultipleProgressBar : Control
    {
        private readonly List<ControlMultipleProgressBarItem> _items = [];

        /// <summary>
        /// Returns the items of the multiple progress bar.
        /// </summary>
        public IEnumerable<ControlMultipleProgressBarItem> Items => _items;

        /// <summary>
        /// Gets or sets the format of the progress bar.
        /// </summary>
        public Func<IRenderControlContext, TypeFormatProgress> Format { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified id and items.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The items to be added to the multiple progress bar.</param>
        public ControlMultipleProgressBar(string id = null, params ControlMultipleProgressBarItem[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var barClass = new List<string>();
            var role = Role?.Invoke(renderContext);
            var format = Format?.Invoke(renderContext) ?? TypeFormatProgress.Default;

            switch (format)
            {
                case TypeFormatProgress.Colored:
                    barClass.Add("progress-bar");
                    break;

                case TypeFormatProgress.Striped:
                    barClass.Add("progress-bar");
                    barClass.Add("progress-bar-striped");
                    break;

                case TypeFormatProgress.Animated:
                    barClass.Add("progress-bar");
                    barClass.Add("progress-bar-striped");
                    barClass.Add("progress-bar-animated");
                    break;

                default:
                    return new HtmlElementFormProgress(_items.Select(x => (int)(x.Value?.Invoke(renderContext) ?? 0)).Sum() + "%")
                    {
                        Id = Id,
                        Class = string.Join(" ", Classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                        Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                        Role = role,
                        Min = "0",
                        Max = "100",
                        Value = _items.Select(x => (int)(x.Value?.Invoke(renderContext) ?? 0)).Sum().ToString()
                    };
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("progress", GetClasses()),
                Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                Role = role
            };

            foreach (var v in _items)
            {
                var value = v.Value?.Invoke(renderContext) ?? 0;
                var text = v.Text?.Invoke(renderContext);
                var backgroundColor = v.BackgroundColor?.Invoke(renderContext);
                var color = v.Color?.Invoke(renderContext);

                var styles = new List<string>
                {
                    "width: " + value + "%;"
                };

                var c = new List<string>(barClass)
                {
                    backgroundColor?.ToClass(),
                    color?.ToClass()
                };

                var bar = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(renderContext.Request?.Culture, text)))
                {
                    Id = Id,
                    Class = string.Join(" ", c.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Style = string.Join(" ", styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Role = role
                };

                html.Add(bar);
            }

            return html;
        }
    }
}
