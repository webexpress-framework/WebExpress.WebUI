using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a list item control that can contain other controls as its content.
    /// </summary>
    public class ControlListItem : IControlListItem
    {
        private readonly List<IControlDropdownItem> _options = [];
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Gets or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the color scheme used for the row.
        /// </summary>
        public PropertyColorText Color { get; set; }

        /// <summary>
        /// Gets or sets the color scheme used for the row.
        /// </summary>
        public PropertyColorBackgroundList BackgroundColor { get; set; }

        /// <summary>
        /// Gets the options.
        /// </summary>
        public IEnumerable<IControlDropdownItem> Options => _options;

        /// <summary>
        /// Gets or sets the icon associated with this instance.
        /// </summary>
        public virtual IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public virtual IUri Image { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public IAction PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        public IAction SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the ativity state of the list item.
        /// </summary>
        public TypeActive Active { get; set; }

        /// <summary>
        /// Gets or sets the content associated with this cell.
        /// </summary>
        public virtual string Text
        {
            get
            {
                return string.Join
                (
                    " ",
                    _content.Where(x => x is ControlText)
                        .Select(x => x as ControlText)
                        .Select(x => x.Text)
                );
            }
            set
            {
                _content.Clear();

                if (value is null)
                {
                    return;
                }

                _content.Add(new ControlText { Text = value, Format = TypeFormatText.Raw });
            }
        }

        /// <summary>
        /// Gets or sets the description associated with this cell.
        /// </summary>
        public virtual string Description { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlListItem(string id = null)
        {
            Id = id;
        }

        /// <summary> 
        /// Adds one or more controls to the content of the list item.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlListItem Add(params IControl[] controls)
        {
            _content.AddRange(controls);

            return this;
        }

        /// <summary> 
        /// Adds one or more controls to the content of the list item.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlListItem Add(IEnumerable<IControl> controls)
        {
            _content.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the content of the list item.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlListItem Remove(IControl control)
        {
            _content.Remove(control);

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
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-list-item")
            }
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", Image?.ToString() ?? (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color-css", Color?.ToClass())
                .AddUserAttribute("data-color-style", Color?.UserColor)
                .AddUserAttribute("data-bgcolor-css", BackgroundColor?.ToClass())
                .AddUserAttribute("data-bgcolor-style", BackgroundColor?.UserColor)
                .AddUserAttribute("data-active", Active.ToClass())
                .Add(_content.Select(x => x.Render(renderContext, visualTree)));

            PrimaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            SecondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
