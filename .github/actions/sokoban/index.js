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
                err = new Error(`Invalid status code: ${ code }`);
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

    // reads from game file to fill up the board
    fillBoard = (gameFile) => {

        console.log("fillBoard called");

        const gameStateInput = fs.readFileSync(gameFile, "utf-8").split("\n").filter((line) => line != "");
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

        this.board = [];

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

        const gameMoves = fs.readFileSync("./game/moves", "utf-8").split("\n").filter((line) => line !== "");

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

        for(const row of this.board) {
            for(const cell of row) {
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

        // getting current game

        let current = fs.readFileSync("./game/current", "utf-8").split("\n")[0];

        // loading new game

        const gameFiles = [];

        // read in file names except current
        fs.readdirSync("./game/new").forEach(fileName => {
            if(fileName !== current) {
                gameFiles.push(fileName);
            }
        });

        // select random game file for current game
        current = gameFiles[Math.floor(Math.random() * gameFiles.length)];

        // update current
        fs.writeFileSync("./game/current", current);

        // get current game file path
        const gameFile = "./game/new/" + current;

        this.fillBoard(gameFile);
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
            default:
                this.message = "wait, that's illegal!";
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

    // updates ./game/state
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

        console.log("./game/state now:");
        console.log(tempboard.join("\n"));

        fs.writeFileSync("./game/state", tempboard.join("\n"));
    }

    // updates ./game/moves
    updateGameMoves = () => {

        if(this.message === "congratulations! You have won the game!") {
            // empty the file
            fs.writeFileSync("./game/moves", "");
            return;
        }

        const gameMoves = fs.readFileSync("./game/moves", "utf-8").split("\n").filter((line) => line !== "");

        if(this.move === "B") {
            gameMoves.pop();
        } else {
            gameMoves.push(this.move + (this.boxMoved ? "Y" : "N"));
        }

        console.log("./game/moves now:");
        console.log(gameMoves.join("\n"));

        fs.writeFileSync("./game/moves", gameMoves.join("\n"));
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
</h1>

## Instructions

[Sokoban](https://en.wikipedia.org/wiki/Sokoban) is a game where you are supposed to push each box to a goal.

### Items

| Name        | Item                                             | Description                                                                                                                                                            |
| :---:       | :---:                                            | :---:                                                                                                                                                                  |
| **Octocat** | <img src="./images/character.png" width="100px"> | You can move me in all 4 directions with :arrow_up:, :arrow_down:, :arrow_right:, :arrow_left: and go back a move with :leftwards_arrow_with_hook: when you are stuck. |
| **Box**     | <img src="./images/block.png" width="100px">     | I get pushed in the direction Octocat moves. When I am pushed into a goal, I turn blue!                                                                                |
| **Goal**    | <img src="./images/goal.png" width="100px">      | When a box is pushed into me, it turns blue!                                                                                                                           |
| **Wall**    | <img src="./images/wall.png" width="100px">      | You can't push me.                                                                                                                                                     |

### Working

#### GitHub Actions

<a href="https://github.com/features/actions"><img src="https://avatars0.githubusercontent.com/u/44036562?s=200&v=4" width="100px"></a>

This game is made using GitHub Actions! When you click on the controls, it opens a new issue with a text to trigger the workflow. After you submit the issue, the action starts running and updates the [board](README.md) and replies to your issue.

To know more about this, check out <a href="https://dev.to/raisinten/sokoban-action-ji9">the blog on <img src="https://avatars2.githubusercontent.com/u/13521919?s=200&v=4" width="25px"></a>!

Now push! :smiley:

## Code of Conduct

Please refer to the [code of conduct](CODE_OF_CONDUCT.md) for the rules for interacting with this project.

## License

This project is licensed under the [MIT License](LICENSE).`;

        console.log("Final Readme string:");
        console.log(finalReadmeString);

        fs.writeFileSync("./README.md", finalReadmeString);
    }

    // updates ./game/state, ./game/moves and README.md
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

    game.fillBoard("./game/state");

    // make move
    
    game.makeMove();

    // commit files

    await game.commit();

    // return message

    return `@${ issueUser } ${ game.getMessage() } Play your next move [here](https://github.com/RaisinTen/sokoban-action)!`;
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
