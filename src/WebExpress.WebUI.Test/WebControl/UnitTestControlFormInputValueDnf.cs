using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the disjunctive normal form value.
    /// </summary>
    /// <remarks>
    /// The value is the contract between the C# and the JavaScript half of the
    /// control family: both parse and serialize the same notation, so a mismatch
    /// here silently rewrites a filter on the way through a form. The cases below
    /// mirror control.dnf.test.mjs one for one.
    /// </remarks>
    public class UnitTestControlFormInputValueDnf
    {
        /// <summary>
        /// Tests that the notation carries both levels of the expression.
        /// </summary>
        [Theory]
        [InlineData("a;b|c", "a;b|c")]
        [InlineData("a", "a")]
        [InlineData("a;b", "a;b")]
        [InlineData("a|b|c", "a|b|c")]
        public void RoundTrip(string value, string expected)
        {
            // arrange
            var dnf = new ControlFormInputValueDnf(value);

            // act
            var serialized = dnf.ToString();

            // validation
            Assert.Equal(expected, serialized);
        }

        /// <summary>
        /// Tests that the two levels are parsed into the structure they describe.
        /// </summary>
        [Fact]
        public void Groups()
        {
            // arrange
            var dnf = new ControlFormInputValueDnf("a;b|c");

            // act
            var groups = dnf.Groups.Select(x => x.ToArray()).ToArray();

            // validation
            Assert.Equal(2, groups.Length);
            Assert.Equal(["a", "b"], groups[0]);
            Assert.Equal(["c"], groups[1]);
        }

        /// <summary>
        /// Tests that nothing without meaning survives parsing: a blank term, a term
        /// repeated inside one conjunction and a conjunction that ended up empty.
        /// </summary>
        [Theory]
        [InlineData("a; ;a|;|b", "a|b")]
        [InlineData("|||", "")]
        [InlineData("", "")]
        [InlineData(null, "")]
        public void Normalization(string value, string expected)
        {
            // arrange
            var dnf = new ControlFormInputValueDnf(value);

            // act
            var serialized = dnf.ToString();

            // validation
            Assert.Equal(expected, serialized);
        }

        /// <summary>
        /// Tests that an empty expression says so.
        /// </summary>
        [Theory]
        [InlineData(null, true)]
        [InlineData("", true)]
        [InlineData("a", false)]
        public void IsEmpty(string value, bool expected)
        {
            // arrange
            var dnf = new ControlFormInputValueDnf(value);

            // validation
            Assert.Equal(expected, dnf.IsEmpty);
        }

        /// <summary>
        /// Tests that the distinct terms of the whole expression are reachable
        /// without walking its structure.
        /// </summary>
        [Fact]
        public void Terms()
        {
            // arrange
            var dnf = new ControlFormInputValueDnf("a;b|b;c");

            // act
            var terms = dnf.Terms.ToArray();

            // validation
            Assert.Equal(["a", "b", "c"], terms);
        }

        /// <summary>
        /// Tests that conjunctions can be composed one at a time.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var dnf = new ControlFormInputValueDnf();

            // act
            dnf.Add("a", "b").Add("c");

            // validation
            Assert.Equal("a;b|c", dnf.ToString());
        }

        /// <summary>
        /// Tests that a conjunction can be dropped again.
        /// </summary>
        [Fact]
        public void Remove()
        {
            // arrange
            var dnf = new ControlFormInputValueDnf("a;b|c");

            // act
            dnf.Remove(0);

            // validation
            Assert.Equal("c", dnf.ToString());
        }

        /// <summary>
        /// Tests the semantics the control exists to express: the expression holds
        /// when at least one of its conjunctions is fully contained in the facts.
        /// </summary>
        [Theory]
        [InlineData("a;b|c", new[] { "a", "b" }, true)]
        [InlineData("a;b|c", new[] { "c" }, true)]
        [InlineData("a;b|c", new[] { "a" }, false)]
        [InlineData("a;b|c", new[] { "a", "c", "d" }, true)]
        [InlineData("a;b|c", new string[0], false)]
        [InlineData("", new[] { "a" }, false)]
        public void IsSatisfiedBy(string value, string[] facts, bool expected)
        {
            // arrange
            var dnf = new ControlFormInputValueDnf(value);

            // validation
            Assert.Equal(expected, dnf.IsSatisfiedBy(facts));
        }

        /// <summary>
        /// Tests that a single conjunction is byte for byte the semicolon list a
        /// plain selection produces, which is what lets a selection value be adopted
        /// by a DNF control without conversion.
        /// </summary>
        [Fact]
        public void SingleGroupMatchesTheSelectionNotation()
        {
            // arrange
            var selection = new ControlFormInputValueStringList("a;b");
            var dnf = new ControlFormInputValueDnf("a;b");

            // validation
            Assert.Equal(selection.Items, dnf.Groups.Single());
        }
    }
}
