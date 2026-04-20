
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a toolbar item dropdown control.
    /// </summary>
    /// <remarks>
    /// This class is used to create a dropdown within a toolbar.
    /// </remarks>
    public class ControlToolbarItemCombo : IControlToolbarItemCombo
    {
        private readonly string _id;
        private readonly List<ControlFormItemInputComboItem> _items = [];

        /// <summary>
        /// Returns the items in the dropdown.
        /// </summary>
        public IEnumerable<ControlFormItemInputComboItem> Items => _items;

        /// <summary>
        /// Returns the unique identifier for the entity.
        /// </summary>
        public string Id => _id;

        /// <summary>
        /// Gets or sets the color. 
        /// </summary>
        public PropertyColorText Color { get; set; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public TypeSizeButton Size { get; set; }

        /// <summary>
        /// Gets or sets the outline property.
        /// </summary>
        public bool Outline { get; set; }

        /// <summary>
        /// Gets or sets whether the button should take up the full width.
        /// </summary>
        public TypeBlockButton Block { get; set; }

        /// <summary>
        /// Gets or sets an indicator that indicates that a menu is present.
        /// </summary>
        public TypeToggleDropdown Toggle { get; set; }

        /// <summary>
        /// Gets or sets the label.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets the tooltip.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public IUri Image { get; set; }

        /// <summary>
        /// Gets or sets the activation status of the button.
        /// </summary>
        public TypeActive Active { get; set; }

        /// <summary>
        /// Gets or sets the alignment of the toolbar item.
        /// </summary>
        public TypeToolbarItemAlignment Alignment { get; set; } = TypeToolbarItemAlignment.Default;

        /// <summary>
        /// Gets the overflow behavior of the toolbar item.
        /// </summary>
        public TypeToolbarItemOverflow Overflow { get; set; } = TypeToolbarItemOverflow.Default;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlToolbarItemCombo(string id = null)
        {
            _id = id;
        }

        /// <summary>
        /// Adds one or more items to the combo.
        /// </summary>
        /// <param name="items">The items to add to the combo.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlToolbarItemCombo Add(params ControlFormItemInputComboItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the combo.
        /// </summary>
        /// <param name="items">The items to add to the combo.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlToolbarItemCombo Add(IEnumerable<ControlFormItemInputComboItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified item from the combo control.
        /// </summary>
        /// <param name="item">The combo item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlToolbarItemCombo Remove(ControlFormItemInputComboItem item)
        {
            _items.Remove(item);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var buttonCss = "";

            if (Size != TypeSizeButton.Default)
            {
                buttonCss = Css.Concatenate(Size.ToClass(), buttonCss);
            }

            if (Block != TypeBlockButton.None)
            {
                buttonCss = Css.Concatenate(Block.ToClass(), buttonCss);
            }

            if (Toggle != TypeToggleDropdown.None)
            {
                buttonCss = Css.Concatenate(Toggle.ToClass(), buttonCss);
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = _id,
                Class = Css.Concatenate("wx-toolbar-combo", buttonCss)
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Text))
                .AddUserAttribute("data-title", I18N.Translate(renderContext, Tooltip))
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", Image?.ToString() ?? (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color-css", Color?.ToClass())
                .AddUserAttribute("data-color-style", Color?.ToStyle())
                .AddUserAttribute(Active == TypeActive.Active ? "active" : null)
                .AddUserAttribute(Active == TypeActive.Disabled ? "disabled" : null)
                .AddUserAttribute("data-align", Alignment.ToValue())
                .AddUserAttribute("data-overflow", Overflow.ToValue())
                .Add(_items.Select(x => new HtmlElementFormOption()
                {
                    Value = x.Value,
                    Text = I18N.Translate(renderContext, x.Text)
                }));

            return html;
        }
    }
}
