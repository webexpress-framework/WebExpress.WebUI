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
        private readonly List<IControl> _panel1 = [];
        private readonly List<IControl> _panel2 = [];

        /// <summary>
        /// Returns the left or top panel in the ControlPanelSplit.
        /// </summary>
        public IEnumerable<IControl> Panel1 => _panel1;

        /// <summary>
        /// Returns the right or bottom pane in the ControlPanelSplit.
        /// </summary>
        public IEnumerable<IControl> Panel2 => _panel2;

        /// <summary>
        /// Returns or sets whether the splitter is horziontal or vertically oriented.
        /// </summary>
        public TypeOrientationSplit Orientation { get; set; }

        /// <summary>
        /// Returns or sets the color of the splitter.
        /// </summary>
        public PropertyColorBackground SplitterColor { get; set; } = new PropertyColorBackground(TypeColorBackground.Light);

        /// <summary>
        /// Returns or sets the width of the splitter.
        /// </summary>
        public int SplitterSize { get; set; } = 6;

        /// <summary>
        /// Returns or sets the minimum size of the left or top area in the ControlPanelSplit.
        /// </summary>
        public int Panel1MinSize { get; set; }

        /// <summary>
        /// Returns or sets the initial size of the left or top area in the ControlPanelSplit in %.
        /// </summary>
        public int Panel1InitialSize { get; set; } = -1;

        /// <summary>
        /// Returns or sets the minimum size of the right or bottom area in the ControlPanelSplit.
        /// </summary>
        public int Panel2MinSize { get; set; }

        /// <summary>
        /// Returns or sets the initial size of the right or bottom area in the ControlPanelSplit in %.
        /// </summary>
        public int Panel2InitialSize { get; set; } = -1;

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
        /// <param name="panel1">Left or top panel controls.</param>
        /// <param name="panel2">Right or bottom panel controls.</param>
        public ControlPanelSplit(string id, IControl[] panel1, IControl[] panel2)
            : base(id)
        {
            _panel1.AddRange(panel1);
            _panel2.AddRange(panel2);
        }

        /// <summary>
        /// Adds controls to the left or top panel.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlPanelSplit AddPanel1(params IControl[] controls)
        {
            _panel1.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the left or top panel.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlPanelSplit RemovePanel1(IControl control)
        {
            _panel1.Remove(control);

            return this;
        }

        /// <summary>
        /// Adds controls to the right or bottom panel.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlPanelSplit AddPanel2(params IControl[] controls)
        {
            _panel2.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the right or bottom panel.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlPanelSplit RemovePanel2(IControl control)
        {
            _panel2.Remove(control);

            return this;
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        protected virtual void Initialize(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var contextPath = renderContext?.PageContext?.ApplicationContext?.Route;

            var init1 = 0;
            var init2 = 0;

            if (Panel1InitialSize < 0 && Panel2InitialSize < 0)
            {
                init1 = init2 = 50;
            }
            else if (Panel1InitialSize < 0)
            {
                init1 = 100 - Panel2InitialSize;
                init2 = Panel2InitialSize;
            }
            else if (Panel2InitialSize < 0)
            {
                init1 = Panel1InitialSize;
                init2 = 100 - Panel1InitialSize;
            }

            visualTree.AddScript
            (
                Id, @"$(document).ready(function() { Split(['#" + Id + "-p1', '#" + Id + @"-p2'], {
                    sizes: [" + init1 + "," + init2 + @"],
                    minSize: [" + Panel1MinSize + "," + Panel2MinSize + @"],
                    direction: '" + Orientation.ToString().ToLower() + @"',
                    gutter: function (index, direction) 
                    {
                        var gutter = document.createElement('div');
                        gutter.id = '" + Id + @"-gutter';
                        gutter.className = 'wx-splitter wx-splitter-' + direction + ' " + SplitterColor.ToClass() + @"';
                        gutter.style = '" + SplitterColor.ToStyle() + @"';
                        return gutter;
                    },
                    gutterSize: " + SplitterSize + @",
                })});"
            );
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var p1 = Panel1
                .Select(x => x.Render(renderContext, visualTree))
                .Where(x => x != null)
                .ToList();
            var p2 = Panel2
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

            Initialize(renderContext, visualTree);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate(Orientation == TypeOrientationSplit.Horizontal ? "wx-split-horizontal" : "wx-split-vertical", GetClasses()),
                Style = GetStyles(),
                Role = Role
            };

            html.Add(new HtmlElementTextContentDiv([.. p1]) { Id = $"{Id}-p1" });
            html.Add(new HtmlElementTextContentDiv([.. p2]) { Id = $"{Id}-p2" });

            return html;
        }
    }
}
