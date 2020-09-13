const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const exec = (cmd, args = []) =>
  new Promise((resolve, reject) => {
    const app = spawn(cmd, args, { stdio: "pipe" });
    let stdout = "";
    app.stdout.on("data", (data) => {
      stdout = data;
    });
    app.on("close", (code) => {
      if (code !== 0 && !stdout.includes("nothing to commit")) {
        err = new Error(`Invalid status code: ${code}`);
        err.code = code;
        return reject(err);
      }
      return resolve(code);
    });
    app.on("error", reject);
  });

const commitFile = async () => {
  await exec("git", [
    "config",
    "--global",
    "user.email",
    "41898282+github-actions[bot]@users.noreply.github.com",
  ]);
  await exec("git", ["config", "--global", "user.name", "github-actions"]);
  await exec("git", ["add", "-A"]);
  await exec("git", ["commit", "-m", "Moved"]);
  await exec("git", ["push"]);
};

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

        const readmeContent = fs.readFileSync("./README.md", "utf-8").split("\n");
        readFileSync.push(":smiley:");
        fs.writeFileSync("./README.md", readmeContent.join("\n"));

        await commitFile();
    } catch(err) {
        core.setFailed(err.message);
    }
}

run();
