using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the service level agreement control.
    /// </summary>
    /// <remarks>
    /// The widget is rendered at a moment the test names, so the markup - the
    /// status, the meter, the countdown and the cycle counter - is asserted on
    /// as a value rather than as whatever the clock happened to say.
    /// </remarks>
    [Collection("NonParallelTests")]
    public class UnitTestControlSla
    {
        /// <summary>
        /// The moment the agreements under test start at.
        /// </summary>
        private static readonly DateTime _start = new(2026, 8, 1, 8, 0, 0);

        /// <summary>
        /// Creates a control that grants four hours from <see cref="_start"/>
        /// and is evaluated the given number of minutes into them.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="minutes">The minutes elapsed at the moment of rendering.</param>
        /// <returns>The control.</returns>
        private static ControlSla CreateControl(string id = null, int minutes = 60)
        {
            return new ControlSla(id)
            {
                Start = _ => _start,
                Target = _ => TimeSpan.FromHours(4),
                Now = _ => _start.AddMinutes(minutes)
            };
        }

        /// <summary>
        /// Tests the id property of the sla control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sla wx-webui-sla wx-sla-fulfilled""*")]
        [InlineData("id", @"<div id=""id"" class=""wx-sla wx-webui-sla wx-sla-fulfilled""*")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = CreateControl(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the complete markup of an agreement that is on track, which is
        /// the contract the client runtime and the stylesheet are written
        /// against.
        /// </summary>
        [Fact]
        public void Markup()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = CreateControl("sla");
            control.Label = _ => "Response time";
            control.ShowActions = _ => false;

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"<div id=""sla"" class=""wx-sla wx-webui-sla wx-sla-fulfilled"" role=""group"" " +
                @"aria-label=""Response time"" data-status=""fulfilled"" data-now=""2026-08-01T09:00:00"" " +
                @"data-target=""14400"" data-elapsed=""3600"" data-remaining=""10800"" data-progress=""0.25"" " +
                @"data-warning-threshold=""0.8"" data-cycle=""1"" data-cycles=""1"" data-deadline=""2026-08-01T12:00:00"">" +
                @"<div class=""wx-sla-header""><span class=""wx-sla-label"">Response time</span>" +
                @"<span class=""wx-sla-status"" role=""status"" aria-live=""polite"">Fulfilled</span></div>" +
                @"<div class=""wx-sla-meter"" role=""progressbar"" aria-valuemin=""0"" aria-valuemax=""100"" " +
                @"aria-valuenow=""25"" aria-valuetext=""25% - 3 h""><div class=""wx-sla-meter-track"">" +
                @"<div class=""wx-sla-meter-value"" style=""width: 25%;""></div></div></div>" +
                @"<div class=""wx-sla-footer""><time class=""wx-sla-remaining"" datetime=""PT3H0M0S"">3 h</time></div></div>",
                html
            );
        }

        /// <summary>
        /// Tests that the status the server computed reaches the markup as a
        /// class, as a data attribute and as the text of the badge.
        /// </summary>
        [Theory]
        [InlineData(60, "wx-sla-fulfilled", "fulfilled", "Fulfilled")]
        [InlineData(200, "wx-sla-at-risk", "at-risk", "At risk")]
        [InlineData(300, "wx-sla-violated", "violated", "Violated")]
        public void Status(int minutes, string expectedClass, string expectedValue, string expectedText)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = CreateControl(minutes: minutes);

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains(expectedClass, html);
            Assert.Contains($@"data-status=""{expectedValue}""", html);
            Assert.Contains($@">{expectedText}</span>", html);
        }

        /// <summary>
        /// Tests that a paused agreement renders grey, reports the pause to the
        /// client and offers the resume rather than the pause action.
        /// </summary>
        [Fact]
        public void Paused()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = CreateControl(minutes: 300);
            control.PausedSince = _ => _start.AddHours(1);

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains("wx-sla-paused", html);
            Assert.Contains(@"data-paused=""true""", html);
            Assert.Contains(@"data-remaining=""10800""", html);
            Assert.DoesNotContain(@"data-deadline", html);
            Assert.Contains(@"data-wx-sla-action=""pause"" disabled", html);
        }

        /// <summary>
        /// Tests that the recurrence reaches the client and that the cycle
        /// counter is rendered for a periodic agreement.
        /// </summary>
        [Fact]
        public void Recurrence()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = CreateControl(minutes: 3000);
            control.Recurrence = _ => TypeRecurrenceSla.Daily;
            control.Cycles = _ => 5;

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains(@"data-recurrence=""daily""", html);
            Assert.Contains(@"data-period=""86400""", html);
            Assert.Contains(@"data-cycle=""3""", html);
            Assert.Contains(@"data-cycles=""5""", html);
            Assert.Contains(@"<span class=""wx-sla-cycle"">Cycle 3 of 5</span>", html);
        }

        /// <summary>
        /// Tests that a settled cycle is reported to the client, which has to
        /// tell it apart from a merely on track one before it counts on.
        /// </summary>
        [Fact]
        public void Fulfilled()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = CreateControl(minutes: 300);
            control.FulfilledCycle = _ => 1;
            control.FulfilledAt = _ => _start.AddHours(2);

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains("wx-sla-fulfilled", html);
            Assert.Contains(@"data-settled=""true""", html);
            Assert.Contains(@"data-fulfilled=""2026-08-01T10:00:00""", html);
            Assert.Contains(@"data-wx-sla-action=""fulfill"" disabled", html);
        }

        /// <summary>
        /// Tests that an overrun is rendered as a negative reading rather than
        /// being clipped at zero.
        /// </summary>
        [Fact]
        public void Overrun()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = CreateControl(minutes: 375);

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains(@"data-remaining=""-8100""", html);
            Assert.Contains(@"<time class=""wx-sla-remaining"" datetime=""-PT2H15M0S"">-2 h 15 min</time>", html);
        }

        /// <summary>
        /// Tests the transition buttons, which carry an icon only and therefore
        /// depend on their accessible name.
        /// </summary>
        [Fact]
        public void Actions()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = CreateControl();

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains(@"<div class=""wx-sla-actions"">", html);
            Assert.Contains(@"aria-label=""Pause"" data-wx-sla-action=""pause""", html);
            Assert.Contains(@"aria-label=""Resume"" data-wx-sla-action=""resume""", html);
            Assert.Contains(@"aria-label=""Mark as fulfilled"" data-wx-sla-action=""fulfill""", html);
            Assert.Contains(@"data-wx-sla-action=""resume"" disabled", html);
        }

        /// <summary>
        /// Tests that the actions can be left out, which is what a read-only
        /// dashboard tile wants.
        /// </summary>
        [Fact]
        public void WithoutActions()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = CreateControl();
            control.ShowActions = _ => false;

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.DoesNotContain("wx-sla-actions", html);
        }

        /// <summary>
        /// Tests that the live countdown can be switched off, which is what a
        /// printable report or a table of many rows wants.
        /// </summary>
        [Fact]
        public void WithoutLive()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = CreateControl();
            control.Live = _ => false;

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains(@"data-live=""false""", html);
        }

        /// <summary>
        /// Tests that the description is rendered when one is given.
        /// </summary>
        [Fact]
        public void Description()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = CreateControl();
            control.Description = _ => "First response to a premium ticket";

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains(@"<div class=""wx-sla-description"">First response to a premium ticket</div>", html);
        }

        /// <summary>
        /// Tests that a definition kept elsewhere - in a store, behind a REST
        /// endpoint - can be adopted without restating every property by hand.
        /// </summary>
        [Fact]
        public void Bind()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var definition = new SlaDefinition
            {
                Start = _start,
                Target = TimeSpan.FromHours(4),
                Recurrence = TypeRecurrenceSla.Weekly,
                Cycles = 4
            }
                .Pause(_start.AddHours(1));

            var control = new ControlSla("sla") { Now = _ => _start.AddHours(3) }.Bind(definition);

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains(@"data-recurrence=""weekly""", html);
            Assert.Contains(@"data-cycles=""4""", html);
            Assert.Contains(@"data-paused=""true""", html);
            Assert.Contains(@"data-elapsed=""3600""", html);
        }

        /// <summary>
        /// Tests that a control with agreements added to it becomes the panel
        /// that frames them, rather than an agreement of its own.
        /// </summary>
        [Fact]
        public void Panel()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSla("panel", CreateControl("a"))
            {
                Label = _ => "Support"
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains(@"<div id=""panel"" class=""wx-sla-group wx-webui-sla-group wx-sla-fulfilled"" role=""group"" aria-label=""Support"">", html);
            Assert.Contains(@"<span class=""wx-sla-group-label"">Support</span>", html);
            Assert.Contains(@"<div class=""wx-sla-group-items"">", html);
            Assert.Contains(@"<div id=""a"" class=""wx-sla wx-webui-sla wx-sla-fulfilled""", html);
        }

        /// <summary>
        /// Tests that the summary counts the framed agreements per status, with
        /// the ones that need attention first.
        /// </summary>
        [Fact]
        public void Summary()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var paused = CreateControl("e", 300);
            paused.PausedSince = _ => _start.AddHours(1);

            var control = new ControlSla("panel")
                .Add(CreateControl("a"), CreateControl("b", 200), CreateControl("c", 300), CreateControl("d"), paused);

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains(@"<span class=""wx-sla-summary"" role=""status"" aria-live=""polite"">1 violated, 1 at risk, 1 paused, 2 fulfilled</span>", html);
        }

        /// <summary>
        /// Tests that the panel takes the colour of its worst agreement, because
        /// one that showed the best of them would hide what it exists to
        /// surface.
        /// </summary>
        [Theory]
        [InlineData(new[] { 60, 60 }, "wx-sla-fulfilled")]
        [InlineData(new[] { 60, 200 }, "wx-sla-at-risk")]
        [InlineData(new[] { 60, 200, 300 }, "wx-sla-violated")]
        public void Worst(int[] minutes, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSla("panel");

            for (var i = 0; i < minutes.Length; i++)
            {
                control.Add(CreateControl($"a{i}", minutes[i]));
            }

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.Contains($@"wx-webui-sla-group {expected}""", html);
        }

        /// <summary>
        /// Tests that a single stopped clock does not colour the whole panel
        /// grey, because it says nothing about the rest of the set.
        /// </summary>
        [Fact]
        public void PausedOnlyWhenAll()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var one = CreateControl("b");
            one.PausedSince = _ => _start.AddHours(1);
            var other = CreateControl("d");
            other.PausedSince = _ => _start.AddHours(1);

            // act
            var mixed = new ControlSla("a", CreateControl("a"), one).Render(context, visualTree).ToString();
            var all = new ControlSla("b", other, one).Render(context, visualTree).ToString();

            // assert
            Assert.Contains(@"wx-webui-sla-group wx-sla-fulfilled""", mixed);
            Assert.Contains(@"wx-webui-sla-group wx-sla-paused""", all);
        }

        /// <summary>
        /// Tests that the summary can be left out, which is what a panel of two
        /// agreements that speak for themselves wants.
        /// </summary>
        [Fact]
        public void WithoutSummary()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSla("panel", CreateControl("a"))
            {
                Label = _ => "Support",
                ShowSummary = _ => false
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // assert
            Assert.DoesNotContain("wx-sla-summary", html);
        }
    }
}
