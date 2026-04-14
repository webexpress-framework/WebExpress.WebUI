using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a navigation control.
    /// </summary>
    public class ControlNavigation : Control, IControlNavigation
    {
        private List<IControlNavigationItem> _items = [];

        /// <summary>
        /// Returns the navigation items.
        /// </summary>
        public IEnumerable<IControlNavigationItem> Items => _items;

        /// <summary>
        /// Gets or sets the layout.
        /// </summary>
        public TypeLayoutTab Layout
        {
            get => (TypeLayoutTab)GetProperty(TypeLayoutTab.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the horizontal arrangement.
        /// </summary>
        public new TypeHorizontalAlignmentTab HorizontalAlignment
        {
            get => (TypeHorizontalAlignmentTab)GetProperty(TypeHorizontalAlignmentTab.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets whether the tab tabs should be the same size.
        /// </summary>
        public TypeJustifiedTab Justified
        {
            get => (TypeJustifiedTab)GetProperty(TypeJustifiedTab.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the horizontal or vertical orientation.
        /// </summary>
        public TypeOrientationTab Orientation
        {
            get => (TypeOrientationTab)GetProperty(TypeOrientationTab.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the active color.
        /// </summary>
        public PropertyColorBackground ActiveColor { get; set; } = new PropertyColorBackground();

        /// <summary>
        /// Gets or sets the active text color.
        /// </summary>
        public PropertyColorText ActiveTextColor { get; set; } = new PropertyColorText();

        /// <summary>
        /// Gets or sets the link color.
        /// </summary>
        public PropertyColorText LinkColor { get; set; } = new PropertyColorText();

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The navigation items.</param>
        public ControlNavigation(string id = null, params IControlNavigationItem[] items)
            : base(id)
        {
            _items.AddRange(items);

            //ActiveColor = LayoutSchema.NavigationActiveBackground;
            //ActiveTextColor = LayoutSchema.NavigationActive;
            //LinkColor = LayoutSchema.NavigationLink;
        }

        /// <summary> 
        /// Adds one or more items to the content of the control.
        /// </summary> 
        /// <param name="items">The items to add to the control.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple items to the collection of 
        /// the control.
        /// 
        /// Example usage: 
        /// <code> 
        /// var control = new ControlNavigation(); 
        /// var text1 = new ControlNavigationItemLink { Text = "A" };
        /// var text2 = new ControlNavigationItemLink { Text = "B" };
        /// control.Add(text1, text2);
        /// </code> 
        /// 
        /// This method accepts any items that implements the <see cref="IControlNavigationItem"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlNavigation Add(params IControlNavigationItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary> 
        /// Adds one or more items to the content of the control.
        /// </summary> 
        /// <param name="items">The items to add to the control.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple items to the collection of 
        /// the control.
        /// 
        /// Example usage: 
        /// <code> 
        /// var control = new ControlNavigation(); 
        /// var text1 = new ControlNavigationItemLink { Text = "A" };
        /// var text2 = new ControlNavigationItemLink { Text = "B" };
        /// control.Add(text1, text2);
        /// </code> 
        /// 
        /// This method accepts any items that implements the <see cref="IControlNavigationItem"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlNavigation Add(IEnumerable<IControlNavigationItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a item from the content of the control.
        /// </summary>
        /// <param name="item">The item to remove from the content.</param>
        /// <remarks>
        /// This method allows removing a specific item from the collection of 
        /// the control.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlNavigation Remove(IControlNavigationItem item)
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
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return Render(renderContext, visualTree, _items);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="items">The navigation entries.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlNavigationItem> items)
        {
            var htmlItems = new List<HtmlElement>();
            foreach (var item in items)
            {
                var i = item.Render(renderContext, visualTree) as HtmlElement;

                if (item is ControlNavigationItemLink link)
                {
                    i.RemoveClass(link.TextColor?.ToClass());
                    i.RemoveStyle(link.TextColor?.ToStyle());

                    i.AddClass
                    (
                        Css.Concatenate
                        (
                            "nav-link",
                            link.Active == TypeActive.Active ? ActiveColor?.ToClass() : "",
                            link.Active == TypeActive.Active ? ActiveTextColor?.ToClass() : LinkColor?.ToClass()
                        )
                    );

                    i.AddStyle
                    (
                        Style.Concatenate
                        (
                            link.Active == TypeActive.Active ? ActiveColor?.ToStyle() : "",
                            link.Active == TypeActive.Active ? ActiveTextColor?.ToStyle() : LinkColor?.ToStyle()
                        )
                    );


                }
                else if (item is ControlNavigationItemDropdown dropdown)
                {
                    i.RemoveClass(dropdown.TextColor?.ToClass());
                    i.RemoveStyle(dropdown.TextColor?.ToStyle());

                    i.AddClass
                    (
                        Css.Concatenate
                        (
                            "nav-link",
                            dropdown.Active == TypeActive.Active ? ActiveColor?.ToClass() : "",
                            dropdown.Active == TypeActive.Active ? ActiveTextColor?.ToClass() : ""
                        )
                    );
                    i.AddStyle
                    (
                        Style.Concatenate
                        (
                            dropdown.Active == TypeActive.Active ? ActiveColor?.ToStyle() : "",
                            dropdown.Active == TypeActive.Active ? ActiveTextColor?.ToStyle() : ""
                        )
                    );
                }
                else
                {
                    //i.AddClass(Css.Concatenate("nav-link"));
                }

                htmlItems.Add(new HtmlElementTextContentLi(i)
                {
                    Class = "nav-item"
                });
            }

            var html = new HtmlElementTextContentUl(htmlItems.ToArray())
            {
                Id = Id,
                Class = Css.Concatenate("nav", GetClasses()),
                Style = GetStyles(),
                Role = Role
            };

            return html;
        }
    }
}
