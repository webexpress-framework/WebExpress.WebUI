using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a group of form items organized as a tab within a control form.
    /// </summary>
    public class ControlFormItemGroupTab : ControlFormItemGroup, IControlFormItemGroupTab
    {
        private readonly List<IControlFormItemGroupTabView> _views = [];

        /// <summary>
        /// Gets or sets the layout.
        /// </summary>
        public TypeLayoutTab Layout
        {
            get => (TypeLayoutTab)GetProperty(TypeLayoutTab.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        ///<param name="items">The form controls.</param> 
        public ControlFormItemGroupTab(string id = null, params ControlFormItem[] items)
            : base(id, items)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        ///<param name="items">The form controls.</param> 
        public ControlFormItemGroupTab(params ControlFormItem[] items)
            : base(null, items)
        {
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
            var grpupContex = new RenderControlFormGroupContext(renderContext, this);

            foreach (var item in Items)
            {
                item.Initialize(grpupContex);
            }
        }

        /// <summary>
        /// Adds the specified view to the tab.
        /// </summary>
        /// <param name="views">The tab views to add. Cannot be null.</param>
        /// <returns>The current instance of the group, enabling method chaining.</returns>
        public virtual IControlFormItemGroupTab AddView(params IControlFormItemGroupTabView[] views)
        {
            _views.AddRange(views);

            return this;
        }

        /// <summary>
        /// Adds the specified view to the tab.
        /// </summary>
        /// <param name="views">The tab views to add. Cannot be null.</param>
        /// <returns>The current instance of the group, enabling method chaining.</returns>
        public virtual IControlFormItemGroupTab AddView(IEnumerable<IControlFormItemGroupTabView> views)
        {
            _views.AddRange(views);

            return this;
        }

        /// <summary>
        /// Removes the specified tab view from the group.
        /// </summary>
        /// <param name="view">The tab view to remove from the group. Cannot be null.</param>
        /// <returns>The current instance of the group tab after the specified view has been removed.</returns>
        public virtual IControlFormItemGroupTab RemoveView(IControlFormItemGroupTabView view)
        {
            _views.Remove(view);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var renderGroupContext = new RenderControlFormGroupContext(renderContext, this);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-tab", Classes),
                Style = GetStyles(),
                Role = Role
            }
                .AddUserAttribute("data-layout", Layout.ToString().ToLower())
                .Add(_views.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
