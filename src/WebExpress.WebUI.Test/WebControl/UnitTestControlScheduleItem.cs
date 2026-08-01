using System;
using System.Collections.Generic;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the item of the schedule control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlScheduleItem
    {
        /// <summary>
        /// Tests the id property of the schedule item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-schedule-item""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-schedule-item""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleItem(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the timestamps are serialized without a zone offset, so
        /// the client parses them as local time.
        /// </summary>
        [Fact]
        public void Period_SerializesLocalTimestamps()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleItem("m")
            {
                Title = _ => "Meeting",
                Start = _ => new DateTime(2026, 8, 12, 10, 0, 0),
                End = _ => new DateTime(2026, 8, 12, 11, 30, 0)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(
                @"<div id=""m"" class=""wx-schedule-item"" data-title=""Meeting"" data-start=""2026-08-12T10:00:00"" data-end=""2026-08-12T11:30:00""></div>", html);
        }

        /// <summary>
        /// Tests that an all-day item is truncated to midnight, so the day it
        /// belongs to cannot depend on the time of day it was authored with.
        /// </summary>
        [Fact]
        public void AllDay_TruncatesToMidnight()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleItem("t")
            {
                Start = _ => new DateTime(2026, 8, 12, 17, 45, 0),
                End = _ => new DateTime(2026, 8, 14, 9, 15, 0),
                AllDay = _ => true
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(
                @"<div id=""t"" class=""wx-schedule-item"" data-start=""2026-08-12T00:00:00"" data-end=""2026-08-14T00:00:00"" data-all-day=""true""></div>", html);
        }

        /// <summary>
        /// Tests that an absent end emits no attribute, which is what makes the
        /// client treat the item as ending on the day it starts.
        /// </summary>
        [Fact]
        public void End_Absent_EmitsNoAttribute()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleItem()
            {
                Start = _ => new DateTime(2026, 8, 12, 10, 0, 0)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(
                @"<div class=""wx-schedule-item"" data-start=""2026-08-12T10:00:00""></div>", html);
        }

        /// <summary>
        /// Tests that a system color renders as a class and a user-defined color
        /// as an inline style declaration.
        /// </summary>
        [Theory]
        [InlineData(true, @"<div class=""wx-schedule-item"" data-color-style=""background:#ff8800;""></div>")]
        [InlineData(false, @"<div class=""wx-schedule-item"" data-color-css=""bg-success""></div>")]
        public void Color(bool userColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleItem()
            {
                Color = _ => userColor ? new PropertyColorBackground("#ff8800") : new PropertyColorBackground(TypeColorBackground.Success)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the category, the icon and the uri reach the client.
        /// </summary>
        [Fact]
        public void Presentation_EmitsCategoryIconAndUri()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleItem()
            {
                Category = _ => "quest",
                Icon = _ => new IconMap()
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(
                @"<div class=""wx-schedule-item"" data-category=""quest"" data-icon=""*""></div>", html);
        }

        /// <summary>
        /// Tests that the metadata is emitted as an encoded JSON object, because
        /// an attribute value is written verbatim and the quotes of the payload
        /// would otherwise end the attribute.
        /// </summary>
        [Fact]
        public void Metadata_EmitsEncodedJson()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleItem()
            {
                Metadata = _ => new Dictionary<string, string> { ["room"] = "Scumm Bar" }
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(
                @"<div class=""wx-schedule-item"" data-meta=""{&quot;room&quot;:&quot;Scumm Bar&quot;}""></div>", html);
        }

        /// <summary>
        /// Tests that an empty metadata map emits no attribute at all.
        /// </summary>
        [Fact]
        public void Metadata_Empty_EmitsNoAttribute()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleItem()
            {
                Metadata = _ => new Dictionary<string, string>()
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-schedule-item""></div>", html);
        }

        /// <summary>
        /// Tests that a title carrying a quote is encoded rather than ending the
        /// attribute it sits in.
        /// </summary>
        [Fact]
        public void Title_Encoded()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleItem()
            {
                Title = _ => @"Guybrush's ""quest"""
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(
                @"<div class=""wx-schedule-item"" data-title=""Guybrush&#39;s &quot;quest&quot;""></div>", html);
        }
    }
}
