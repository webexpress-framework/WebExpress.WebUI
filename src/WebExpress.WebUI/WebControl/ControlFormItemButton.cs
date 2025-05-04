using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a button form item control.
    /// </summary>
    public class ControlFormItemButton : ControlFormItem, IControlFormItemButton
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Returns or sets the content.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Returns or sets the color of the button.
        /// </summary>
        public PropertyColorButton Color
        {
            get => (PropertyColorButton)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(Outline), () => value?.ToStyle(Outline));
        }

        /// <summary>
        /// Returns or sets the size.
        /// </summary>
        public TypeSizeButton Size
        {
            get => (TypeSizeButton)GetProperty(TypeSizeButton.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the Outline property.
        /// </summary>
        public bool Outline { get; set; }

        /// <summary>
        /// Returns or sets whether the button should take up the full width.
        /// </summary>
        public TypeBlockButton Block
        {
            get => (TypeBlockButton)GetProperty(TypeBlockButton.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets whether the button is disabled.
        /// </summary>
        public bool Disabled { get; set; }

        /// <summary>
        /// Event is triggered when the button is clicked.
        /// </summary>
        public EventHandler<ControlFormEvent> Click;

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Returns or sets the type. (button, submit, reset)
        /// </summary>
        public TypeButton Type { get; set; } = TypeButton.Default;

        /// <summary>
        /// Returns or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The child controls to be added to the button.</param>
        public ControlFormItemButton(string id = null, params IControl[] content)
            : base(id)
        {
            _content.AddRange(content);

            Disabled = false;
            Size = TypeSizeButton.Default;
        }

        /// <summary>
        /// Adds one or more controls to the content.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        /// <remarks>
        /// This method allows adding one or multiple controls to the <see cref="Content"/> collection of the control panel. 
        /// It is useful for dynamically constructing the user interface by appending various controls to the panel's content.
        /// 
        /// Example usage:
        /// <code>
        /// var button = new ControlFormItemButton();
        /// var text1 = new ControlText { Text = "Save" };
        /// var text2 = new ControlText { Text = "Cancel" };
        /// button.Add(text1, text2);
        /// </code>
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemButton Add(params IControl[] controls)
        {
            _content.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Adds one or more controls to the content.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        /// <remarks>
        /// This method allows adding one or multiple controls to the <see cref="Content"/> collection of the control panel. 
        /// It is useful for dynamically constructing the user interface by appending various controls to the panel's content.
        /// 
        /// Example usage:
        /// <code>
        /// var button = new ControlFormItemButton();
        /// var text1 = new ControlText { Text = "Save" };
        /// var text2 = new ControlText { Text = "Cancel" };
        /// button.Add(new List<IControl>([text1, text2]));
        /// </code>
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemButton Add(IEnumerable<IControl> controls)
        {
            _content.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the content of the control panel.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <remarks>
        /// This method allows removing a specific control from the <see cref="Content"/> collection of 
        /// the control panel.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemButton Remove(IControl control)
        {
            _content.Remove(control);

            return this;
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
        }

        /// <summary>
        /// Convert to html.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>The control as html.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementFieldButton()
            {
                Id = Id,
                Name = Name,
                Type = Type.ToTypeString(),
                Class = Css.Concatenate("btn", GetClasses()),
                Style = GetStyles(),
                Role = Role,
                Disabled = Disabled,
                OnClick = OnClick?.ToString()
            };

            if (Icon != null)
            {
                html.Add(new ControlIcon()
                {
                    Icon = Icon,
                    Margin = !string.IsNullOrWhiteSpace(Text) ? new PropertySpacingMargin
                    (
                        PropertySpacing.Space.None,
                        PropertySpacing.Space.Two,
                        PropertySpacing.Space.None,
                        PropertySpacing.Space.None
                    ) : new PropertySpacingMargin(PropertySpacing.Space.None),
                    VerticalAlignment = TypeVerticalAlignment.Default
                }.Render(renderContext, visualTree));
            }

            if (!string.IsNullOrWhiteSpace(Text))
            {
                html.Add(new HtmlText(I18N.Translate(renderContext.Request?.Culture, Text)));
            }

            if (_content.Count > 0)
            {
                html.Add(Content.Select(x => x.Render(renderContext, visualTree)));
            }

            return html;
        }

        /// <summary>
        /// Triggers the click event.
        /// </summary>
        /// <param name="e">The event argument.</param>
        protected virtual void OnClickEvent(ControlFormEvent e)
        {
            Click?.Invoke(this, e);
        }
    }
}
