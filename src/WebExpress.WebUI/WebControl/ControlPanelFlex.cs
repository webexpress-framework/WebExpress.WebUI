using System;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control panel that uses a flexbox layout to arrange its child controls.
    /// </summary>
    public class ControlPanelFlex : ControlPanel
    {
        /// <summary>
        /// Gets or sets whether the items should be displayed inline.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeLayoutFlex> Layout
        {
            get => (Func<IRenderControlContext, TypeLayoutFlex>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the horizontal alignment of the items.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeJustifiedFlex> Justify
        {
            get => (Func<IRenderControlContext, TypeJustifiedFlex>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the vertical orientation of the items.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeAlignFlex> Align
        {
            get => (Func<IRenderControlContext, TypeAlignFlex>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the overflow behavior of the items.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeWrap> Wrap
        {
            get => (Func<IRenderControlContext, TypeWrap>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the gap type associated with the current instance.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeGap> Gap
        {
            get => (Func<IRenderControlContext, TypeGap>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The flexbox items.</param>
        public ControlPanelFlex(string id = null, params IControl[] content)
            : base(id, content)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var role = Role?.Invoke(renderContext);

            return new HtmlElementTextContentDiv([.. Content.Select(x => x.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = Css.Concatenate("", GetClasses()),
                Style = GetStyles(),
                Role = role,
                DataTheme = Theme?.Invoke(renderContext).ToValue()
            };
        }
    }
}
