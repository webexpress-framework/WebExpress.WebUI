using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a date picker input form item control.
    /// </summary>
    public class ControlFormItemInputDatepicker : ControlFormItemInput
    {
        /// <summary>
        /// Determines whether the control is automatically initialized.
        /// </summary>
        public bool AutoInitialize { get; set; }

        /// <summary>
        /// Returns or sets the description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Returns or sets the minimum length.
        /// </summary>
        public string MinLength { get; set; }

        /// <summary>
        /// Returns or sets the maximum length.
        /// </summary>
        public string MaxLength { get; set; }

        /// <summary>
        /// Returns or sets whether inputs are enforced.
        /// </summary>
        public bool Required { get; set; }

        /// <summary>
        /// Returns or sets a search pattern that checks the content.
        /// </summary>
        public string Pattern { get; set; }

        ///// <summary>
        ///// Returns the initialization code (JQuerry).
        ///// </summary>
        //public string InitializeCode => "$('#" + Id + " input').datepicker({ startDate: -3 });";

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputDatepicker(string id = null)
            : base(!string.IsNullOrWhiteSpace(id) ? id : "datepicker")
        {
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
            AutoInitialize = true;

            var contextPath = renderContext.PageContext?.ApplicationContext?.Route;

            //if (state == ControlFormState.New)
            //{
            //    return;
            //}

            //Value = renderContext?.Request.GetParameter(Name)?.Value;

            //renderContext.AddHeaderScriptLinks(UriResource.Combine(contextPath, "/assets/js/bootstrap-datepicker.min.js"));
            //renderContext.AddHeaderScriptLinks(UriResource.Combine(contextPath, "/assets/js/locales_datepicker/bootstrap-datepicker." + context.Culture.TwoLetterISOLanguageName.ToLower() + ".min.js"));
            //renderContext.AddCssLinks(UriResource.Combine(contextPath, "/assets/css/bootstrap-datepicker3.min.css"));

            //renderContext.AddScript(Id, @"$('#" + Id + @"').datepicker({format: ""dd.mm.yyyy"", todayBtn: true, language: ""de"", zIndexOffset: 999});");
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext.GetValue(this);
            //if (Disabled)
            //{
            //    Classes.Add("disabled");
            //}

            //if (AutoInitialize)
            //{
            //    context.Page.AddScript(Id, InitializeCode);
            //    AutoInitialize = false;
            //}

            var input = new HtmlElementFieldInput()
            {
                Id = Id,
                Name = Name,
                Type = "text",
                Class = "form-control",
                Value = value
            };

            //var span = new HtmlElementTextSemanticsSpan()
            //{
            //    Class = TypeIcon.Calendar.ToClass()
            //};

            //var div = new HtmlElementTextContentDiv(span)
            //{
            //    Class = "input-group-text"
            //};

            //var html = new HtmlElementTextContentDiv(input, div)
            //{
            //    Id = Id,
            //    Class = "input-group",
            //    //DataProvide = "datepicker"
            //};

            return input;
        }
    }
}
