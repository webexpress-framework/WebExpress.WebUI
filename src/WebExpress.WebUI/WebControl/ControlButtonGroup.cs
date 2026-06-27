using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Groups a set of buttons into a single, segmented control. The buttons are
    /// laid out horizontally by default or stacked vertically.
    /// </summary>
    public class ControlButtonGroup : Control
    {
        private readonly List<IControl> _items = [];

        /// <summary>
        /// Gets the buttons of the group.
        /// </summary>
        public IEnumerable<IControl> Items => _items;

        /// <summary>
        /// Gets or sets the size of the group.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeButton> Size { get; set; } = _ => TypeSizeButton.Default;

        /// <summary>
        /// Gets or sets a value indicating whether the buttons are stacked vertically.
        /// </summary>
        public Func<IRenderControlContext, bool> Vertical { get; set; } = _ => false;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The buttons of the group.</param>
        public ControlButtonGroup(string id = null, params IControl[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more buttons to the group.
        /// </summary>
        /// <param name="items">The buttons to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlButtonGroup Add(params IControl[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var size = Size?.Invoke(renderContext) ?? TypeSizeButton.Default;
            var vertical = Vertical?.Invoke(renderContext) ?? false;
            var role = Role?.Invoke(renderContext) ?? "group";

            // the group sizing classes differ from the button sizing classes
            var sizeClass = size switch
            {
                TypeSizeButton.Small => "btn-group-sm",
                TypeSizeButton.Large => "btn-group-lg",
                _ => ""
            };

            return new HtmlElementTextContentDiv([.. Items.Select(x => x.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = Css.Concatenate(vertical ? "btn-group-vertical" : "btn-group", sizeClass, GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role
            };
        }
    }
}
