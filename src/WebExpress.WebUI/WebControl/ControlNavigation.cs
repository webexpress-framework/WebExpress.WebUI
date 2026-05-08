using System;
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
        public Func<IRenderControlContext, TypeLayoutTab> Layout
        {
            get => (Func<IRenderControlContext, TypeLayoutTab>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the horizontal arrangement.
        /// </summary>
        public new Func<IRenderControlContext, TypeHorizontalAlignmentTab> HorizontalAlignment
        {
            get => (Func<IRenderControlContext, TypeHorizontalAlignmentTab>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets whether the tab tabs should be the same size.
        /// </summary>
        public Func<IRenderControlContext, TypeJustifiedTab> Justified
        {
            get => (Func<IRenderControlContext, TypeJustifiedTab>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the horizontal or vertical orientation.
        /// </summary>
        public Func<IRenderControlContext, TypeOrientationTab> Orientation
        {
            get => (Func<IRenderControlContext, TypeOrientationTab>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the active color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackground> ActiveColor { get; set; } = _ => new PropertyColorBackground();

        /// <summary>
        /// Gets or sets the active text color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> ActiveTextColor { get; set; } = _ => new PropertyColorText();

        /// <summary>
        /// Gets or sets the link color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> LinkColor { get; set; } = _ => new PropertyColorText();

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The navigation items.</param>
        public ControlNavigation(string id = null, params IControlNavigationItem[] items)
            : base(id)
        {
            _items.AddRange(items);
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
            var role = Role?.Invoke(renderContext);
            var activeColor = ActiveColor?.Invoke(renderContext);
            var activeTextColor = ActiveTextColor?.Invoke(renderContext);
            var linkColor = LinkColor?.Invoke(renderContext);

            foreach (var item in items)
            {
                var i = item.Render(renderContext, visualTree) as HtmlElement;

                if (item is ControlNavigationItemLink link)
                {
                    i.RemoveClass(link.TextColor?.Invoke(renderContext)?.ToClass());
                    i.RemoveStyle(link.TextColor?.Invoke(renderContext)?.ToStyle());

                    i.AddClass
                    (
                        Css.Concatenate
                        (
                            "nav-link",
                            link.Active?.Invoke(renderContext) == TypeActive.Active ? activeColor?.ToClass() : "",
                            link.Active?.Invoke(renderContext) == TypeActive.Active ? activeTextColor?.ToClass() : linkColor?.ToClass()
                        )
                    );

                    i.AddStyle
                    (
                        Style.Concatenate
                        (
                            link.Active?.Invoke(renderContext) == TypeActive.Active ? activeColor?.ToStyle() : "",
                            link.Active?.Invoke(renderContext) == TypeActive.Active ? activeTextColor?.ToStyle() : linkColor?.ToStyle()
                        )
                    );


                }
                else if (item is ControlNavigationItemDropdown dropdown)
                {
                    var active = dropdown.Active?.Invoke(renderContext);

                    i.RemoveClass(dropdown.TextColor?.Invoke(renderContext)?.ToClass());
                    i.RemoveStyle(dropdown.TextColor?.Invoke(renderContext)?.ToStyle());

                    i.AddClass
                    (
                        Css.Concatenate
                        (
                            "nav-link",
                            active == TypeActive.Active ? activeColor?.ToClass() : "",
                            active == TypeActive.Active ? activeTextColor?.ToClass() : ""
                        )
                    );
                    i.AddStyle
                    (
                        Style.Concatenate
                        (
                            active == TypeActive.Active ? activeColor?.ToStyle() : "",
                            active == TypeActive.Active ? activeTextColor?.ToStyle() : ""
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
                Role = role
            };

            return html;
        }
    }
}
