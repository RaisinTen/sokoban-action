const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
    try {
        const issueNumber = core.getInput("issue-number");
        const issueUser = core.getInput("issue-user");
        const move = core.getInput("move")[1];
        const repoToken = core.getInput("repo-token");

        const octokit = github.getOctokit(repoToken);
        
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

        console.log("move:", move);
    } catch(err) {
        core.setFailed(err.message);
    }
}

run();
