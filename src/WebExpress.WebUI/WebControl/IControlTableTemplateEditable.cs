using System;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for a table template whose cells can be edited inline.
    /// </summary>
    public interface IControlTableTemplateEditable : IControlTableTemplate
    {
        /// <summary>
        /// Gets a value indicating whether the current template is editable or read-only.
        /// </summary>
        Func<IRenderControlContext, bool> Editable { get; }
    }
}
