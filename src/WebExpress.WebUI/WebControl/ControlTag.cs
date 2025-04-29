using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control tag.
    /// </summary>
    public class ControlTag : Control
    {
        private readonly List<IControl> _items = [];

        /// <summary>
        /// Returns the collection of items contained in the control.
        /// </summary>
        public IEnumerable<IControl> Items => _items;

        /// <summary>
        /// Returns or sets the layout.
        /// </summary>
        public PropertyColorBackgroundBadge Layout
        {
            get => (PropertyColorBackgroundBadge)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Return or specifies whether rounded corners should be used.
        /// </summary>
        public bool Pill { get; set; }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The content of the html element.</param>
        public ControlTag(string id = null, params IControl[] content)
            : base(id)
        {
            Pill = true;
            _items.AddRange(content);
        }

        /// <summary>
        /// Adds the specified items to the control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        public void Add(params IControl[] items)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds a divider to the control.
        /// </summary>
        public void AddDivider()
        {
            _items.AddRange(null);
        }

        /// <summary>
        /// Removes the specified item from the control.
        /// </summary>
        /// <param name="item">The item to remove.</param>
        public void Remove(IControl item)
        {
            _items.Remove(item);
        }

        /// <summary>
        /// Adds a header to the control.   
        /// </summary>
        /// <param name="text">The header text.</param>
        public void AddHeader(string text)
        {
            _items.AddRange(new ControlDropdownItemHeader() { Text = text });
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var pillClass = Pill ? "rounded-pill" : "";

            if (_items.Count == 0)
            {
                return new HtmlElementTextSemanticsSpan(new HtmlText(I18N.Translate(renderContext.Request?.Culture, Text)))
                {
                    Id = Id,
                    Class = Css.Concatenate("badge", pillClass, GetClasses()),
                    Style = GetStyles(),
                    Role = Role
                };
            }

            var html = new HtmlElementTextSemanticsSpan()
            {
                Id = Id,
                Class = "dropdown"
            };

            var tag = new HtmlElementTextSemanticsSpan
            (
                new HtmlText(Text), new HtmlElementTextSemanticsSpan()
                {
                    Class = "fas fa-caret-down"
                }
            )
            {
                Class = Css.Concatenate("btn", pillClass, GetClasses()),
                Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                Role = Role,
                DataToggle = "dropdown"
            };

            html.Add(tag);
            html.Add
            (
                new HtmlElementTextContentUl
                (
                    Items.Select
                    (
                        x =>
                        x == null ?
                        new HtmlElementTextContentLi() { Class = "dropdown-divider", Inline = true } :
                        x is ControlDropdownItemHeader ?
                        x.Render(renderContext, visualTree) :
                        new HtmlElementTextContentLi(x.Render(renderContext, visualTree).AddClass("dropdown-item")) { }
                    ).ToArray()
                )
                {
                    Class = HorizontalAlignment == TypeHorizontalAlignment.Right ? "dropdown-menu dropdown-menu-right" : "dropdown-menu"
                }
            );

            return html;
        }
    }
}
