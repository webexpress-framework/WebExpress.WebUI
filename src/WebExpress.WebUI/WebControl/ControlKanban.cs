using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a kanban control that can contain multiple cards.
    /// </summary>
    public class ControlKanban : Control, IControlKanban
    {
        private readonly List<IControlKanbanColumn> _columns = [];
        private readonly List<IControlKanbanSwimlane> _swimlane = [];
        private readonly List<IControlKanbanCard> _cards = [];

        /// <summary>
        /// Returns the collection of cards.
        /// </summary>
        public IEnumerable<IControlKanbanCard> Cards => _cards;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The card items to be added.</param>
        public ControlKanban(string id = null, params IControlKanbanCard[] items)
            : base(id)
        {
            _cards.AddRange(items);
        }

        /// <summary>
        /// Adds one or more columns to the kanban control.
        /// </summary>
        /// <param name="columns">
        /// An array of columns to add to the kanban.
        /// </param>
        /// <returns>
        /// The updated kanban control instance with the specified columns added.
        /// </returns>
        public virtual IControlKanban Add(params IControlKanbanColumn[] columns)
        {
            _columns.AddRange(columns);

            return this;
        }

        /// <summary>
        /// Adds the specified collection of swimlanes to the kanban control.
        /// </summary>
        /// <param name="swimlanes">
        /// An enumerable collection of swimlanes to add. Each swimlane represents a 
        /// distinct workflow lane to be included in the kanban control.
        /// </param>
        /// <returns>
        /// An instance of the control with the added swimlanes.
        /// </returns>
        public virtual IControlKanban Add(params IControlKanbanSwimlane[] swimlanes)
        {
            _swimlane.AddRange(swimlanes);

            return this;
        }

        /// <summary>
        /// Adds one or more cards to the kanban.
        /// </summary>
        /// <param name="cards">The cards to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlKanban Add(params IControlKanbanCard[] cards)
        {
            _cards.AddRange(cards);

            return this;
        }

        /// <summary>
        /// Adds one or more columns to the kanban control.
        /// </summary>
        /// <param name="columns">
        /// An array of columns to add to the kanban.
        /// </param>
        /// <returns>
        /// The updated kanban control instance with the specified columns added.
        /// </returns>
        public virtual IControlKanban Add(IEnumerable<IControlKanbanColumn> columns)
        {
            _columns.AddRange(columns);

            return this;
        }

        /// <summary>
        /// Adds the specified collection of swimlanes to the kanban control.
        /// </summary>
        /// <param name="swimlanes">
        /// An enumerable collection of swimlanes to add. Each swimlane represents a 
        /// distinct workflow lane to be included in the kanban control.
        /// </param>
        /// <returns>
        /// An instance of the control with the added swimlanes.
        /// </returns>
        public virtual IControlKanban Add(IEnumerable<IControlKanbanSwimlane> swimlanes)
        {
            _swimlane.AddRange(swimlanes);

            return this;
        }

        /// <summary>
        /// Adds a collection of cards to the kanban.
        /// </summary>
        /// <param name="cards">The collection of cards to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlKanban Add(IEnumerable<IControlKanbanCard> cards)
        {
            _cards.AddRange(cards);

            return this;
        }

        /// <summary>
        /// Removes all columns from the kanban control.
        /// </summary>
        /// <returns>
        /// The current instance of the kanban control, allowing for method 
        /// chaining.
        /// </returns>
        public virtual IControlKanban ClearColumns()
        {
            _columns.Clear();

            return this;
        }

        /// <summary>
        /// Removes all swimlanes from the Kanban control.
        /// </summary>
        /// <returns>
        /// The current instance of the control, enabling method chaining.
        /// </returns>
        public virtual IControlKanban ClearSwimlanes()
        {
            _swimlane.Clear();

            return this;
        }

        /// <summary>
        /// Clears all cards from the kanban.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlKanban Clear()
        {
            _cards.Clear();

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
            return Render(renderContext, visualTree, _cards);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="cards">The collection of cards to be rendered within the kanban control.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlKanbanCard> cards)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-kanban", GetClasses()),
                Style = GetStyles()
            }
                .Add(_columns.Select(x => x.Render(renderContext, visualTree)))
                .Add(_swimlane.Select(x => x.Render(renderContext, visualTree)))
                .Add(cards.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
