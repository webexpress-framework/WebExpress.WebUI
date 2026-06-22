using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebTheme;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders a clickable button the user presses to trigger an action or submit a form.
    /// </summary>
    public class ControlButton : Control, IControlButton
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Returns the content of the control.
        /// </summary>
        /// <value>
        /// An enumerable collection of child controls.
        /// </value>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Gets or sets the color.
        /// </summary>
        public new Func<IRenderControlContext, PropertyColorButton> BackgroundColor
        {
            get => (Func<IRenderControlContext, PropertyColorButton>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(Outline?.Invoke(null) ?? false), (renderContext) => value?.Invoke(renderContext)?.ToStyle(Outline?.Invoke(renderContext) ?? false));
        }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeButton> Size
        {
            get => (Func<IRenderControlContext, TypeSizeButton>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the outline property
        /// </summary>
        public Func<IRenderControlContext, bool> Outline { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets whether the button should take up the full width.
        /// </summary>
        public Func<IRenderControlContext, TypeBlockButton> Block
        {
            get => (Func<IRenderControlContext, TypeBlockButton>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the value.
        /// </summary>
        public Func<IRenderControlContext, string> Value { get; set; }

        /// <summary>
        /// Gets or sets the primary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the activation status of the button.
        /// </summary>
        public Func<IRenderControlContext, TypeActive> Active
        {
            get => (Func<IRenderControlContext, TypeActive>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The child controls to be added to the button.</param>
        public ControlButton(string id = null, params IControl[] content)
            : base(id)
        {
            _content.AddRange(content);

            BackgroundColor = _ => new PropertyColorButton(TypeColorButton.Default);
            Size = _ => TypeSizeButton.Default;
            Block = _ => TypeBlockButton.None;
            Active = _ => TypeActive.None;
        }

        /// <summary>
        /// Adds one or more controls to the content.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlButton Add(params IControl[] items)
        {
            _content.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more controls to the content.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlButton Add(IEnumerable<IControl> items)
        {
            _content.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a control from the content of the button.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlButton Remove(IControl control)
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
            return Render(renderContext, visualTree, _content);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="content">The content to be rendered within the button.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControl> content)
        {
            var text = Text?.Invoke(renderContext);
            var value = Value?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext)?.ApplyIconTheme(visualTree?.IconTheme ?? TypeIconTheme.Default);
            var outline = Outline?.Invoke(renderContext) ?? false;
            var primaryAction = PrimaryAction?.Invoke(renderContext);
            var secondaryAction = SecondaryAction?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);
            var active = Active?.Invoke(renderContext);

            var html = new HtmlElementFieldButton()
            {
                Id = Id,
                Value = value,
                Type = "button",
                Class = Css.Concatenate("wx-button btn", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role,
                Disabled = active == TypeActive.Disabled
            };

            if (icon is not null)
            {
                html.Add(new ControlIcon()
                {
                    Icon = _ => icon
                }.Render(renderContext, visualTree));
            }

            if (!string.IsNullOrWhiteSpace(text))
            {
                html.Add(new HtmlText(I18N.Translate(renderContext.Request.Culture, text)));
            }

            if (_content.Count != 0)
            {
                html.Add(_content.Select(x => x.Render(renderContext, visualTree)).ToArray());
            }

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
