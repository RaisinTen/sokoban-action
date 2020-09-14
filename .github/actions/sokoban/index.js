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
    constructor(move) {

        console.log("constructor called");

        this.move = move; // move to be made
        this.board = []; // game board
        this.message = "move made successfully!"; // issue reply
        this.boxMoved = false; // stores whether a box is moved in this state
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

    // move made in given direction
    moveInDirection = (row, col, rown, coln, rownn, colnn) => {
        
        console.log("moveInDirection called");

        const nextValue = this.board[row][col] === "OCTOCAT" ? "FLOOR" : "GOAL";

        if(rown < 0 || rown >= this.board.length || coln < 0 || coln >= this.board[0].length) {
            this.message = "can't go beyond the board!";
            return;
        }

        switch(this.board[rown][coln]) {
            case "WALL":
                this.message = "obstacle ahead, can't move that way!";
                return;
            case "FLOOR":
            case "GOAL":
                this.board[row][col] = nextValue;
                this.board[rown][coln] = "OCTOCAT" + (this.board[rown][coln] === "FLOOR" ? "" : "ONGOAL");
                return;
            case "BOX":
            case "BOXONGOAL":
                if(rownn < 0 || rownn >= this.board.length || colnn < 0 || colnn >= this.board[0].length) {
                    this.message = "can't go beyond the board!";
                } else if(this.board[rownn][colnn] === "FLOOR" || this.board[rownn][colnn] === "GOAL") {
                    this.boxMoved = true;
                    this.board[rownn][colnn] = "BOX" + (this.board[rownn][colnn] === "FLOOR" ? "" : "ONGOAL");
                    this.board[rown][coln] = "OCTOCAT" + (this.board[rown][coln] === "BOX" ? "" : "ONGOAL");
                    this.board[row][col] = nextValue;
                } else {
                    this.message = "obstacle ahead, can't move that way!";
                }
                break;
        }
    }

    moveBackInDirection = (row, col, rown, coln) => {
        
        console.log("moveBackInDirection called");

        this.board[row][col] = this.board[row][col] === "OCTOCAT" ? "FLOOR" : "GOAL";
        this.board[rown][coln] = this.board[rown][coln] === "FLOOR" ? "OCTOCAT" : "OCTOCATONGOAL";
    }

    moveBoxInDirection = (row, col, rown, coln) => {
        
        console.log("moveBoxInDirection called");

        this.board[row][col] = this.board[row][col] === "BOX" ? "FLOOR" : "GOAL";
        this.board[rown][coln] = this.board[rown][coln] === "FLOOR" ? "BOX" : "BOXONGOAL";
    }

    moveBack = (row, col) => {

        console.log("moveBack called");

        const gameMoves = fs.readFileSync("./game.moves", "utf-8").split("\n").filter((line) => line !== "");

        if(gameMoves.length === 0) {
            
            this.message = "no previous move, can't go back!";
        
        } else {
            
            const lastMove = gameMoves[gameMoves.length - 1][0];
            const boxMoved = gameMoves[gameMoves.length - 1][1] === "Y";

            switch(lastMove) {
                case "U":
                    this.moveBackInDirection(row, col, row + 1, col);
                    break;
                case "D":
                    this.moveBackInDirection(row, col, row - 1, col);
                    break;
                case "R":
                    this.moveBackInDirection(row, col, row, col - 1);
                    break;
                case "L":
                    this.moveBackInDirection(row, col, row, col + 1);
                    break;
            }

            if(boxMoved) {
                switch(lastMove) {
                    case "U":
                        this.moveBoxInDirection(row - 1, col, row, col);
                        break;
                    case "D":
                        this.moveBoxInDirection(row + 1, col, row - 1, col);
                        break;
                    case "R":
                        this.moveBoxInDirection(row, col + 1, row, col);
                        break;
                    case "L":
                        this.moveBoxInDirection(row, col - 1, row, col);
                        break;
                }
            }
        }
    }

    // checks if game is solved
    isSolved = () => {

        console.log("isSolved called");

        for(const row in this.board) {
            for(const cell in row) {
                console.log(cell, cell === "BOX");
                if(cell === "BOX") {
                    return false;
                }
            }
        }

        return true;
    }

    // makes new game
    newGame = () => {

        console.log("newGame called");

        this.message = "congratulations! You have won the game!";

        this.board = [
            ["WALL", "WALL", "WALL", "WALL", "WALL", "WALL", "WALL"],
            ["WALL", "WALL", "FLOOR", "FLOOR", "BOX", "GOAL", "WALL"],
            ["WALL", "OCTOCATONGOAL", "BOX", "FLOOR", "FLOOR", "FLOOR", "WALL"],
            ["WALL", "WALL", "WALL", "WALL", "WALL", "WALL", "WALL"],
        ];
    }

    // makes move
    makeMove = () => {

        console.log("makeMove called");

        const pos = this.findSokoban();
        console.table(pos);

        const {row: row, col: col} = pos;

        switch(this.move) {
            case "U":
                this.moveInDirection(row, col, row - 1, col, row - 2, col);
                break;
            case "D":
                this.moveInDirection(row, col, row + 1, col, row + 2, col);
                break;
            case "R":
                this.moveInDirection(row, col, row, col + 1, row, col + 2);
                break;
            case "L":
                this.moveInDirection(row, col, row, col - 1, row, col - 2);
                break;
            case "B":
                this.moveBack(row, col);
                break;
        }

        console.log("After move:");
        console.table(this.board);

        if(this.isSolved()) {
            this.newGame();
            console.log("New game:");
            console.table(this.board);
        }
    }

    // updates game state
    updateGameState = () => {

        console.log("updateGameState called");

        const OBJTONUM = {
            "FLOOR": "0",
            "WALL": "1",
            "OCTOCAT": "2",
            "BOX": "3",
            "GOAL": "4",
            "OCTOCATONGOAL": "5",
            "BOXONGOAL": "6",
        };

        const tempboard = [];

        for(const row of this.board) {
            
            const temp = [];

            for(const cell of row) {
                temp.push(OBJTONUM[cell]);
            }

            tempboard.push(temp.join(""));
        }

        console.log("game.state now:");
        console.log(tempboard.join("\n"));

        fs.writeFileSync("./game.state", tempboard.join("\n"));
    }

    // updates game.moves
    updateGameMoves = () => {

        if(this.message === "congratulations! You have won the game!") {
            // empty the file
            fs.writeFileSync("./game.moves", "");
            return;
        }

        const gameMoves = fs.readFileSync("./game.moves", "utf-8").split("\n").filter((line) => line !== "");

        if(this.move === "B") {
            gameMoves.pop();
        } else {
            gameMoves.push(this.move + (this.boxMoved ? "Y" : "N"));
        }

        console.log("game.moves now:");
        console.log(gameMoves.join("\n"));

        fs.writeFileSync("./game.moves", gameMoves.join("\n"));
    }

    // updates README.md
    updateReadme = () => {

        console.log("updateReadme called");

        const OBJTOIMG = {
            "FLOOR": "floor",
            "WALL": "wall",
            "OCTOCAT": "character",
            "BOX": "block",
            "GOAL": "goal",
            "OCTOCATONGOAL": "characterOnGoal",
            "BOXONGOAL": "reached",
        };

        let gameString =                `<table>\n`;
        let tabLevel = 0;

        for(const row of this.board) {

            gameString +=               `    <tr>\n`;

            for(const cell of row) {
                gameString +=           `        <td>\n`;
                gameString +=           '            <img src="./images/' + OBJTOIMG[cell] + '.png">\n';
                gameString +=           `        </td>\n`;
            }

            gameString +=               `    </tr>\n`;
        }

        gameString +=                   `</table>`;

        const finalReadmeString =
`# Sokoban Action

${ gameString }

<h1>
  <a href="https://github.com/RaisinTen/sokoban-action/issues/new?title=$U&body=Just+push+%27Submit+new+issue%27.+You+don%27t+need+to+do+anything+else.">:arrow_up:</a>
  <a href="https://github.com/RaisinTen/sokoban-action/issues/new?title=$D&body=Just+push+%27Submit+new+issue%27.+You+don%27t+need+to+do+anything+else.">:arrow_down:</a>
  <a href="https://github.com/RaisinTen/sokoban-action/issues/new?title=$R&body=Just+push+%27Submit+new+issue%27.+You+don%27t+need+to+do+anything+else.">:arrow_right:</a>
  <a href="https://github.com/RaisinTen/sokoban-action/issues/new?title=$L&body=Just+push+%27Submit+new+issue%27.+You+don%27t+need+to+do+anything+else.">:arrow_left:</a>
  <a href="https://github.com/RaisinTen/sokoban-action/issues/new?title=$B&body=Just+push+%27Submit+new+issue%27.+You+don%27t+need+to+do+anything+else.">:leftwards_arrow_with_hook:</a>
</h1>`;

        console.log("Final Readme string:");
        console.log(finalReadmeString);

        fs.writeFileSync("./README.md", finalReadmeString);
    }

    // updates game.state, game.moves and README.md
    updateGame = () => {

        console.log("updateGame called");

        this.updateGameState();
        this.updateGameMoves();
        this.updateReadme();
    }

    // asynchronously commits changes
    commit = async() => {

        console.log("commit called");

        if(this.message === "move made successfully!" || this.message === "congratulations! You have won the game!") {

            this.updateGame();

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

    const game = new Game(move);

    // fill board

    game.fillBoard();

    // make move
    
    game.makeMove();

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
