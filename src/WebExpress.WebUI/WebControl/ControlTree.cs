using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tree control that can display hierarchical data.
    /// </summary>
    public class ControlTree : Control, IControlTree
    {
        private readonly List<ControlTreeItem> _nodes = [];

        /// <summary>
        /// Returns the collection of tree nodes.
        /// </summary>
        public IEnumerable<ControlTreeItem> Nodes => _nodes;

        /// <summary>
        /// Returns or sets the layout.
        /// </summary>
        public TypeLayoutTree Layout { get; set; } = TypeLayoutTree.Default;

        /// <summary>
        /// Returns or sets a value indicating whether to show an indicator for expandable nodes.
        /// </summary>
        public bool DisableIndicator { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether the tree nodes are movable.
        /// </summary>
        public bool Movable { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="ControlTree"/> class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The tree items to be added to the control.</param>
        public ControlTree(string id = null, params ControlTreeItem[] items)
            : base(id)
        {
            _nodes.AddRange(items);
        }

        /// <summary>
        /// Adds the specified tree items to the control.
        /// </summary>
        /// <param name="items">The tree items to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTree Add(params ControlTreeItem[] items)
        {
            _nodes.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds the specified tree items to the control.
        /// </summary>
        /// <param name="items">The tree items to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTree Add(IEnumerable<ControlTreeItem> items)
        {
            _nodes.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified tree item from the control.
        /// </summary>
        /// <param name="item">The tree item to be removed.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTree Remove(ControlTreeItem item)
        {
            _nodes.Remove(item);

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
            return Render(renderContext, visualTree, Nodes);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="nodes">The collection of tree nodes to process.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<ControlTreeItem> nodes)
        {
            var classes = new List<string>(["wx-webui-tree"]);
            classes.AddRange(Classes);

            var html = new HtmlElementTextContentDiv([.. GetHtml(nodes)])
            {
                Id = Id,
                Class = string.Join(" ", classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                Style = GetStyles()
            };

            if (Layout != TypeLayoutTree.Default)
            {
                html.AddUserAttribute("data-layout", Layout.ToClass());
            }

            if (DisableIndicator)
            {
                html.AddUserAttribute("data-indicator", "false");
            }

            if (Movable)
            {
                html.AddUserAttribute("data-movable", "true");
            }

            return html;
        }

        /// <summary>
        /// Recursively generates HTML elements for the given tree nodes.
        /// </summary>
        /// <param name="nodes">The collection of tree nodes to process.</param>
        /// <returns>A collection of HTML div elements representing the tree nodes.</returns>
        private static IEnumerable<HtmlElementTextContentDiv> GetHtml(IEnumerable<ControlTreeItem> nodes)
        {
            return nodes.Select(x =>
            {
                var div = new HtmlElementTextContentDiv([.. GetHtml(x.Children)])
                {
                    Id = x.Id,
                    Class = Css.Concatenate("wx-tree-node"),
                };

                div.AddUserAttribute("data-label", I18N.Translate(x.Label));

                if (x.Expand)
                {
                    div.AddUserAttribute("data-expand", "true");
                }

                if (x.IconOpen == x.IconClose && x.Icon is Icon icon)
                {
                    div.AddUserAttribute("data-icon", icon.Class);
                }

                if (x.IconOpen != x.IconClose && x.IconOpen is Icon iconOpen)
                {
                    div.AddUserAttribute("data-icon-opened", iconOpen.Class);
                }

                if (x.IconOpen != x.IconClose && x.IconClose is Icon iconClose)
                {
                    div.AddUserAttribute("data-icon-closed", iconClose.Class);
                }

                if (x.IconOpen == x.IconClose && x.Icon is ImageIcon image)
                {
                    div.AddUserAttribute("data-image", image.Uri?.ToString());
                }

                if (x.IconOpen != x.IconClose && x.IconOpen is ImageIcon imageOpen)
                {
                    div.AddUserAttribute("data-image-opened", imageOpen.Uri?.ToString());
                }

                if (x.IconOpen != x.IconClose && x.IconClose is ImageIcon imageClose)
                {
                    div.AddUserAttribute("data-image-closed", imageClose.Uri?.ToString());
                }

                if (x.Active)
                {
                    div.AddUserAttribute("data-active", "true");
                }

                if (x is ControlTreeItemLink linkNode)
                {
                    div.AddUserAttribute("data-url", linkNode.Uri?.ToString());

                    if (linkNode.Target != TypeTarget.None)
                    {
                        div.AddUserAttribute("data-target", linkNode.Target.ToString().ToLower());
                    }

                    if (!string.IsNullOrWhiteSpace(linkNode.Tooltip))
                    {
                        div.AddUserAttribute("data-tooltip", linkNode.Tooltip);
                    }
                }

                return div;
            });
        }
    }
}
