using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a collection of binding definitions that can be applied to HTML nodes.
    /// </summary>
    public class Binding : IBinding
    {
        private readonly List<IBind> _binds = [];

        /// <summary>
        /// Returns the collection of binds associated with this instance.
        /// </summary>
        public IEnumerable<IBind> Binds => _binds;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public Binding()
        {
        }

        /// <summary>
        /// Adds one or more binding objects to the current binding collection.
        /// </summary>
        /// <param name="binds">
        /// An array of binding objects to add to the collection. Each element 
        /// represents a binding to include.
        /// </param>
        /// <returns>
        /// The current binding instance with the added bindings.
        /// </returns>
        public IBinding Add(params IBind[] binds)
        {
            _binds.AddRange(binds);

            return this;
        }

        /// <summary>
        /// Adds one or more binding objects to the current binding collection.
        /// </summary>
        /// <param name="binds">
        /// An array of binding objects to add to the collection. Each element 
        /// represents a binding to include.
        /// </param>
        /// <returns>
        /// The current binding instance with the added bindings.
        /// </returns>
        public IBinding Add(IEnumerable<IBind> binds)
        {
            _binds.AddRange(binds);

            return this;
        }

        /// <summary>
        /// Removes the specified binding from the collection.
        /// </summary>
        /// <param name="bind">
        /// The binding to remove from the collection. 
        /// </param>
        /// <returns>
        /// The current instance of the Binding class, enabling method chaining.
        /// </returns>
        public IBinding Remove(IBind bind)
        {
            _binds.Remove(bind);

            return this;
        }

        /// <summary>
        /// Applies user-defined attributes to the specified HTML node.
        /// </summary>
        /// <param name="htmlNode">
        /// The HTML node to which user attributes will be applied. Cannot be null.
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        public IBinding ApplyUserAttributes(IHtmlNode htmlNode)
        {
            if (_binds.Count == 0)
            {
                return this;
            }

            foreach (var bind in _binds)
            {
                bind.ApplyUserAttributes(htmlNode);
            }

            htmlNode?.RemoveUserAttribute("data-wx-bind");
            htmlNode?.AddUserAttribute("data-wx-bind", string.Join(",", _binds.Select(x => x.Name)));

            return this;
        }
    }
}
