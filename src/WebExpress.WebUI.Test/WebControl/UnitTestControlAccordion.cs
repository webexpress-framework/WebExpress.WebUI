using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the accordion control and its sections.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlAccordion
    {
        /// <summary>
        /// Tests the id property of the accordion control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div id=""*"" class=""accordion""></div>")]
        [InlineData("id", @"<div id=""id"" class=""accordion""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAccordion(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the flush property of the accordion control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div id=""*"" class=""accordion""></div>")]
        [InlineData(true, @"<div id=""*"" class=""accordion accordion-flush""></div>")]
        public void Flush(bool flush, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAccordion()
            {
                Flush = _ => flush
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the sections of the accordion are rendered inside it.
        /// </summary>
        [Fact]
        public void Items()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAccordion
            (
                "acc",
                new ControlAccordionItem("it1") { Header = _ => "A" }
            );

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div id=""acc"" class=""accordion""><div class=""accordion-item"">*</div></div>", html);
        }

        /// <summary>
        /// Tests a collapsed accordion section.
        /// </summary>
        [Fact]
        public void ItemCollapsed()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAccordionItem("it1")
            {
                Header = _ => "Header"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""accordion-item""><div class=""accordion-header""><button type=""button"" class=""accordion-button collapsed"" data-bs-toggle=""collapse"" data-bs-target=""#it1"" aria-expanded=""false"" aria-controls=""it1"">Header</button></div><div id=""it1"" class=""accordion-collapse collapse""><div class=""accordion-body""></div></div></div>", html);
        }

        /// <summary>
        /// Tests an expanded accordion section.
        /// </summary>
        [Fact]
        public void ItemExpanded()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAccordionItem("it1")
            {
                Header = _ => "Header",
                Expanded = _ => true
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""accordion-item""><div class=""accordion-header""><button type=""button"" class=""accordion-button"" data-bs-toggle=""collapse"" data-bs-target=""#it1"" aria-expanded=""true"" aria-controls=""it1"">Header</button></div><div id=""it1"" class=""accordion-collapse collapse show""><div class=""accordion-body""></div></div></div>", html);
        }
    }
}
