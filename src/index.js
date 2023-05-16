import "./styles.css";

import Phaser from "phaser";

import config from "./config.js";
import Play from "./play.js";

const props = {
  type: Phaser.AUTO,
  width: config.WIDTH,
  height: config.HEIGHT,
  backgroundColor: config.BACKGROUND_COLOR,
  parent: "game-container",
  physics: {
    default: "matter",
    matter: {}
  },
  // fps: {
  //   target: 30,
  //   forceSetTimeOut: true
  // },
  scene: [Play]
};

const game = new Phaser.Game(props);
