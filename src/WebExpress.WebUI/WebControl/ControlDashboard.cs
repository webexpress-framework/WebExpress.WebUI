using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dashboard control that can contain multiple widgets.
    /// </summary>
    public class ControlDashboard : Control, IControlDashboard
    {
        private readonly List<ControlDashboardColumn> _columns = [];
        private readonly List<IControlDashboardWidget> _widgets = [];

        /// <summary>
        /// Returns the collection of widgets.
        /// </summary>
        public IEnumerable<IControlDashboardWidget> Widgets => _widgets;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The carousel items to be added.</param>
        public ControlDashboard(string id = null, params IControlDashboardWidget[] items)
            : base(id)
        {
            _widgets.AddRange(items);
        }

        /// <summary>
        /// Adds one or more columns to the control dashboard.
        /// </summary>
        /// <param name="columns">
        /// An array of columns to add to the dashboard.
        /// </param>
        /// <returns>
        /// The updated control dashboard instance with the specified columns added.
        /// </returns>
        public IControlDashboard Add(params ControlDashboardColumn[] columns)
        {
            _columns.AddRange(columns);
            return this;
        }


        /// <summary>
        /// Adds one or more widgets to the dashboard.
        /// </summary>
        /// <param name="widgets">The widgets to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDashboard Add(params IControlDashboardWidget[] widgets)
        {
            _widgets.AddRange(widgets);

            return this;
        }

        /// <summary>
        /// Adds one or more columns to the control dashboard.
        /// </summary>
        /// <param name="columns">
        /// An array of columns to add to the dashboard.
        /// </param>
        /// <returns>
        /// The updated control dashboard instance with the specified columns added.
        /// </returns>
        public IControlDashboard Add(IEnumerable<ControlDashboardColumn> columns)
        {
            _columns.AddRange(columns);
            return this;
        }

        /// <summary>
        /// Adds one or more widgets to the dashboard.
        /// </summary>
        /// <param name="widgets">The widgets to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDashboard Add(IEnumerable<IControlDashboardWidget> widgets)
        {
            _widgets.AddRange(widgets);

            return this;
        }

        /// <summary>
        /// Removes all columns from the dashboard control.
        /// </summary>
        /// <returns>
        /// The current instance of the dashboard control, allowing for method 
        /// chaining.
        /// </returns>
        public IControlDashboard ClearColumns()
        {
            _columns.Clear();

            return this;
        }

        /// <summary>
        /// Clears all widgets from the dashboard.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDashboard Clear()
        {
            _widgets.Clear();

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
            return Render(renderContext, visualTree, _widgets);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlDashboardWidget> widgets)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-dashboard", GetClasses()),
                Style = GetStyles()
            }
                .Add(_columns.Select(x => x.Render(renderContext, visualTree)))
                .Add(widgets.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
