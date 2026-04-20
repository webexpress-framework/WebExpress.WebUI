using System.Collections.Generic;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tab view within a form item group.
    /// </summary>
    public class ControlFormItemGroupTabView : IControlFormItemGroupTabView
    {
        private readonly ControlFormItemGroupVertical _group = new();

        /// <summary>
        /// Gets or sets the unique identifier for the view.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the title text.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with this view.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public IUri Image { get; set; }

        /// <summary>
        /// Gets or sets the name of the group.
        /// </summary>
        public string Name
        {
            get => _group.Name;
            set => _group.Name = value;
        }

        /// <summary>
        /// Gets or sets the horizontal alignment of the group content.
        /// </summary>
        public TypeHorizontalAlignment HorizontalAlignment
        {
            get => _group.HorizontalAlignment;
            set => _group.HorizontalAlignment = value;
        }

        /// <summary>
        /// Gets or sets the flex grow factor that determines how much available space 
        /// the element should take up relative to its siblings.
        /// </summary>
        public TypeFlexGrow FlexGrow
        {
            get => _group.FlexGrow;
            set => _group.FlexGrow = value;
        }

        /// <summary>
        /// Gets or sets the color used to display text within the group.
        /// </summary>
        public PropertyColorText TextColor
        {
            get => _group.TextColor;
            set => _group.TextColor = value;
        }

        /// <summary>
        /// Gets or sets the background color for the group.
        /// </summary>
        public PropertyColorBackground BackgroundColor
        {
            get => _group.BackgroundColor;
            set => _group.BackgroundColor = value;
        }

        /// <summary>
        /// Returns the border color configuration for the element.
        /// </summary>
        public PropertyColorBorder BorderColor
        {
            get => _group.BorderColor;
            set => _group.BorderColor = value;
        }

        /// <summary>
        /// Gets or sets the padding applied to the property group content.
        /// </summary>
        public PropertySpacingPadding Padding
        {
            get => _group.Padding;
            set => _group.Padding = value;
        }

        /// <summary>
        /// Gets or sets the margin applied to the property group layout.
        /// </summary>
        public PropertySpacingMargin Margin
        {
            get => _group.Margin;
            set => _group.Margin = value;
        }

        /// <summary>
        /// Gets or sets the border settings for the group.
        /// </summary>
        public PropertyBorder Border
        {
            get => _group.Border;
            set => _group.Border = value;
        }

        /// <summary>
        /// Gets or sets the grid column associated with this group.
        /// </summary>
        public PropertyGrid GridColumn
        {
            get => _group.GridColumn;
            set => _group.GridColumn = value;
        }

        /// <summary>
        /// Gets or sets the width type for the group.
        /// </summary>
        public TypeWidth Width
        {
            get => _group.Width;
            set => _group.Width = value;
        }

        /// <summary>
        /// Gets or sets the height value for the group.
        /// </summary>
        public TypeHeight Height
        {
            get => _group.Height;
            set => _group.Height = value;
        }

        /// <summary>
        /// Gets or sets the display settings for the type group.
        /// </summary>
        public TypeDisplay Display
        {
            get => _group.Display;
            set => _group.Display = value;
        }

        /// <summary>
        /// Gets or sets the collection of CSS class names applied to the group.
        /// </summary>
        public IEnumerable<string> Classes
        {
            get => _group.Classes;
            set => _group.Classes = value;
        }

        /// <summary>
        /// Gets or sets the collection of style names associated with the group.
        /// </summary>
        public IEnumerable<string> Styles
        {
            get => _group.Styles;
            set => _group.Styles = value;
        }

        /// <summary>
        /// Gets or sets the role associated with the group.
        /// </summary>
        public string Role
        {
            get => _group.Role;
            set => _group.Role = value;
        }

        /// <summary>
        /// Gets or sets the action to perform when the associated element is clicked.
        /// </summary>
        public PropertyOnClick OnClick
        {
            get => _group.OnClick;
            set => _group.OnClick = value;
        }

        /// <summary>
        /// Gets or sets a value indicating whether the group is enabled.
        /// </summary>
        public bool Enable
        {
            get => _group.Enable;
            set => _group.Enable = value;
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the view.</param>
        public ControlFormItemGroupTabView(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more items to the view.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemGroupTabView Add(params IControlFormItem[] items)
        {
            _group.Add(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the view.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemGroupTabView Add(IEnumerable<IControlFormItem> items)
        {
            _group.Add(items);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the view.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemGroupTabView Remove(IControlFormItem item)
        {
            _group.Remove(item);

            return this;
        }

        /// <summary>
        /// Initializes the control group with the specified render context.
        /// </summary>
        /// <param name="renderContext">
        /// The context that provides rendering information and services for the control 
        /// group. Cannot be null.
        /// </param>
        public void Initialize(IRenderControlFormContext renderContext)
        {
            _group.Initialize(renderContext);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var renderControlFormContext = new RenderControlFormContext(renderContext, null);

            return Render(renderControlFormContext, visualTree);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-tab-view"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Title))
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", Image?.ToString() ?? (Icon as ImageIcon)?.Uri?.ToString())
                .Add(_group.Render(renderContext, visualTree));

            return html;
        }

        /// <summary>
        /// Adds one or more items to the view.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemGroup IControlFormItemGroup.Add(params IControlFormItem[] items)
        {
            return Add(items);
        }

        /// <summary>
        /// Adds one or more items to the view.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemGroup IControlFormItemGroup.Add(IEnumerable<IControlFormItem> items)
        {
            return Add(items);
        }

        /// <summary>
        /// Removes the specified control from the view.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemGroup IControlFormItemGroup.Remove(IControlFormItem item)
        {
            return Remove(item);
        }
    }
}
