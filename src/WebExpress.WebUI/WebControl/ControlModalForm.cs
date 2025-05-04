using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a modal form control that can display a form in a modal dialog.
    /// </summary>
    public class ControlModalForm : ControlModal
    {
        /// <summary>
        /// Returns the form.
        /// </summary>
        public ControlForm Form { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The form controls.</param>
        public ControlModalForm(string id = null, params ControlFormItem[] items)
            : base("modal_" + id)
        {
            Form = items != null ? new ControlForm(id, items) : new ControlForm(id);
            //Form.InitializeForm += OnInitializeForm;
            //Form.Validated += OnValidatedForm;
        }

        /// <summary> 
        /// Adds one or more form items to the content of the form.
        /// </summary> 
        /// <param name="controls">The form items to add to the form.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple form items to the <see cref="ControlFormItem"/> collection of 
        /// the form. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the form's content. 
        /// Example usage: 
        /// <code> 
        /// var form = new ControlForm(); 
        /// var button1 = new ControlButton { Text = "Save" };
        /// var button2 = new ControlButton { Text = "Cancel" };
        /// form.Add(button1, button2);
        /// </code> 
        /// This method accepts any control that implements the <see cref="ControlFormItem"/> interface.
        /// </remarks>
        public virtual void Add(params ControlFormItem[] items)
        {
            Form.Add(items);
        }

        /// <summary> 
        /// Adds one or more form items to the content of the form.
        /// </summary> 
        /// <param name="controls">The form items to add to the form.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple form items to the <see cref="ControlFormItem"/> collection of 
        /// the form. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the form's content. 
        /// Example usage: 
        /// <code> 
        /// var form = new ControlForm(); 
        /// var button1 = new ControlButton { Text = "Save" };
        /// var button2 = new ControlButton { Text = "Cancel" };
        /// form.Add(button1, button2);
        /// </code> 
        /// This method accepts any control that implements the <see cref="ControlFormItem"/> interface.
        /// </remarks>
        public virtual void Add(IEnumerable<ControlFormItem> items)
        {
            Form.Add(items);
        }

        /// <summary>
        /// Removes a form item from the content of the form.
        /// </summary>
        /// <param name="item">The form item to remove from the form.</param>
        /// <remarks>
        /// This method allows removing a specific form item from the <see cref="Items"/> collection of 
        /// the form.
        /// </remarks>
        public virtual void Remove(ControlFormItem item)
        {
            Form.Remove(item);
        }

        /// <summary>
        /// Invoked when the form is initialized.
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="e">The event argument.</param>
        private void OnInitializeForm(object sender, ControlFormEvent e)
        {
            ShowIfCreated = false;
        }

        /// <summary>
        /// Invoked when the form has been validated.
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="e">The event argument.</param>
        private void OnValidatedForm(object sender, ValidationResultEventArgs e)
        {
            if (!e.Valid)
            {
                ShowIfCreated = true;
                Fade = false;
            }
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return Render(renderContext, visualTree, Form.Items);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="items">The form items.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlFormItem> items)
        {
            var fade = Fade;
            var classes = Classes.ToList();

            var form = Form.Render(renderContext, visualTree, items) as HtmlElementFormForm;

            classes.Add("modal");

            if (Fade)
            {
                classes.Add("fade");
            }

            var headerText = new HtmlElementSectionH4(I18N.Translate(renderContext.Request?.Culture, Header))
            {
                Class = "modal-title"
            };

            var headerButton = new HtmlElementFieldButton()
            {
                Class = "btn-close"
            };
            headerButton.AddUserAttribute("aria-label", "close");
            headerButton.AddUserAttribute("data-bs-dismiss", "modal");

            var header = new HtmlElementTextContentDiv(headerText, headerButton)
            {
                Class = "modal-header"
            };

            var formElements = form.Elements.Where(x => x is not HtmlElementSectionFooter && x is not HtmlElementTextContentDiv);

            var body = new HtmlElementTextContentDiv([.. formElements])
            {
                Class = "modal-body"
            };

            var footer = default(HtmlElementTextContentDiv);
            var cancelFooterButton = new ControlButtonLink()
            {
                Text = I18N.Translate(renderContext.Request?.Culture, "webexpress.webui:modal.close.label")
            }.Render(renderContext, visualTree) as HtmlElement;
            cancelFooterButton.AddUserAttribute("data-bs-dismiss", "modal");

            var buttons = Form.Buttons.Select(x => x.Render(new RenderControlFormContext(renderContext, Form), visualTree));

            footer = new HtmlElementTextContentDiv([.. buttons.Concat([cancelFooterButton])])
            {
                Class = "modal-footer d-flex justify-content-between"
            };

            var content = new HtmlElementTextContentDiv(header, body, footer)
            {
                Class = "modal-content"
            };

            var dialog = new HtmlElementTextContentDiv(content)
            {
                Class = "modal-dialog",
                Role = "document"
            };

            var html = new HtmlElementTextContentDiv(dialog)
            {
                Id = Id,
                Class = string.Join(" ", classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                Role = "dialog"
            };

            if (!string.IsNullOrWhiteSpace(OnShownCode))
            {
                var shown = "$('#" + Id + "').on('shown.bs.modal', function(e) { " + OnShownCode + " });";
                visualTree.AddScript(Id + "_shown", shown);
            }

            if (!string.IsNullOrWhiteSpace(OnHiddenCode))
            {
                var hidden = "$('#" + Id + "').on('hidden.bs.modal', function() { " + OnHiddenCode + " });";
                visualTree.AddScript(Id + "_hidden", hidden);
            }

            if (ShowIfCreated)
            {
                var show = "$('#" + Id + "').modal('show');";
                visualTree.AddScript(Id + "_showifcreated", show);
            }

            form.Clear();
            form.Add(html);

            Fade = fade;

            return form;
        }
    }
}
