const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
    try {
        const token = core.getInput("repo-token");
        const octokit = github.getOctokit(token);

        octokit.issues.createComment({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: process.env.EVENT_ISSUE_NUMBER,
            body: `Oh Hai ${ process.env.EVENT_USER_LOGIN }!`
        });
    } catch(err) {
        core.setFailed(err.message);
    }
}

run();
