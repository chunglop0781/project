
let octokit = null;

async function getOctokit() {
    if (!octokit) {
        const { Octokit } = await import("@octokit/rest");

        octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });
    }

    return octokit;
}

module.exports = {
    getOctokit,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || "main"
};

