using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.Test.WebHtml
{
    /// <summary>
    /// Unit tests for the DeterministicId class.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestDeterministicId
    {
        /// <summary>
        /// Tests that two calls to Create from the same callsite produce different identifiers.
        /// </summary>
        [Fact]
        public void CreateSameCallsite()
        {
            // act
            var id1 = CallCreate();
            var id2 = CallCreate();

            // validation
            Assert.NotEqual(id1, id2);
        }

        /// <summary>
        /// Tests that Create with different context values produces different identifiers.
        /// </summary>
        [Fact]
        public void CreateIndexes()
        {
            // act
            var id1 = CallCreate(0);
            var id2 = CallCreate(1);

            // validation
            Assert.NotEqual(id1, id2);
        }

        /// <summary>
        /// Tests that calls from different call sites produce different identifiers.
        /// </summary>
        [Fact]
        public void CreateDifferentCallsites()
        {
            // arrange
            var callsiteA = new Func<string>(() => DeterministicId.Create());
            var callsiteB = new Func<string>(() => DeterministicId.Create());

            // act
            var id1 = callsiteA();
            var id2 = callsiteB();

            // validation
            Assert.NotEqual(id1, id2);
        }

        /// <summary>
        /// Generates a deterministic identifier.
        /// </summary>
        /// <returns>A string that represents the generated deterministic identifier.</returns>
        private string CallCreate()
        {
            return DeterministicId.Create();
        }

        /// <summary>
        /// Generates a deterministic identifier based on the specified context.
        /// </summary>
        /// <param name="context">
        /// The context used to influence the generated identifier.
        /// </param>
        /// <returns>
        /// A string that represents the generated deterministic identifier.
        /// </returns>
        private string CallCreate(object context)
        {
            return DeterministicId.Create(context);
        }
    }
}
