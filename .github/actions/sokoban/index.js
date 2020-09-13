const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
    try {
        const token = core.getInput("repo-token");
        const octokit = github.getOctokit(token);

        octokit.issues.createComment({
            owner: "RaisinTen",
            repo: process.env.REPOSITORY,
            issue_number: process.env.EVENT_ISSUE_NUMBER,
            body: "Oh Hai Mark!"
        });
    } catch(err) {
        core.setFailed(err.message);
    }
}

run();
