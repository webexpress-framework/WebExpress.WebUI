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
        /// Gets or sets the content.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Gets or sets the color of the button.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorButton> Color
        {
            get => (Func<IRenderControlContext, PropertyColorButton>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null)?.ToClass(), () => value?.Invoke(null)?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeButton> Size
        {
            get => (Func<IRenderControlContext, TypeSizeButton>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the Outline property.
        /// </summary>
        public Func<IRenderControlContext, bool> Outline { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets whether the button should take up the full width.
        /// </summary>
        public Func<IRenderControlContext, TypeBlockButton> Block
        {
            get => (Func<IRenderControlContext, TypeBlockButton>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets whether the button is disabled.
        /// </summary>
        public Func<IRenderControlContext, bool> Disabled { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the type. (button, submit, reset)
        /// </summary>
        public Func<IRenderControlContext, TypeButton> Type { get; set; } = _ => TypeButton.Default;

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The child controls to be added to the button.</param>
        public ControlFormItemButton(string id = null, params IControl[] content)
            : base(id)
        {
            _content.AddRange(content);

            Name = _ => Id;
            Disabled = _ => false;
            Size = _ => TypeSizeButton.Default;
        }

        /// <summary>
        /// Adds one or more controls to the content.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        /// <remarks>
        /// This method allows adding one or multiple controls to the content collection 
        /// of the control panel. It is useful for dynamically constructing the user interface by 
        /// appending various controls to the panel's content.
        /// 
        /// Example usage:
        /// <code>
        /// var button = new ControlFormItemButton();
        /// var text1 = new ControlText { Text = "Save" };
        /// var text2 = new ControlText { Text = "Cancel" };
        /// button.Add(text1, text2);
        /// </code>
        /// 
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
        /// This method allows adding one or multiple controls to the <see cref="Content"/> collection 
        /// of the control panel. It is useful for dynamically constructing the user interface by 
        /// appending various controls to the panel's content.
        /// 
        /// Example usage:
        /// <code>
        /// var button = new ControlFormItemButton();
        /// var text1 = new ControlText { Text = "Save" };
        /// var text2 = new ControlText { Text = "Cancel" };
        /// button.Add(text1, text2);
        /// </code>
        /// 
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
            var outline = Outline?.Invoke(renderContext) ?? false;
            var color = Color?.Invoke(renderContext);
            var size = Size?.Invoke(renderContext) ?? TypeSizeButton.Default;
            var block = Block?.Invoke(renderContext) ?? TypeBlockButton.None;
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var type = Type?.Invoke(renderContext) ?? TypeButton.Default;
            var text = Text?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);

            var classes = Css.Replace(GetClasses(), color?.ToClass(), color?.ToClass(outline));
            var styles = Style.Replace(GetStyles(), color?.ToStyle(), color?.ToStyle(outline));

            var html = new HtmlElementFieldButton()
            {
                Id = Id,
                Name = Name?.Invoke(renderContext),
                Type = type.ToTypeString(),
                Class = Css.Concatenate("btn", classes),
                Style = styles,
                Role = role,
                Disabled = disabled
            };

            if (icon is not null)
            {
                html.Add(new ControlIcon()
                {
                    Icon = _ => icon,
                    Margin = _ => !string.IsNullOrWhiteSpace(text) ? new PropertySpacingMargin
                    (
                        PropertySpacing.Space.None,
                        PropertySpacing.Space.Two,
                        PropertySpacing.Space.None,
                        PropertySpacing.Space.None
                    ) : new PropertySpacingMargin(PropertySpacing.Space.None),
                    VerticalAlignment = _ => TypeVerticalAlignment.Default
                }.Render(renderContext, visualTree));
            }

            if (!string.IsNullOrWhiteSpace(text))
            {
                html.Add(new HtmlText(I18N.Translate(renderContext.Request?.Culture, text)));
            }

            if (_content.Count > 0)
            {
                html.Add(Content.Select(x => x.Render(renderContext, visualTree)));
            }

            return html;
        }
    }
}
