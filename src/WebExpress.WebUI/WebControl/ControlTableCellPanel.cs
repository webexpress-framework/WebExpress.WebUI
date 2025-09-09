using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table cell in a control, including its attributes and content.
    /// </summary>
    /// <remarks>This class provides properties to define the cell's identifier, CSS class, inline styles, 
    /// and the content displayed within the cell. It is typically used to represent and manipulate  individual cells in
    /// a table-like control.</remarks>
    public class ControlTableCellPanel : IControlTableCellPanel
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Returns or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Returns or sets the class or category associated with the current object.
        /// </summary>
        public virtual string Class { get; set; }

        /// <summary>
        /// Returns or sets the style applied to the element.
        /// </summary>
        public virtual string Style { get; set; }

        /// <summary>
        /// Returns or sets the color scheme used for the cell.
        /// </summary>
        public virtual TypeColorTable Color { get; set; } = TypeColorTable.Default;

        /// <summary> 
        /// Returns the content of the cell panel. 
        /// </summary> 
        /// <remarks> 
        /// The content property holds a collection of controls that represent 
        /// the visual and interactive elements within this cell. 
        /// </remarks>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">The unique identifier for the table cell. Cannot be null or empty.</param>
        public ControlTableCellPanel(string id = null)
        {
            Id = id;
        }

        /// <summary> 
        /// Adds one or more controls to the content of the cell panel.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableCellPanel Add(params IControl[] controls)
        {
            _content.AddRange(controls);

            return this;
        }

        /// <summary> 
        /// Adds one or more controls to the content of the cell panel.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableCellPanel Add(IEnumerable<IControl> controls)
        {
            _content.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the content of the cell panel.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableCellPanel Remove(IControl control)
        {
            _content.Remove(control);

            return this;
        }

        /// <summary>
        /// Clears all controls from the content of the cell panel.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableCellPanel Clear()
        {
            _content.Clear();

            return this;
        }

        /// <summary>
        /// Converts the cell to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Class,
                Style = Style
            }
                .AddUserAttribute("data-color", Color.ToClass())
                .Add(_content.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
