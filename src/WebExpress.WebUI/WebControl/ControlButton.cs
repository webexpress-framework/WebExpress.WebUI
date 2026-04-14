using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a button control.
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
        public new PropertyColorButton BackgroundColor
        {
            get => (PropertyColorButton)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(Outline), () => value?.ToStyle(Outline));
        }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public TypeSizeButton Size
        {
            get => (TypeSizeButton)GetProperty(TypeSizeButton.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the outline property
        /// </summary>
        public bool Outline { get; set; }

        /// <summary>
        /// Gets or sets whether the button should take up the full width.
        /// </summary>
        public TypeBlockButton Block
        {
            get => (TypeBlockButton)GetProperty(TypeBlockButton.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets the value.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public IAction PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        public IAction SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets the activation status of the button.
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
        /// <param name="content">The child controls to be added to the button.</param>
        public ControlButton(string id = null, params IControl[] content)
            : base(id)
        {
            Size = TypeSizeButton.Default;
            _content.AddRange(content);
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
            var html = new HtmlElementFieldButton()
            {
                Id = Id,
                Type = "button",
                Value = Value,
                Class = Css.Concatenate("wx-button btn", GetClasses()),
                Style = GetStyles(),
                Role = Role,
                Disabled = Active == TypeActive.Disabled
            };

            if (Icon is not null)
            {
                html.Add(new ControlIcon()
                {
                    Icon = Icon
                }.Render(renderContext, visualTree));
            }

            if (!string.IsNullOrWhiteSpace(Text))
            {
                html.Add(new HtmlText(I18N.Translate(renderContext.Request.Culture, Text)));
            }

            if (!string.IsNullOrWhiteSpace(OnClick?.ToString()))
            {
                html.AddUserAttribute("onclick", OnClick?.ToString());
            }

            if (_content.Count != 0)
            {
                html.Add(_content.Select(x => x.Render(renderContext, visualTree)).ToArray());
            }

            PrimaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            SecondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
