using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    public interface IControlLinkList : IControl
    {
        /// <summary> 
        /// Adds one or more links to the content of the link list control.
        /// </summary> 
        /// <param name="links">The links to add to the content.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple links to the collection of 
        /// the link list control. It is useful for dynamically constructing the user interface by appending 
        /// various links to the link list content. 
        /// Example usage: 
        /// <code> 
        /// var list = new ControlLinkList(); 
        /// var link1 = new ControlLink { Text = "A" };
        /// var link2 = new ControlLink { Text = "B" };
        /// list.Add(text1, text2);
        /// </code> 
        /// This method accepts any control that implements the <see cref="IControlLink"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlLinkList Add(params IControlLink[] links);

        /// <summary> 
        /// Adds one or more links to the content of the link list control.
        /// </summary> 
        /// <param name="links">The links to add to the content.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple links to the collection of 
        /// the link list control. It is useful for dynamically constructing the user interface by appending 
        /// various links to the link list content. 
        /// Example usage: 
        /// <code> 
        /// var list = new ControlLinkList(); 
        /// var link1 = new ControlLink { Text = "A" };
        /// var link2 = new ControlLink { Text = "B" };
        /// list.Add(text1, text2);
        /// </code> 
        /// This method accepts any control that implements the <see cref="IControlLink"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlLinkList Add(IEnumerable<IControlLink> links);

        /// <summary>
        /// Removes a link from the content of the link list control.
        /// </summary>
        /// <param name="link">The link to remove from the content.</param>
        /// <remarks>
        /// This method allows removing a specific link from the collection of 
        /// the link list control.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlLinkList Remove(IControlLink link);
    }
}
