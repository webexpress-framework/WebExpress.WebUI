namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the different types of layout trees.
    /// </summary>
    public enum TypeLayoutTree
    {
        /// <summary>
        /// The default layout tree.
        /// </summary>
        Default,

        /// <summary>
        /// A flat layout tree with no nested structure.
        /// </summary>
        Flat,

        /// <summary>
        /// A grouped layout tree.
        /// </summary>
        Group,

        /// <summary>
        /// A flush layout tree with no borders between items.
        /// </summary>
        Flush,

        /// <summary>
        /// A horizontal layout tree with items displayed in a row.
        /// </summary>
        Horizontal
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeLayoutTree"/> enum.
    /// </summary>
    public static class TypeLayoutTreeExtensions
    {
        /// <summary>
        /// Converts the layout type to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The layout type to be converted.</param>
        /// <returns>The CSS class corresponding to the layout type.</returns>
        public static string ToClass(this TypeLayoutTree layout)
        {
            return layout switch
            {
                TypeLayoutTree.Group => "wx-tree-group",
                TypeLayoutTree.Flat => "wx-tree-flat",
                TypeLayoutTree.Flush => "wx-tree-flush",
                TypeLayoutTree.Horizontal => "wx-tree-horizontal",
                _ => "wx-tree"
            };
        }
    }
}
