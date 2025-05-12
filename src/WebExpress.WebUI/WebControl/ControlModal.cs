using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a modal control that can display content in a modal dialog.
    /// </summary>
    public class ControlModal : Control, IControlModal
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Returns the content.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Returns or sets the header.
        /// </summary>
        public string Header { get; set; }

        /// <summary>  
        /// Returns or sets the size of the modal dialog.  
        /// </summary>  
        /// <value>  
        /// One of the values of the <see cref="TypeModalSize"/> enumeration, specifying the size of the modal.  
        /// </value>  
        /// <remarks>  
        /// This property allows you to define the size of the modal dialog, such as Default, Small, Large, ExtraLarge, or Fullscreen.  
        /// </remarks>  
        public TypeModalSize Size { get; set; }

        /// <summary>
        /// Returns or sets the label for the close button of the modal.
        /// </summary>
        public string CloseLabel { get; set; } = "webexpress.webui:modal.close.label";

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">The name of the calling member. This is automatically provided by the compiler.</param>
        /// <param name="file">The file path of the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="line">The line number in the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="content">The content of the html element.</param>
        public ControlModal([CallerMemberName] string instance = null, [CallerFilePath] string file = null, [CallerLineNumber] int? line = null, params IControl[] content)
            : this($"modal_{instance}_{file}_{line}".GetHashCode().ToString("X"), content)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The content of the html element.</param>
        public ControlModal(string id, params IControl[] content)
            : base(id)
        {
            _content.AddRange(content);
        }

        /// <summary> 
        /// Adds one or more controls to the content of the modal.
        /// </summary> 
        /// <param name="controls">The controls to add to the modal.</param> 
        /// <returns>The current instance for method chaining.</returns>
        /// <remarks> 
        /// This method allows adding one or multiple controls to the <see cref="Content"/> collection of 
        /// the modal. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the panel's content. 
        /// Example usage: 
        /// <code> 
        /// var modal = new ControlModal(); 
        /// var text1 = new ControlText { Text = "Save" };
        /// var text2 = new ControlText { Text = "Cancel" };
        /// modal.Add(text1, text2);
        /// </code> 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        public IControlModal Add(params IControl[] controls)
        {
            _content.AddRange(controls);

            return this;
        }

        /// <summary> 
        /// Adds one or more controls to the content of the modal.
        /// </summary> 
        /// <param name="controls">The controls to add to the modal.</param> 
        /// <returns>The current instance for method chaining.</returns>
        /// <remarks> 
        /// This method allows adding one or multiple controls to the <see cref="Content"/> collection of 
        /// the modal. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the panel's content. 
        /// Example usage: 
        /// <code> 
        /// var modal = new ControlModal(); 
        /// var text1 = new ControlText { Text = "Save" };
        /// var text2 = new ControlText { Text = "Cancel" };
        /// modal.Add(new List<IControl>([text1, text2]));
        /// </code> 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        public IControlModal Add(IEnumerable<IControl> controls)
        {
            _content.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the content of the modal.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        /// <remarks>
        /// This method allows removing a specific control from the <see cref="Content"/> collection of 
        /// the modal.
        /// </remarks>
        public IControlModal Remove(IControl control)
        {
            _content.Remove(control);

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
            var header = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(Header)))
            {
                Class = "wx-modal-header"
            };

            var content = new HtmlElementTextContentDiv([.. _content.Select(x => x.Render(renderContext, visualTree))])
            {
                Class = "wx-modal-content"
            };

            var footer = new HtmlElementTextContentDiv()
            {
                Class = "wx-modal-footer"
            };

            var html = new HtmlElementTextContentDiv(header, content, footer)
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-modal", GetClasses())
            }
            .AddUserAttribute("data-size", Size.ToClass())
            .AddUserAttribute("data-close-label", I18N.Translate(CloseLabel));

            return html;
        }
    }
}
