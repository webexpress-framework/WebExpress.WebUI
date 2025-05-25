using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Represents a fragment control interface.
    /// </summary>
    public interface IFragmentControl : IFragmentWebUIElement<IRenderControlContext, IVisualTreeControl>, IControl
    {
    }

    /// <summary>
    /// Represents a fragment interface with a generic type parameter.
    /// </summary>
    /// <typeparam name="TControl">The type of control that implements the IControl interface.</typeparam>
    public interface IFragmentControl<TControl> : IFragmentControl
        where TControl : class, IControl
    {
        /// <summary>
        /// Gets the context of the fragment.
        /// </summary>
        IFragmentContext FragmentContext { get; }
    }
}
