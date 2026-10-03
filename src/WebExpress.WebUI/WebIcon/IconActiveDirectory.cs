namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a directory service, under the name the most widespread one
    /// is known by.
    /// </summary>
    /// <remarks>
    /// It resolves to the same drawing as <see cref="IconDirectoryService"/>. The set names
    /// what a drawing shows rather than a product, so the vendor's name is a second class on
    /// the one drawing instead of a copy of it under a second file name.
    /// </remarks>
    public class IconActiveDirectory : Icon
    {
        /// <summary>
        /// Returns the symbolic name the active icon set resolves to a css class.
        /// </summary>
        public override string Symbol => "directory-service";
    }
}
