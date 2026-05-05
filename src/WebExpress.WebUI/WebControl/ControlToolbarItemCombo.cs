
using System;
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
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeButton> Size { get; set; } = _ => TypeSizeButton.Default;

        /// <summary>
        /// Gets or sets the outline property.
        /// </summary>
        public Func<IRenderControlContext, bool> Outline { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets whether the button should take up the full width.
        /// </summary>
        public Func<IRenderControlContext, TypeBlockButton> Block { get; set; } = _ => TypeBlockButton.None;

        /// <summary>
        /// Gets or sets an indicator that indicates that a menu is present.
        /// </summary>
        public Func<IRenderControlContext, TypeToggleDropdown> Toggle { get; set; } = _ => TypeToggleDropdown.None;

        /// <summary>
        /// Gets or sets the label.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the tooltip.
        /// </summary>
        public Func<IRenderControlContext, string> Tooltip { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the activation status of the button.
        /// </summary>
        public Func<IRenderControlContext, TypeActive> Active { get; set; } = _ => TypeActive.None;

        /// <summary>
        /// Gets or sets the alignment of the toolbar item.
        /// </summary>
        public Func<IRenderControlContext, TypeToolbarItemAlignment> Alignment { get; set; } = _ => TypeToolbarItemAlignment.Default;

        /// <summary>
        /// Gets the overflow behavior of the toolbar item.
        /// </summary>
        public Func<IRenderControlContext, TypeToolbarItemOverflow> Overflow { get; set; } = _ => TypeToolbarItemOverflow.Default;

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
            var color = Color?.Invoke(renderContext);
            var size = Size?.Invoke(renderContext) ?? TypeSizeButton.Default;
            var outline = Outline?.Invoke(renderContext) ?? false;
            var block = Block?.Invoke(renderContext) ?? TypeBlockButton.None;
            var toggle = Toggle?.Invoke(renderContext) ?? TypeToggleDropdown.None;
            var text = Text?.Invoke(renderContext);
            var tooltip = Tooltip?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);
            var active = Active?.Invoke(renderContext) ?? TypeActive.None;
            var alignment = Alignment?.Invoke(renderContext) ?? TypeToolbarItemAlignment.Default;
            var overflow = Overflow?.Invoke(renderContext) ?? TypeToolbarItemOverflow.Default;

            var buttonCss = "";

            if (size != TypeSizeButton.Default)
            {
                buttonCss = Css.Concatenate(size.ToClass(), buttonCss);
            }

            if (block != TypeBlockButton.None)
            {
                buttonCss = Css.Concatenate(block.ToClass(), buttonCss);
            }

            if (toggle != TypeToggleDropdown.None)
            {
                buttonCss = Css.Concatenate(toggle.ToClass(), buttonCss);
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = _id,
                Class = Css.Concatenate("wx-toolbar-combo", buttonCss)
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, text))
                .AddUserAttribute("data-title", I18N.Translate(renderContext, tooltip))
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute(active == TypeActive.Active ? "active" : null)
                .AddUserAttribute(active == TypeActive.Disabled ? "disabled" : null)
                .AddUserAttribute("data-align", alignment.ToValue())
                .AddUserAttribute("data-overflow", overflow.ToValue())
                .Add(_items.Select(x => new HtmlElementFormOption()
                {
                    Value = x.Value?.Invoke(renderContext),
                    Text = I18N.Translate(renderContext, x.Text?.Invoke(renderContext))
                }));

            return html;
        }
    }
}
