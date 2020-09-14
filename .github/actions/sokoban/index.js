"use strict";

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

class Game {
    // initialize members
    constructor() {

        console.log("constructor called");

        this.board = []; // game board
        this.message = ""; // issue reply
    }

    // reads from game files to fill up the board
    fillBoard = () => {

        console.log("fillBoard called");

        const gameStateInput = fs.readFileSync("./game.state", "utf-8").split("\n").filter((line) => line != "");
        console.table(gameStateInput);

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

        for(const row of gameStateInput) {

            const temp = [];

            for(const cell of row) {
                temp.push(NUMTOOBJ[cell]);
            }

            this.board.push(temp);
        }

        console.table(this.board);
    }

    // finds sokoban
    findSokoban = () => {

        console.table("findSokoban called");

        let row = 0, col = 0;
        let found = false;

        for(let row = 0; row < this.board.length && !found; ++row) {
            for(let col = 0; col < this.board[0].length && !found; ++col) {

                const cell = this.board[row][col];

                if(cell === "OCTOCAT" || cell === "OCTOCATONGOAL") {
                    return {
                        row: row,
                        col: col
                    };
                }
            }
        }
    }

    // moves sokoban up
    moveUp = (pos) => {
        
        console.log("moveUp called");

        ;
    }

    // makes move
    makeMove = (move) => {

        console.log("makeMove called");

        const pos = this.findSokoban();
        console.table(pos);

        switch(move) {
            case "U":
                this.moveUp(pos);
                break;
            case "D":
                this.moveDown(pos);
                break;
            case "R":
                this.moveRight(pos);
                break;
            case "L":
                this.moveLeft(pos);
                break;
            case "B":
                this.moveBack(pos);
                break;
        }
    }

    // asynchronously commits changes
    commit = async() => {

        console.log("commit called");

        if(this.message === "success") {
            await commitFile();
        }
    }

    // returns message
    getMessage = () => {

        console.log("getMessage called");

        return this.message;
    }
}

// to handle the move by issueUser and respond with a message
async function play(move, issueUser) {

    // game object

    const game = new Game();

    // fill board

    game.fillBoard();

    // make move
    
    game.makeMove(move);

    // commit files

    await game.commit();

    // return message

    return `@${ issueUser } ${ game.getMessage() }`;
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
