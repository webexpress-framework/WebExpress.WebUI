using System.Text.RegularExpressions;
using WebExpress.WebUI.WebIcon;

namespace WebExpress.WebUI.Test.WebIcon
{
    /// <summary>
    /// Holds the three halves of an icon against each other: the class that names it, the
    /// drawing that shows it and the mask rule that applies the drawing.
    /// </summary>
    /// <remarks>
    /// A class whose drawing is missing, or a drawing without a rule, does not fail at
    /// runtime - the element renders and stays blank. That is exactly how 191 icon classes
    /// went years silently falling through to a FontAwesome glyph, so the invariant is
    /// checked here rather than left to be noticed on a page.
    /// <para>
    /// The assets are read from the assembly's embedded resources, which is what actually
    /// ships, rather than from the source tree.
    /// </para>
    /// </remarks>
    public class UnitTestIconInventory
    {
        private const string IconPrefix = @"WebExpress.WebUI.Assets.icons\";
        private const string StylesheetResource = @"WebExpress.WebUI.Assets.css\webexpress.webui.icon.css";

        /// <summary>
        /// Returns the symbolic names of every drawing embedded in the assembly.
        /// </summary>
        /// <returns>The set of drawing names.</returns>
        private static HashSet<string> GetDrawings()
        {
            var assembly = typeof(Icon).Assembly;

            return [.. assembly.GetManifestResourceNames()
                .Where(x => x.StartsWith(IconPrefix) && x.EndsWith(".svg"))
                .Select(x => x[IconPrefix.Length..^".svg".Length])];
        }

        /// <summary>
        /// Returns the icon names the shipped stylesheet defines a mask rule for.
        /// </summary>
        /// <returns>The set of names carrying a rule.</returns>
        private static HashSet<string> GetRules()
        {
            var assembly = typeof(Icon).Assembly;
            using var stream = assembly.GetManifestResourceStream(StylesheetResource);
            Assert.NotNull(stream);

            using var reader = new StreamReader(stream);
            var css = reader.ReadToEnd();

            return [.. Regex.Matches(css, @"\.wx-icon-light-([a-z0-9-]+)\s*\{")
                .Select(x => x.Groups[1].Value)];
        }

        /// <summary>
        /// Returns every concrete icon class together with the symbol it names.
        /// </summary>
        /// <returns>The icon types paired with their symbolic name.</returns>
        private static IEnumerable<(Type Type, string Symbol)> GetIcons()
        {
            return typeof(Icon).Assembly.GetTypes()
                .Where(x => typeof(Icon).IsAssignableFrom(x) && !x.IsAbstract && !x.IsInterface)
                .Select(x => (Type: x, Symbol: (Activator.CreateInstance(x) as Icon)?.Symbol))
                .Where(x => x.Symbol is not null)!;
        }

        /// <summary>
        /// Every icon class names a drawing that exists.
        /// </summary>
        [Fact]
        public void EveryIconClassHasADrawing()
        {
            var drawings = GetDrawings();
            Assert.True(drawings.Count > 1000, "the drawings were found in the assembly");

            var orphans = GetIcons()
                .Where(x => !drawings.Contains(x.Symbol))
                .Select(x => $"{x.Type.Name} -> {x.Symbol}.svg")
                .ToList();

            Assert.True(orphans.Count == 0, $"icon classes without a drawing: {string.Join(", ", orphans)}");
        }

        /// <summary>
        /// Every icon class names a symbol the stylesheet actually draws.
        /// </summary>
        [Fact]
        public void EveryIconClassHasAMaskRule()
        {
            var rules = GetRules();
            Assert.True(rules.Count > 1000, "the stylesheet was read and holds the icon set");

            var orphans = GetIcons()
                .Where(x => !rules.Contains(x.Symbol))
                .Select(x => $"{x.Type.Name} -> .wx-icon-light-{x.Symbol}")
                .ToList();

            Assert.True(orphans.Count == 0, $"icon classes without a mask rule: {string.Join(", ", orphans)}");
        }

        /// <summary>
        /// Drawings and mask rules match one to one, so neither a rule pointing at nothing
        /// nor a drawing nothing applies survives unnoticed.
        /// </summary>
        [Fact]
        public void DrawingsAndMaskRulesMatch()
        {
            var drawings = GetDrawings();
            var rules = GetRules();

            var withoutRule = drawings.Except(rules).Order().ToList();
            var withoutDrawing = rules.Except(drawings).Order().ToList();

            Assert.True(withoutRule.Count == 0, $"drawings without a mask rule: {string.Join(", ", withoutRule)}");
            Assert.True(withoutDrawing.Count == 0, $"mask rules without a drawing: {string.Join(", ", withoutDrawing)}");
        }

