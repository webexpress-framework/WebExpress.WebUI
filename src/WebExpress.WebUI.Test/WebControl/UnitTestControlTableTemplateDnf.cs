using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the disjunctive normal form template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateDnf
    {
        /// <summary>
        /// Tests the id property of the dnf template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""dnf""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""dnf""></template>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateDnf(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the editable property of the dnf template control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<template data-type=""dnf""></template>")]
        [InlineData(true, @"<template data-type=""dnf"" data-editable=""true""></template>")]
        public void Editable(bool editable, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateDnf(null)
            {
                Editable = _ => editable
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the dnf template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""dnf""></template>")]
        [InlineData("abc", @"<template data-type=""dnf"" data-placeholder=""abc""></template>")]
        [InlineData("webexpress.webui:plugin.name", @"<template data-type=""dnf"" data-placeholder=""WebExpress.WebUI""></template>")]
        public void Placeholder(string placeholder, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateDnf(null)
            {
                Placeholder = _ => placeholder
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the max groups property of the dnf template control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<template data-type=""dnf""></template>")]
        [InlineData(3, @"<template data-type=""dnf"" data-max-groups=""3""></template>")]
        public void MaxGroups(int maxGroups, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateDnf(null)
            {
                MaxGroups = _ => maxGroups
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the compact property of the dnf template control. A cell clips by
        /// default, so only the opt-out is carried to the client.
        /// </summary>
        [Theory]
        [InlineData(true, @"<template data-type=""dnf""></template>")]
        [InlineData(false, @"<template data-type=""dnf"" data-compact=""false""></template>")]
        public void Compact(bool compact, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateDnf(null)
            {
                Compact = _ => compact
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the selectable terms travel inside the template, so the cell
        /// renderer resolves the labels without a further request.
        /// </summary>
        [Fact]
        public void Options()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateDnf(null);

            // act
            control.Add(new ControlFormItemInputSelectionItem("a") { Text = _ => "Amsterdam" });
            var html = control.Render(context, visualTree);

            // validation
            Assert.Single(control.Options);
            AssertExtensions.EqualWithPlaceholders
            (
                @"<template data-type=""dnf""><div id=""a"" class=""wx-selection-item"" data-label=""Amsterdam""></div></template>",
                html
            );
        }
    }
}
