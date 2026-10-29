namespace WebExpress.WebUI.Test.Fixture
{
    /// <summary>
    /// Defines a collection of tests that should not be run in parallel.
    /// </summary>
    /// <remarks>
    /// Only tests that change process-wide state belong here, such as the markdown and pdf
    /// plugin registries every component hub fills. Every other test boots its own hub and
    /// runs in parallel.
    /// </remarks>
    [CollectionDefinition("NonParallelTests", DisableParallelization = true)]
    public class NonParallelTestsCollection : ICollectionFixture<UnitTestControlFixture>
    {

    }
}
