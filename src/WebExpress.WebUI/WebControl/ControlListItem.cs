using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a list item control that can contain other controls as its content.
    /// </summary>
    public class ControlListItem : Control
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Returns the content.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Returns or sets the ativity state of the list item.
        /// </summary>
        public TypeActive Active
        {
            get => (TypeActive)GetProperty(TypeActive.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlListItem(string id = null, params IControl[] content)
            : base(id)
        {
            _content.AddRange(content);
        }

        /// <summary> 
        /// Adds one or more controls to the content of the list item.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple controls to the content collection of 
        /// the list item. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the content. 
        /// 
        /// Example usage: 
        /// <code> 
        /// var item = new ControlListItem(); 
        /// var text1 = new ControlText { Text = "A" };
        /// var text2 = new ControlText { Text = "B" };
        /// item.Add(text1, text2);
        /// </code> 
        /// 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        public virtual void Add(params IControl[] controls)
        {
            _content.AddRange(controls);
        }

        /// <summary> 
        /// Adds one or more controls to the content of the list item.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple controls to the content collection of 
        /// the list item. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the content. 
        /// 
        /// Example usage: 
        /// <code> 
        /// var item = new ControlListItem(); 
        /// var text1 = new ControlText { Text = "A" };
        /// var text2 = new ControlText { Text = "B" };
        /// item.Add(new List<IControl>([text1, text2]));
        /// </code> 
        /// 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        public virtual void Add(IEnumerable<IControl> controls)
        {
            _content.AddRange(controls);
        }

        /// <summary>
        /// Removes a control from the content of the list item.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <remarks>
        /// This method allows removing a specific control from the content collection of 
        /// the list item.
        /// </remarks>
        public virtual void Remove(IControl control)
        {
            _content.Remove(control);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return new HtmlElementTextContentLi([.. Content.Where(x => x.Enable).Select(x => x.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = GetClasses(),
                Style = GetStyles(),
                Role = Role
            }.AddUserAttribute("aria-current", Active == TypeActive.Active ? "true" : null);
        }
    }
}
