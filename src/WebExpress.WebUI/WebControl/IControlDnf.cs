using System;
using System.Collections.Generic;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a read only control for a disjunctive normal form expression.
    /// </summary>
    public interface IControlDnf : IControl
    {
        /// <summary>
        /// Gets the expression to display.
        /// </summary>
        Func<IRenderControlContext, ControlFormInputValueDnf> Value { get; }

        /// <summary>
        /// Gets the terms the labels of the expression are resolved against.
        /// </summary>
        IEnumerable<IControlFormItemInputSelectionItem> Options { get; }

        /// <summary>
        /// Gets a value indicating whether the expression is clipped to a single line.
        /// </summary>
        Func<IRenderControlContext, bool> Compact { get; }

        /// <summary>
        /// Adds one or more terms to the options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlDnf Add(params IControlFormItemInputSelectionItem[] items);

        /// <summary>
        /// Adds one or more terms to the options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlDnf Add(IEnumerable<IControlFormItemInputSelectionItem> items);

        /// <summary>
        /// Removes a term from the options.
        /// </summary>
        /// <param name="item">The item to remove from the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlDnf Remove(IControlFormItemInputSelectionItem item);
    }
}
