const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
    try {
        const octokit = github.getOctokit(token);

        const issueNumber = core.getInput("issue-number");
        const issueUser = core.getInput("issue-user");
        const move = core.getInput("move");
        const repoToken = core.getInput("repo-token");

        octokit.issues.createComment({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: issueNumber,
            body: `Oh Hai @${ issueUser }!`
        });

        octokit.issues.update({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: issueNumber,
            state: "closed"
        });
    } catch(err) {
        core.setFailed(err.message);
    }
}

run();
