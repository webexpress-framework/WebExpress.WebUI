using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control list that can contain multiple control list items.
    /// </summary>
    public class ControlList : Control, IControlList
    {
        private readonly List<ControlListItem> _items = [];

        /// <summary>
        /// Returns the list entries.
        /// </summary>
        public IEnumerable<ControlListItem> Items => _items;

        /// <summary>
        /// Returns or sets the layout.
        /// </summary>
        public TypeLayoutList Layout
        {
            get => (TypeLayoutList)GetProperty(TypeLayoutList.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The list entries.</param>
        public ControlList(string id = null, params ControlListItem[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds a collection of list entries to the existing items.
        /// </summary>
        /// <param name="items">The list entries to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="ControlListItem"/> instances to the 
        /// current list of items. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// 
        /// Example usage:
        /// <code>
        /// var list = new ControlList();
        /// var item1 = new ControlListItem { Text = "Item 1" };
        /// var item2 = new ControlListItem { Text = "Item 2" };
        /// list.Add(item1, item2);
        /// </code>
        /// 
        /// This method accepts any item that derives from <see cref="ControlListItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public IControlList Add(params ControlListItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds a collection of list entries to the existing items.
        /// </summary>
        /// <param name="items">The list entries to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="ControlListItem"/> instances to the 
        /// current list of items. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// 
        /// Example usage:
        /// <code>
        /// var list = new ControlList();
        /// var item1 = new ControlListItem { Text = "Item 1" };
        /// var item2 = new ControlListItem { Text = "Item 2" };
        /// list.Add(item1).Add(item2);
        /// </code>
        /// 
        /// This method accepts any item that derives from <see cref="ControlListItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public IControlList Add(IEnumerable<ControlListItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a specified list entry from the existing items.
        /// </summary>
        /// <param name="item">The list entry to remove.</param>
        /// <remarks>
        /// This method removes the specified <see cref="ControlListItem"/> instance from the 
        /// current list of items. If the item does not exist in the list, the method does nothing.
        /// 
        /// Example usage:
        /// <code>
        /// var list = new ControlList();
        /// var item1 = new ControlListItem { Text = "Item 1" };
        /// list.Add(item1);
        /// list.Remove(item1);
        /// </code>
        /// 
        /// This method accepts any item that derives from <see cref="ControlListItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public IControlList Remove(ControlListItem item)
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
            return Render(renderContext, visualTree, Items);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="items">The list entries.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<ControlListItem> items)
        {
            var li = items.Where(x => x.Enable).Select(x => x.Render(renderContext, visualTree)).ToList();
            switch (Layout)
            {
                case TypeLayoutList.Horizontal:
                case TypeLayoutList.Flush:
                case TypeLayoutList.Group:
                    li.ForEach(x => x.AddClass("list-group-item"));
                    break;
            }

            var html = new HtmlElementTextContentUl([.. li])
            {
                Id = Id,
                Class = Css.Concatenate("", GetClasses()),
                Style = GetStyles(),
                Role = Role
            };

            return html;
        }
    }
}
