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

async function parse() {
    const gameStateInput = fs.readFileSync("./game.state", "utf-8").split("\n");

    /*
     * FLOOR            = 0
     * WALL             = 1
     * OCTOCAT          = 2
     * BOX              = 3
     * GOAL             = 4
     * OCTOCATONGOAL    = 5
     * BOXONGOAL        = 6
     */

    const NUMTOOBJ = [
        "FLOOR",
        "WALL",
        "OCTOCAT",
        "BOX",
        "GOAL",
        "OCTOCATONGOAL",
        "BOXONGOAL",
    ];

    let board = [];

    for(row of gameStateInput) {
        let temp = [];
        for(key of row) {
            temp.push(NUMTOOBJ[key]);
        }
        board.push(temp.join(" "));
    }

    console.log(board.join("\n"));
}

async function run() {
    try {
        const issueNumber = core.getInput("issue-number");
        const issueUser = core.getInput("issue-user");
        const move = core.getInput("move")[1];
        const repoToken = core.getInput("repo-token");

        const octokit = github.getOctokit(repoToken);

        const owner = github.context.repo.owner;
        const repo = github.context.repo.repo;

        // reply to issue
        octokit.issues.createComment({
            owner: owner,
            repo: repo,
            issue_number: issueNumber,
            body: `Oh Hai @${ issueUser }!`
        });

        // close issue
        octokit.issues.update({
            owner: owner,
            repo: repo,
            issue_number: issueNumber,
            state: "closed"
        });

        await parse();

        /*
        const readmeContent = fs.readFileSync("./README.md", "utf-8").split("\n");
        readmeContent.push(":smiley:");
        fs.writeFileSync("./README.md", readmeContent.join("\n"));
        await commitFile();
        */

    } catch(err) {
        core.setFailed(err.message);
    }
}

run();
