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
        public TypeFormatProgress Format { get; set; }

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
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var barClass = new List<string>();

            switch (Format)
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
                    return new HtmlElementFormProgress(_items.Select(x => (int)x.Value).Sum() + "%")
                    {
                        Id = Id,
                        Class = string.Join(" ", Classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                        Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                        Role = Role,
                        Min = "0",
                        Max = "100",
                        Value = _items.Select(x => (int)x.Value).Sum().ToString()
                    };
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("progress", GetClasses()),
                Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                Role = Role
            };

            foreach (var v in _items)
            {
                var styles = new List<string>
                {
                    "width: " + v.Value + "%;"
                };

                var c = new List<string>(barClass)
                {
                    v.BackgroundColor.ToClass(),
                    v.Color.ToClass()
                };

                var bar = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(renderContext.Request?.Culture, v.Text)))
                {
                    Id = Id,
                    Class = string.Join(" ", c.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Style = string.Join(" ", styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Role = Role
                };

                html.Add(bar);
            }

            return html;
        }
    }
}
