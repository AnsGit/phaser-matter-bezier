import "./styles.css";

// import Phaser from "phaser";
import Phaser from "./phaser.js";

import config from "./config.js";
import Play from "./play.js";

const props = {
  type: Phaser.AUTO,
  width: config.WIDTH,
  height: config.HEIGHT,
  backgroundColor: config.BACKGROUND_COLOR,
  parent: "game-container",
  // forceSestTimeOut: true,
  physics: {
    default: "matter",
    matter: {}
  },
  // fps: {
  //   target: 60,
  //   forceSetTimeOut: true
  // },
  scene: [Play]
};

const game = new Phaser.Game(props);
