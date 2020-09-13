const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
    try {
        console.log("repository:", process.env.REPOSITORY);
    } catch(err) {
        core.setFailed(err.message);
    }
}

run();
