using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input control that allows moving items between available and selected lists.
    /// </summary>
    public class ControlFormItemInputMove : ControlFormItemInput
    {
        private readonly List<ControlFormItemInputSelectionItem> _options = [];

        /// <summary>
        /// Returns the entries.
        /// </summary>
        public IEnumerable<ControlFormItemInputSelectionItem> Options => _options;

        /// <summary>
        /// Returns or sets the label of the selected options.
        /// </summary>
        public string SelectedHeader { get; set; } = "webexpress.webui:form.selectionmove.selected";

        /// <summary>
        /// Returns or sets the label.
        /// </summary>
        public string AvailableHeader { get; set; } = "webexpress.webui:form.selectionmove.available";

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The entries.</param>
        public ControlFormItemInputMove(string id = null, params ControlFormItemInputSelectionItem[] items)
            : base(string.IsNullOrEmpty(id) ? typeof(ControlFormItemInputSelection).GUID.ToString() : id)
        {
            _options.AddRange(items);
        }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        public void Add(params ControlFormItemInputSelectionItem[] items)
        {
            _options.AddRange(items);
        }

        /// <summary>
        /// Removes an item from the selection options.
        /// </summary>
        /// <param name="item">The item to remove from the selection options.</param>
        public void Remove(ControlFormItemInputSelectionItem item)
        {
            _options.Remove(item);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var classes = Classes.ToList();

            if (Disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = $"selection-move-{Id}",
                Style = GetStyles()
            };

            visualTree.AddScript(Id, GetScript($"selection-move-{Id}", string.Join(" ", classes)));

            return html;
        }

        /// <summary>
        /// Generates the javascript to control the control.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="css">The css classes that are assigned to the control.</param>
        /// <returns>The javascript code.</returns>
        protected virtual string GetScript(string id, string css)
        {
            //var settings = new
            //{
            //    Id = id,
            //    Name = Id,
            //    CSS = css,
            //    Header = new
            //    {
            //        Selected = I18N.Translate(SelectedHeader),
            //        Available = I18N.Translate(AvailableHeader)
            //    },
            //    Buttons = new
            //    {
            //        ToSelectedAll = I18N.Translate("˂˂"),
            //        ToSelected = I18N.Translate("˂"),
            //        ToAvailableAll = I18N.Translate("˃˃"),
            //        ToAvailable = I18N.Translate("˃")
            //    }
            //};

            //var jsonOptions = new JsonSerializerOptions { WriteIndented = false };
            //var settingsJson = JsonSerializer.Serialize(settings, jsonOptions);
            //var optionsJson = JsonSerializer.Serialize(Options, jsonOptions);
            //var valuesJson = JsonSerializer.Serialize(Value?.Split(";", System.StringSplitOptions.RemoveEmptyEntries), jsonOptions);
            //var builder = new StringBuilder();

            //builder.Append($"var options = {optionsJson};");
            //builder.Append($"var settings = {settingsJson};");
            //builder.Append($"var container = $('#{id}');");
            //builder.Append($"var obj = new webexpress.webui.moveCtrl(settings);");
            //builder.Append($"obj.options = options;");
            //builder.Append($"obj.value = {(!string.IsNullOrWhiteSpace(valuesJson) ? valuesJson : "[]")};");
            //builder.Append($"container.replaceWith(obj.getCtrl);");

            //return builder.ToString();

            return string.Empty;
        }
    }
}

