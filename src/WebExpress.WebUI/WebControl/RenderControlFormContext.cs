using System.Collections.Generic;
using WebExpress.WebCore.WebEndpoint;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Provides the context for rendering a form control within a web page.
    /// </summary>
    public class RenderControlFormContext : RenderControlContext, IRenderControlFormContext
    {
        private readonly Dictionary<IControlFormItemInput, string> _values = new();

        /// <summary>
        /// Returns the form in which the control is rendered.
        /// </summary>
        public IControlForm Form { get; private set; }

        /// <summary>
        /// Returns the dictionary of input controls and their associated values.
        /// </summary>
        public IReadOnlyDictionary<IControlFormItemInput, string> Values => _values;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="endpoint">The endpoint where the control is rendered.</param>
        /// <param name="pageContext">The page context where the control is rendered.</param>
        /// <param name="request">The request associated with the rendering context.</param>
        /// <param name="form">The form in which the control is rendered.</param>
        public RenderControlFormContext(IEndpoint endpoint, IPageContext pageContext, Request request, IControlForm form)
            : base(endpoint, pageContext, request)
        {
            Form = form;
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="form">The form in which the control is rendered.</param>
        public RenderControlFormContext(IRenderContext renderContext, IControlForm form)
            : base(renderContext)
        {
            Form = form;
        }

        /// <summary>
        /// Initializes a new instance of the class by copying an existing context.
        /// </summary>
        /// <param name="renderContext">The render context to copy.</param>
        public RenderControlFormContext(IRenderControlFormContext renderContext)
            : this(renderContext, renderContext?.Form)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="form">The form in which the control is rendered.</param>
        public RenderControlFormContext(IRenderControlFormContext renderContext, IControlForm form)
            : base(renderContext)
        {
            Form = form;
            _values = new Dictionary<IControlFormItemInput, string>(renderContext.Values);
        }

        /// <summary>
        /// Retrieves the value associated with the specified input control.
        /// </summary>
        /// <param name="input">The input control whose value is to be retrieved.</param>
        /// <returns>The value associated with the input control, or <c>null</c> if not found.</returns>
        public string GetValue(IControlFormItemInput input)
        {
            _values.TryGetValue(input, out var obj);

            return obj;
        }

        /// <summary>
        /// Sets the value for the specified input control.
        /// </summary>
        /// <param name="input">The input control for which the value is to be set.</param>
        /// <param name="value">The value to set for the input control.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IRenderControlFormContext SetValue(IControlFormItemInput input, string value)
        {
            if (!_values.TryAdd(input, value))
            {
                _values[input] = value;
            }

            return this;
        }
    }
}
