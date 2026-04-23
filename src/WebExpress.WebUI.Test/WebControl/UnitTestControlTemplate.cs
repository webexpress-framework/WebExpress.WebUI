using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the template controls.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTemplate
    {
        /// <summary>
        /// Tests the id property of the template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-template""><template></template></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-template"" data-template=""id_template""><template id=""id_template""></template></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTemplate(id);

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests host attribute mapping.
        /// </summary>
        [Fact]
        public void HostAttributeMapping()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTemplate("template")
            {
                TemplateId = "person-template",
                Model = @"{""name"":""Aragorn""}",
                ForEach = "items",
                If = "visible",
                IfNot = "hidden",
                IfEmpty = "note",
                IfNotEmpty = "name",
                Bind = "name",
                Action = "frame",
                ActionParam = "{{id}}"
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"class=""wx-webui-template""", html);
            Assert.Contains(@"data-template=""person-template""", html);
            Assert.Contains(@"data-model=""{&quot;name&quot;:&quot;Aragorn&quot;}""", html);
            Assert.Contains(@"data-foreach=""items""", html);
            Assert.Contains(@"data-if=""visible""", html);
            Assert.Contains(@"data-if-not=""hidden""", html);
            Assert.Contains(@"data-if-empty=""note""", html);
            Assert.Contains(@"data-if-not-empty=""name""", html);
            Assert.Contains(@"data-bind=""name""", html);
            Assert.Contains(@"data-action=""frame""", html);
            Assert.Contains(@"data-action-param=""{{id}}""", html);
            Assert.Contains(@"<template id=""person-template"">", html);
        }

        /// <summary>
        /// Tests item rendering and item attribute mapping.
        /// </summary>
        [Fact]
        public void ItemRendering()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTemplate("template");
            var item = new ControlTemplateItem("item")
            {
                TagName = "span",
                Text = "{{name}}",
                ForEach = "items",
                If = "visible",
                IfNot = "hidden",
                IfEmpty = "description",
                IfNotEmpty = "name",
                Bind = "name",
                Action = "frame",
                ActionParam = "{{id}}",
                Template = "details-template",
                TemplateContext = "detail"
            };

            item
                .AddDynamicClass("active", "isActive")
                .AddDynamicStyle("color", "color")
                .AddDynamicAria("label", "name");
            control.Add(item);

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"<span id=""item""", html);
            Assert.Contains(@"data-foreach=""items""", html);
            Assert.Contains(@"data-if=""visible""", html);
            Assert.Contains(@"data-if-not=""hidden""", html);
            Assert.Contains(@"data-if-empty=""description""", html);
            Assert.Contains(@"data-if-not-empty=""name""", html);
            Assert.Contains(@"data-bind=""name""", html);
            Assert.Contains(@"data-action=""frame""", html);
            Assert.Contains(@"data-action-param=""{{id}}""", html);
            Assert.Contains(@"data-template=""details-template""", html);
            Assert.Contains(@"data-template-context=""detail""", html);
            Assert.Contains(@"data-class-active=""isActive""", html);
            Assert.Contains(@"data-style-color=""color""", html);
            Assert.Contains(@"data-aria-label=""name""", html);
            Assert.Contains(@"{{name}}</span>", html);
        }
    }
}
