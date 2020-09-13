const core = require("@actions/core");

async function run() {
    try {
        const name = core.getInput("name");
        console.log(`Hello ${ name }`);
    } catch(err) {
        core.setFailed(err.message);
    }
}

run();
