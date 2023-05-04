import "./styles.css";

import Phaser from "phaser";
import Play from "./play.js";

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 512,
  backgroundColor: "#2d2d2d",
  parent: "game-container",
  physics: {
    default: "matter",
    matter: {}
  },
  scene: [Play]
};

new Phaser.Game(config);
