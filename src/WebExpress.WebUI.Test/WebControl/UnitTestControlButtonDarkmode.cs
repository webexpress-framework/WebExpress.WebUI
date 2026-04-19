using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the dark-mode button control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlButtonDarkmode
    {
        /// <summary>
        /// Tests the id property of the dark-mode button control and verifies
        /// that the auto-init marker class, the default light/dark icon data
        /// attributes and the icon container are all rendered.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""button"" class=""wx-webui-darkmode"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-sun""><i class=""wx-webui-darkmode-icon""></i></button>")]
        [InlineData("id", @"<button id=""id"" type=""button"" class=""wx-webui-darkmode"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-sun""><i class=""wx-webui-darkmode-icon""></i></button>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonDarkmode(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon-light property of the dark-mode button control.
        /// </summary>
        [Theory]
        [InlineData(typeof(IconMoon), @"<button type=""button"" class=""wx-webui-darkmode"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-sun""><i class=""wx-webui-darkmode-icon""></i></button>")]
        [InlineData(typeof(IconStar), @"<button type=""button"" class=""wx-webui-darkmode"" data-icon-light=""fas fa-star"" data-icon-dark=""fas fa-sun""><i class=""wx-webui-darkmode-icon""></i></button>")]
        public void IconLight(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonDarkmode()
            {
                IconLight = Activator.CreateInstance(icon) as IIcon
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon-dark property of the dark-mode button control.
        /// </summary>
        [Theory]
        [InlineData(typeof(IconSun), @"<button type=""button"" class=""wx-webui-darkmode"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-sun""><i class=""wx-webui-darkmode-icon""></i></button>")]
        [InlineData(typeof(IconStar), @"<button type=""button"" class=""wx-webui-darkmode"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-star""><i class=""wx-webui-darkmode-icon""></i></button>")]
        public void IconDark(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonDarkmode()
            {
                IconDark = Activator.CreateInstance(icon) as IIcon
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title property of the dark-mode button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""button"" class=""wx-webui-darkmode"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-sun""><i class=""wx-webui-darkmode-icon""></i></button>")]
        [InlineData("", @"<button type=""button"" class=""wx-webui-darkmode"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-sun""><i class=""wx-webui-darkmode-icon""></i></button>")]
        [InlineData("Toggle theme", @"<button type=""button"" class=""wx-webui-darkmode"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-sun"" data-title=""Toggle theme""><i class=""wx-webui-darkmode-icon""></i></button>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<button type=""button"" class=""wx-webui-darkmode"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-sun"" data-title=""WebExpress.WebUI""><i class=""wx-webui-darkmode-icon""></i></button>")]
        public void Title(string title, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonDarkmode()
            {
                Title = title
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the dark-mode button control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeButton.Default, @"<button type=""button"" class=""wx-webui-darkmode"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-sun""><i class=""wx-webui-darkmode-icon""></i></button>")]
        [InlineData(TypeSizeButton.Small, @"<button type=""button"" class=""wx-webui-darkmode btn-sm"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-sun""><i class=""wx-webui-darkmode-icon""></i></button>")]
        [InlineData(TypeSizeButton.Large, @"<button type=""button"" class=""wx-webui-darkmode btn-lg"" data-icon-light=""fas fa-moon"" data-icon-dark=""fas fa-sun""><i class=""wx-webui-darkmode-icon""></i></button>")]
        public void Size(TypeSizeButton size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonDarkmode()
            {
                Size = size
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
