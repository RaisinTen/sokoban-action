# Instructions

[Sokoban](https://en.wikipedia.org/wiki/Sokoban) is a game where you are supposed to push each box to a goal.

## Items

| Name        | Item                                             | Description                                                                                                                                                            |
| :---:       | :---:                                            | :---:                                                                                                                                                                  |
| **Octocat** | <img src="./images/character.png" width="100px"> | You can move me in all 4 directions with :arrow_up:, :arrow_down:, :arrow_right:, :arrow_left: and go back a move with :leftwards_arrow_with_hook: when you are stuck. |
| **Box**     | <img src="./images/block.png" width="100px">     | I get pushed in the direction Octocat moves. When I am pushed into a goal, I turn blue!                                                                                |
| **Goal**    | <img src="./images/goal.png" width="100px">      | When a box is pushed into me, it turns blue!                                                                                                                           |
| **Wall**    | <img src="./images/wall.png" width="100px">      | You can't push me.                                                                                                                                                     |

## Working

### GitHub Actions

<a href="https://github.com/features/actions"><img src="https://avatars0.githubusercontent.com/u/44036562?s=200&v=4" width="100px"></a>

This game is made using GitHub Actions! When you click on the controls, it opens a new issue with a text to trigger the workflow. The action starts running and updates the [board](README.md) and replies to your issue. Now push! :smiley:
