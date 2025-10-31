using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that splits the available space into two resizable panels.
    /// </summary>
    public class ControlPanelSplit : Control, IControlPanelSplit
    {
        private readonly List<IControl> _sidePanel = [];
        private readonly List<IControl> _mainPanel = [];

        /// <summary>
        /// Returns the left or top panel in the ControlPanelSplit.
        /// </summary>
        public IEnumerable<IControl> SidePanel => _sidePanel;

        /// <summary>
        /// Returns the right or bottom pane in the ControlPanelSplit.
        /// </summary>
        public IEnumerable<IControl> MainPanel => _mainPanel;

        /// <summary>
        /// Returns or sets whether the splitter is horziontal or vertically oriented.
        /// </summary>
        public TypeOrientationSplit Orientation { get; set; }

        /// <summary>
        /// Returns or sets the color of the splitter.
        /// </summary>
        public PropertyColorBackground SplitterColor { get; set; } = new PropertyColorBackground(TypeColorBackground.Default);

        /// <summary>
        /// Returns or sets the width of the splitter.
        /// </summary>
        public int SplitterSize { get; set; } = -1;

        /// <summary>
        /// Returns or sets the minimum size of the left or top area in the ControlPanelSplit.
        /// </summary>
        public int SidePanelMinSize { get; set; } = -1;

        /// <summary>
        /// Returns or sets the initial size of the left or top area in the ControlPanelSplit in %.
        /// </summary>
        public int SidePanelInitialSize { get; set; } = -1;

        /// <summary>
        /// Returns or sets the maximum size of the left or top area in the ControlPanelSplit.
        /// </summary>
        public int SidePanelMaxSize { get; set; } = -1;

        /// <summary>
        /// Return or sets the order in which the main and side components are arranged.
        /// </summary>
        public TypeSplitOrder Order { get; set; } = TypeSplitOrder.Default;

        /// <summary>
        /// Returns or sets the unit of measurement for the type size.
        /// </summary>
        public TypeSizeUnit Unit { get; set; } = TypeSizeUnit.Default;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlPanelSplit(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="sidePanel">Left or top panel controls.</param>
        /// <param name="mainPanel">Right or bottom panel controls.</param>
        public ControlPanelSplit(string id, IControl[] sidePanel, IControl[] mainPanel)
            : base(id)
        {
            _sidePanel.AddRange(sidePanel);
            _mainPanel.AddRange(mainPanel);
        }

        /// <summary>
        /// Adds controls to the left or top panel.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlPanelSplit AddSidePanel(params IControl[] controls)
        {
            _sidePanel.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the left or top panel.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlPanelSplit RemoveSidePanel(IControl control)
        {
            _sidePanel.Remove(control);

            return this;
        }

        /// <summary>
        /// Adds controls to the right or bottom panel.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlPanelSplit AddMainPanel(params IControl[] controls)
        {
            _mainPanel.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the right or bottom panel.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlPanelSplit RemoveMainPanel(IControl control)
        {
            _mainPanel.Remove(control);

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
            var p1 = SidePanel
                .Select(x => x.Render(renderContext, visualTree))
                .Where(x => x != null)
                .ToList();
            var p2 = MainPanel
                .Select(x => x.Render(renderContext, visualTree))
                .Where(x => x != null)
                .ToList();

            if (p1.Count != 0 && p2.Count == 0)
            {
                return new HtmlList(p1);
            }
            else if (p1.Count == 0 && p2.Count != 0)
            {
                return new HtmlList(p2);
            }
            else if (p1.Count == 0 && p2.Count == 0)
            {
                return null;
            }

            var container1 = new HtmlElementTextContentDiv(p1)
            {
                Id = $"{Id}-p1",
                Class = "wx-side-pane"
            };

            var container2 = new HtmlElementTextContentDiv(p2)
            {
                Id = $"{Id}-p2",
                Class = "wx-main-pane"
            };

            var html = new HtmlElementTextContentDiv(container1, container2)
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-split", GetClasses()),
                Style = GetStyles(),
                Role = Role
            }
                .AddUserAttribute
                (
                    "data-orientation",
                    Orientation == TypeOrientationSplit.Horizontal ? "horizontal" : "vertical"
                )
                .AddUserAttribute("data-min-side", SidePanelMinSize >= 0 ? SidePanelMinSize.ToString() : null)
                .AddUserAttribute("data-size", SidePanelInitialSize >= 0 ? SidePanelInitialSize.ToString() : null)
                .AddUserAttribute("data-max-side", SidePanelMaxSize >= 0 ? SidePanelMaxSize.ToString() : null)
                .AddUserAttribute("data-splitter-size", SplitterSize >= 0 ? SplitterSize.ToString() : null)
                .AddUserAttribute("data-splitter-class", SplitterColor.ToClass())
                .AddUserAttribute("data-splitter-style", SplitterColor.ToStyle())
                .AddUserAttribute("data-order", Order.ToValue())
                .AddUserAttribute("data-unit", Unit.ToValue());

            return html;
        }
    }
}
