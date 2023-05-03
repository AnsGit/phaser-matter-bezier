import "./styles.css";
import Phaser from "phaser";

import Play from "./Play.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#2d2d2d",
  parent: "phaser-example",
  physics: {
    default: "matter"
  },
  scene: [Play]
};

new Phaser.Game(config);
