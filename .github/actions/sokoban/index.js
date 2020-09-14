const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// executes shell commands
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

// commits all files
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

// parse the contents of ./game.state and return board
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

    const board = [];

    for(row of gameStateInput) {
        const temp = [];
        for(key of row) {
            temp.push(NUMTOOBJ[key]);
        }
        board.push(temp.join(" "));
    }

    console.log(board.join("\n"));

    return board;
}

// to handle the move by issueUser and respond with a message
async play(move, issueUser) {
    
    // read board
    
    ;

    // make move

    ;

    // commit files

    ;

    // set message

    ;

    // return message

    return  message;

    /*
    const readmeContent = fs.readFileSync("./README.md", "utf-8").split("\n");
    readmeContent.push(":smiley:");
    fs.writeFileSync("./README.md", readmeContent.join("\n"));
    await commitFile();
    */
}

// entry point
async function run() {
    try {
        // action inputs using core
        const issueNumber = core.getInput("issue-number"); // number of the issue
        const issueUser = core.getInput("issue-user"); // user who created the issue
        const move = core.getInput("move")[1]; // move: can be $U (up), $D (down), $R (right), $L (left) or $B (back)
        const repoToken = core.getInput("repo-token"); // repository token for octokit

        // octokit to interact with issues
        const octokit = github.getOctokit(repoToken); // to handle issues
        const owner = github.context.repo.owner; // owner of the repo for octokit
        const repo = github.context.repo.repo; // repo name for octokit

        const message = await play(move, issueUser); // handle move

        // reply to issue
        octokit.issues.createComment({
            owner: owner,
            repo: repo,
            issue_number: issueNumber,
            body: message
        });

        // close issue
        octokit.issues.update({
            owner: owner,
            repo: repo,
            issue_number: issueNumber,
            state: "closed"
        });
    } catch(err) {
        core.setFailed(err.message);
    }
}

run();
