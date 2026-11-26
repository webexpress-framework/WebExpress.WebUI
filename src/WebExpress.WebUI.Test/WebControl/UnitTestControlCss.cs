using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests how the base control joins its css classes and styles. Every control renders them,
    /// so the join must neither change the html nor allocate for a control that sets nothing.
    /// </summary>
    public class UnitTestControlCss
    {
        /// <summary>
        /// Tests that a control with only the default properties renders no class and no style,
        /// although the defaults stay readable through their properties.
        /// </summary>
        [Fact]
        public void DefaultControlRendersNothing()
        {
            // arrange
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var control = new CssControl();

            // act
            var classes = control.CssClasses(context);
            var styles = control.CssStyles(context);

            // validation
            Assert.Equal(string.Empty, classes);
            Assert.Equal(string.Empty, styles);
            Assert.Equal(TypeColorBackground.Default, control.BackgroundColor(context).SystemColor);
            Assert.Equal(PropertySpacing.Space.None, control.Padding(context).Top);
            Assert.Equal(PropertySpacing.Space.None, control.Margin(context).Top);
            Assert.Equal(TypeHorizontalAlignment.Default, control.HorizontalAlignment(context));
        }

        /// <summary>
        /// Tests that the declared classes come first and the classes of the properties follow
        /// in the order the properties were first set, each class once.
        /// </summary>
        [Fact]
        public void ClassesKeepTheirOrderAndAppearOnce()
        {
            // arrange
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var control = new CssControl
            {
                Classes = ["a", "b", "a", "p-1"],
                TextColor = _ => new PropertyColorText(TypeColorText.Primary),
                Margin = _ => new PropertySpacingMargin(PropertySpacing.Space.Two),
                Padding = _ => new PropertySpacingPadding(PropertySpacing.Space.One)
            };

            // act
            var classes = control.CssClasses(context);

            // validation
            Assert.Equal("a b p-1 m-2 text-primary", classes);
        }

        /// <summary>
        /// Tests that a null or empty declared class is kept once, as an empty entry.
        /// </summary>
        [Fact]
        public void NullAndEmptyDeclaredClassesAreKeptOnce()
        {
            // arrange
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var control = new CssControl { Classes = ["a", null, "", null, ""] };

            // act
            var classes = control.CssClasses(context);

            // validation
            Assert.Equal("a  ", classes);
        }

        /// <summary>
        /// Tests that the declared styles come first and the styles of the properties follow,
        /// each style once.
        /// </summary>
        [Fact]
        public void StylesKeepTheirOrderAndAppearOnce()
        {
            // arrange
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var control = new CssControl
            {
                Styles = ["width:1px;", "width:1px;"],
                TextColor = _ => new PropertyColorText("#ff0000"),
                BackgroundColor = _ => new PropertyColorBackground("#ffffff")
            };

            // act
            var styles = control.CssStyles(context);

            // validation
            Assert.Equal
            (
                string.Join(" ", "width:1px;", new PropertyColorBackground("#ffffff").ToStyle(), new PropertyColorText("#ff0000").ToStyle()),
                styles
            );
        }

        /// <summary>
        /// Tests that the properties are evaluated on every render, so a value that changes
        /// between two renders shows in both.
        /// </summary>
        [Fact]
        public void PropertiesAreEvaluatedOnEveryRender()
        {
            // arrange
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var primary = true;
            var control = new CssControl
            {
                TextColor = _ => new PropertyColorText(primary ? TypeColorText.Primary : TypeColorText.Secondary)
            };

            // act
            var first = control.CssClasses(context);
            primary = false;
            var second = control.CssClasses(context);

            // validation
            Assert.Equal("text-primary", first);
            Assert.Equal("text-secondary", second);
        }

        /// <summary>
        /// Tests that joining the classes and styles of a control that sets nothing allocates
        /// nothing. Every control of a page does it on every render.
        /// </summary>
        [Fact]
        public void DefaultControlJoinsWithoutAllocating()
        {
            // arrange
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var control = new CssControl();
            control.CssClasses(context);
            control.CssStyles(context);

            // act
            var before = GC.GetAllocatedBytesForCurrentThread();
            for (var i = 0; i < 100; i++)
            {
                control.CssClasses(context);
                control.CssStyles(context);
            }
            var allocated = GC.GetAllocatedBytesForCurrentThread() - before;

            // validation
            Assert.Equal(0, allocated);
        }

        /// <summary>
        /// A control that exposes the joined classes and styles of the base control.
        /// </summary>
        private sealed class CssControl : Control
        {
            /// <summary>
            /// Returns the joined css classes.
            /// </summary>
            /// <param name="renderContext">The render context.</param>
            /// <returns>The css classes.</returns>
            public string CssClasses(IRenderControlContext renderContext) => GetClasses(renderContext);

            /// <summary>
            /// Returns the joined css styles.
            /// </summary>
            /// <param name="renderContext">The render context.</param>
            /// <returns>The css styles.</returns>
            public string CssStyles(IRenderControlContext renderContext) => GetStyles(renderContext);

            /// <summary>
            /// Renders nothing; only the joins are tested.
            /// </summary>
            /// <param name="renderContext">The render context.</param>
            /// <param name="visualTree">The visual tree.</param>
            /// <returns>Null.</returns>
            public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree) => null;
        }
    }
}
