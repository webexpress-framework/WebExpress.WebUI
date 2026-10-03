using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the dual-handle slider form input control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputSlider
    {
        /// <summary>
        /// Tests the id property of the slider control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-slider"" name=""id"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(id);

            // act
            var html = control.Render(context, visualTree);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the slider control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-input-slider"" name=""*"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider();

            // act
            var html = control.Render(context, visualTree);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the slider control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-slider"" name=""abc"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                Name = _ => name
            };

            // act
            var html = control.Render(context, visualTree);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests default min/max/step (defaults are 0/100/1).
        /// </summary>
        [Fact]
        public void DefaultBounds()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null);

            // act / assert via inspecting the result
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>", html);
        }

        /// <summary>
        /// Tests the min property of the slider control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        [InlineData(-50, @"<div class=""wx-webui-input-slider"" data-min=""-50"" data-max=""100"" data-step=""1"" data-value-min=""-50"" data-value-max=""100""></div>")]
        [InlineData(2.5f, @"<div class=""wx-webui-input-slider"" data-min=""2.5"" data-max=""100"" data-step=""1"" data-value-min=""2.5"" data-value-max=""100""></div>")]
        public void Min(float min, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                Min = _ => min
            };

            // act
            var html = control.Render(context, visualTree);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the max property of the slider control.
        /// </summary>
        [Theory]
        [InlineData(10, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""10"" data-step=""1"" data-value-min=""0"" data-value-max=""10""></div>")]
        [InlineData(1000, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""1000"" data-step=""1"" data-value-min=""0"" data-value-max=""1000""></div>")]
        [InlineData(0.5f, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""0.5"" data-step=""1"" data-value-min=""0"" data-value-max=""0.5""></div>")]
        public void Max(float max, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                Max = _ => max
            };

            // act
            var html = control.Render(context, visualTree);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the step property of the slider control.
        /// </summary>
        [Theory]
        [InlineData(1, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        [InlineData(0.25f, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""0.25"" data-value-min=""0"" data-value-max=""100""></div>")]
        [InlineData(5, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""5"" data-value-min=""0"" data-value-max=""100""></div>")]
        public void Step(float step, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                Step = _ => step
            };

            // act
            var html = control.Render(context, visualTree);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the unit attribute is emitted only when explicitly set.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        [InlineData("temperature", @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100"" data-unit=""temperature""></div>")]
        [InlineData("time", @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100"" data-unit=""time""></div>")]
        [InlineData("kg", @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100"" data-unit=""kg""></div>")]
        public void Unit(string unit, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                Unit = _ => unit
            };

            // act
            var html = control.Render(context, visualTree);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the slider control: a system color
        /// produces a marker CSS class, a user color produces an inline style.
        /// </summary>
        [Fact]
        public void ColorSystem()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                Color = _ => new PropertyColorSlider(TypeColorSlider.Success)
            };

            // act
            var html = control.Render(context, visualTree);

            // assert: the slider gets the wx-slider-color-success marker class
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-input-slider wx-slider-color-success""*></div>", html);
        }

        /// <summary>
        /// Tests the color property for a user-defined color: emits inline
        /// CSS variable overrides that drive the band and handle border.
        /// </summary>
        [Fact]
        public void ColorUser()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                Color = _ => new PropertyColorSlider("#ff0000")
            };

            // act
            var html = control.Render(context, visualTree);

            // assert: inline style sets the CSS variables for band + handle
            AssertExtensions.EqualWithPlaceholders(@"*style=""--wx-slider-band-bg:#ff0000;--wx-slider-handle-bd:#ff0000;""*", html);
        }

        /// <summary>
        /// Tests the show labels property: only emit attribute when disabled.
        /// </summary>
        [Theory]
        [InlineData(true, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        [InlineData(false, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100"" data-show-labels=""false""></div>")]
        public void ShowLabels(bool showLabels, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                ShowLabels = _ => showLabels
            };

            // act
            var html = control.Render(context, visualTree);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the disabled property of the slider control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        [InlineData(true, @"<div class=""wx-webui-input-slider disabled"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100"" disabled=""disabled""></div>")]
        public void Disabled(bool disabled, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                Disabled = _ => disabled
            };

            // act
            var html = control.Render(context, visualTree);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that initial values are clamped to the configured track.
        /// </summary>
        [Fact]
        public void ValueClampedToTrack()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                Min = _ => 0,
                Max = _ => 50
            };

            // out of bounds initial value should clamp into [0,50]
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueDualRange(-25f, 999f));
            });

            // act
            var html = form.Render(context, visualTree);

            // assert: html contains clamped min=0 and max=50
            AssertExtensions.EqualWithPlaceholders(@"*data-value-min=""0"" data-value-max=""50""*", html);
        }

        /// <summary>
        /// Tests that an inverted range (min > max) is automatically swapped
        /// during rendering so handles do not cross.
        /// </summary>
        [Fact]
        public void ValueInvertedRangeIsSwapped()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                Min = _ => 0,
                Max = _ => 100
            };

            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueDualRange(80f, 20f));
            });

            // act
            var html = form.Render(context, visualTree);

            // assert: swapped to value-min=20, value-max=80
            AssertExtensions.EqualWithPlaceholders(@"*data-value-min=""20"" data-value-max=""80""*", html);
        }

        /// <summary>
        /// Tests the embedded form rendering of the slider control with an
        /// initial range value.
        /// </summary>
        [Fact]
        public void ValueForm()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueDualRange(10f, 40f));
            });

            // act
            var html = form.Render(context, visualTree);

            // assert: range values are emitted on the host element
            AssertExtensions.EqualWithPlaceholders(@"*data-value-min=""10"" data-value-max=""40""*", html);
        }

        /// <summary>
        /// Tests the description property of the slider control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        [InlineData("description", @"<div class=""wx-webui-input-slider"" data-min=""0"" data-max=""100"" data-step=""1"" data-value-min=""0"" data-value-max=""100""></div>")]
        public void Description(string description, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSlider(null)
            {
                Description = _ => description
            };

            // act
            var html = control.Render(context, visualTree);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that CreateValue correctly parses the "min;max" wire format
        /// posted back by the JavaScript component.
        /// </summary>
        [Theory]
        [InlineData(null, 0f, 0f)]
        [InlineData("", 0f, 0f)]
        [InlineData("12;48", 12f, 48f)]
        [InlineData("  -3.5 ; 7.25  ", -3.5f, 7.25f)]
        [InlineData("42", 42f, 42f)]
        public void ParseRangePayload(string payload, float expectedMin, float expectedMax)
        {
            // arrange / act
            var value = new ControlFormInputValueDualRange(payload);

            // assert
            Assert.Equal(expectedMin, value.MinValue);
            Assert.Equal(expectedMax, value.MaxValue);
        }

        /// <summary>
        /// Tests that ToString serializes back to the "min;max" wire format
        /// using the invariant culture.
        /// </summary>
        [Theory]
        [InlineData(0f, 0f, "0;0")]
        [InlineData(12.5f, 48.25f, "12.5;48.25")]
        [InlineData(-3.5f, 7f, "-3.5;7")]
        public void SerializeRangePayload(float min, float max, string expected)
        {
            // arrange
            var value = new ControlFormInputValueDualRange(min, max);

            // act
            var actual = value.ToString();

            // assert
            Assert.Equal(expected, actual);
        }
    }
}
