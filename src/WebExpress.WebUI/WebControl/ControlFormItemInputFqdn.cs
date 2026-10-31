using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A form input for a fully qualified domain name, such as server01.example.com. The name is
    /// checked and stored by <see cref="HostName"/>: an internationalized name is accepted, and
    /// the page receives it in lower case without a trailing root dot.
    /// </summary>
    public class ControlFormItemInputFqdn : ControlFormItemInputFormatted
    {
        /// <summary>
        /// Gets or sets a value indicating whether a wildcard name such as *.example.com is
        /// accepted, as a certificate may name it.
        /// </summary>
        public Func<IRenderControlContext, bool> Wildcard { get; set; }

        /// <summary>
        /// Gets or sets the domains a name must lie within, the domain itself included. Left
        /// unset, any domain is accepted.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<string>> Domains { get; set; }

        /// <summary>
        /// Gets the type of the native input. A url input would ask for a scheme, so the name is text.
        /// </summary>
        protected override string InputType => "text";

        /// <summary>
        /// Gets the message for a text that is no fully qualified domain name.
        /// </summary>
        protected override string InvalidMessage => "webexpress.webui:form.inputfqdn.validation.invalid";

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputFqdn()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputFqdn(string id)
            : base(id)
        {
        }

        /// <summary>
        /// Brings a text into the stored form of a name.
        /// </summary>
        /// <param name="value">The text as posted.</param>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The normalized name, or null if the text is no fully qualified domain name.</returns>
        protected override string Normalize(string value, IRenderControlContext renderContext)
        {
            return HostName.Normalize(value, Wildcard?.Invoke(renderContext) ?? false);
        }

        /// <summary>
        /// Accepts a name only within the permitted domains.
        /// </summary>
        /// <param name="value">The normalized name.</param>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The message key, or null if the name is accepted.</returns>
        protected override string Check(string value, IRenderControlContext renderContext)
        {
            var domains = Domains?.Invoke(renderContext)?.Where(x => !string.IsNullOrWhiteSpace(x)).ToList();

            return domains is { Count: > 0 } && !domains.Any(x => HostName.IsInDomain(value, x))
                ? "webexpress.webui:form.inputfqdn.validation.domain"
                : null;
        }

        /// <summary>
        /// Shows an example of a fully qualified domain name.
        /// </summary>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The example.</returns>
        protected override string DefaultPlaceholder(IRenderControlContext renderContext)
        {
            return "server.example.com";
        }
    }
}