        /// <summary>
        /// No icon class carries a FontAwesome class any more.
        /// </summary>
        [Fact]
        public void NoIconRendersAFontAwesomeClass()
        {
            var offenders = GetIcons()
                .Select(x => (x.Type, Class: (Activator.CreateInstance(x.Type) as Icon)?.Class ?? string.Empty))
                .Where(x => x.Class.Contains("fa-") || x.Class.Contains("fas ") || x.Class.Contains("far "))
                .Select(x => $"{x.Type.Name} -> {x.Class}")
                .ToList();

            Assert.True(offenders.Count == 0, $"icons still rendering a FontAwesome class: {string.Join(", ", offenders)}");
        }

        /// <summary>
        /// No drawing is a filled silhouette.
        /// </summary>
        /// <remarks>
        /// The stylesheet applies each drawing as a mask over currentColor, so everything
        /// opaque becomes one solid shape. A drawing with fills and no strokes therefore
        /// paints as a black block among the line icons - it renders, it is not an error,
        /// and it looks like a different icon set. 169 drawings were in that state before
        /// they were redrawn as strokes.
        /// </remarks>
        /// <summary>
        /// Drawings kept as silhouettes on purpose, because the stroke redraw offered for
        /// them was judged worse than the original. Empty is the goal: an entry here means a
        /// drawing is knowingly out of step with the rest of the set.
        /// </summary>
        private static readonly HashSet<string> SilhouettesKeptOnPurpose = [];

        [Fact]
        public void NoDrawingRendersAsASilhouette()
        {
            var assembly = typeof(Icon).Assembly;

            var silhouettes = assembly.GetManifestResourceNames()
                .Where(x => x.StartsWith(IconPrefix) && x.EndsWith(".svg"))
                .Select(x => new { Name = x[IconPrefix.Length..^".svg".Length], Body = ReadResource(assembly, x) })
                .Where(x => !HasStroke(x.Body) && HasFill(x.Body))
                .Select(x => x.Name)
                .Where(x => !SilhouettesKeptOnPurpose.Contains(x))
                .Order()
                .ToList();

            Assert.True(silhouettes.Count == 0, $"drawings that paint as a solid silhouette: {string.Join(", ", silhouettes)}");
        }

        /// <summary>
        /// Reads an embedded resource as text.
        /// </summary>
        /// <param name="assembly">The assembly holding the resource.</param>
        /// <param name="name">The full resource name.</param>
        /// <returns>The resource content.</returns>
        private static string ReadResource(System.Reflection.Assembly assembly, string name)
        {
            using var stream = assembly.GetManifestResourceStream(name);
            using var reader = new StreamReader(stream!);
            return reader.ReadToEnd();
        }

        /// <summary>
        /// Returns whether the markup paints any stroke.
        /// </summary>
        /// <param name="svg">The drawing markup.</param>
        /// <returns>True when a stroke other than none is set.</returns>
        private static bool HasStroke(string svg)
        {
            return Regex.IsMatch(svg, @"stroke\s*[:=]\s*""?\s*(?!none)[^"";\s>]+");
        }

        /// <summary>
        /// Returns whether the markup paints any fill.
        /// </summary>
        /// <param name="svg">The drawing markup.</param>
        /// <returns>True when a fill other than none is set.</returns>
        private static bool HasFill(string svg)
        {
            return Regex.Matches(svg, @"fill\s*[:=]\s*""?\s*([^"";\s>]+)")
                .Any(x => x.Groups[1].Value != "none");
        }

        /// <summary>
        /// No script picks a drawing by its bare name.
        /// </summary>
        /// <remarks>
        /// A drawing is selected by the class pair the icon set produces, never by the name
        /// alone: <c>element.className = "copy"</c> yields an element no rule matches, so it
        /// renders as empty space instead of failing. Eleven call sites shipped that way, and
        /// nothing noticed because an invisible icon looks like a layout choice.
        /// </remarks>
        [Fact]
        public void NoScriptPicksADrawingByBareName()
        {
            var assembly = typeof(Icon).Assembly;
            var drawings = GetDrawings();
            var pattern = new Regex(@"classNames*=s*""([a-z][a-z0-9-]{2,})""");

            var offenders = assembly.GetManifestResourceNames()
                .Where(x => x.EndsWith(".js"))
                .SelectMany(x => pattern.Matches(ReadResource(assembly, x))
                    .Where(m => drawings.Contains(m.Groups[1].Value))
                    .Select(m => $"{x.Split(char.Parse(@"\")).Last()}: {m.Value}"))
                .Order()
                .ToList();

            Assert.True(offenders.Count == 0, $"scripts picking a drawing by bare name: {string.Join(", ", offenders)}");
        }
    }
}
