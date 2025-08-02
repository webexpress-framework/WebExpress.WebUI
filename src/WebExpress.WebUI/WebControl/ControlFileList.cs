using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that manages a list of file items.
    /// </summary>
    public class ControlFileList : Control, IControlFileList
    {
        private readonly List<IControlFileListItem> _files = [];

        /// <summary>
        /// Returns the collection of control file list items.
        /// </summary>
        public IEnumerable<IControlFileListItem> Files => _files;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The unique identifier for the control.</param>
        /// <param name="items">An array of items to initialize the file list with.</param>
        public ControlFileList(string id = null, params IControlFileListItem[] items)
            : base(id)
        {
            _files.AddRange(items);
        }

        /// <summary>
        /// Adds the specified items to the control file list.
        /// </summary>
        /// <param name="items">An array to add to the list.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFileList Add(params IControlFileListItem[] items)
        {
            _files.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds the specified items to the control file list.
        /// </summary>
        /// <param name="items">An array to add to the list.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFileList Add(IEnumerable<IControlFileListItem> items)
        {
            _files.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified file item from the control.
        /// </summary>
        /// <param name="item">The file item to be removed.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFileList Remove(IControlFileListItem item)
        {
            _files.Remove(item);

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
            return Render(renderContext, visualTree, Files);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="nodes">The collection of tree nodes to process.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlFileListItem> nodes)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-file-list", GetClasses()),
                Style = GetStyles()
            }
                .Add(Files.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
