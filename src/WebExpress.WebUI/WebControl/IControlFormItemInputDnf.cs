using System;
using System.Collections.Generic;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input for a disjunctive normal form expression.
    /// Provides methods to manage the selectable terms of the expression.
    /// </summary>
    public interface IControlFormItemInputDnf : IControlFormItemInput<ControlFormInputValueDnf>
    {
        /// <summary>
        /// Gets the terms that can be picked into a conjunction. The same set is
        /// offered in every conjunction, because a term is a property of the
        /// filtered subject rather than of the position it takes in the expression.
        /// </summary>
        IEnumerable<IControlFormItemInputSelectionItem> Options { get; }

        /// <summary>
        /// Gets the placeholder shown in a conjunction that holds no term yet.
        /// </summary>
        Func<IRenderControlContext, string> Placeholder { get; }

        /// <summary>
        /// Gets the maximum number of conjunctions, or a value of zero or less for
        /// an unlimited number.
        /// </summary>
        Func<IRenderControlContext, int> MaxGroups { get; }

        /// <summary>
        /// Adds one or more terms to the selectable options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputDnf Add(params IControlFormItemInputSelectionItem[] items);

        /// <summary>
        /// Adds one or more terms to the selectable options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputDnf Add(IEnumerable<IControlFormItemInputSelectionItem> items);

        /// <summary>
        /// Removes a term from the selectable options.
        /// </summary>
        /// <param name="item">The item to remove from the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputDnf Remove(IControlFormItemInputSelectionItem item);
    }
}
