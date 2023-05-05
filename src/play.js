import Phaser from "phaser";
import _ from "underscore";

import config from "./config.js";

class Play extends Phaser.Scene {
  graphics;
  // points;
  curve;
  // path;

  preload() {
    this.load.image("ball", require("../assets/ball.png"), 40, 40);
  }

  create() {
    console.log(this.matter);

    this.matter.world.setBounds(0, 0, config.WIDTH, config.HEIGHT, 40, true, true, true, true);
    this.matter.world.setGravity(0, 2);

    this.graphics = this.add.graphics();

    this.createSurface();
    this.createPlain();

    this.createSlope();
    this.createBall();

    this.buildSlope();
    this.subscribeSlope();


    // this.tweens.add({
    //   targets: this.path,
    //   t: 1,
    //   ease: "Sine.easeInOut",
    //   duration: 2000,
    //   yoyo: true,
    //   repeat: -1
    // });
  }

  createSurface() {
    this.surface = {
      category: this.matter.world.nextCategory()
    }
  }

  createPlain() {
    this.plain = {
      rects: [
        // Left part
        this.matter.add.rectangle(
          config.SLOPE.POINTS.START.x/2,
          config.SLOPE.POINTS.START.y,
          config.SLOPE.POINTS.START.x,
          2,
          {
            isStatic: true,
            collisionFilter: { category: this.surface.category }
          }
        ),
        // Right part
        this.matter.add.rectangle(
          config.SLOPE.POINTS.END.x + (config.WIDTH - config.SLOPE.POINTS.END.x)/2,
          config.SLOPE.POINTS.END.y,
          config.WIDTH - config.SLOPE.POINTS.END.x,
          2,
          {
            isStatic: true,
            collisionFilter: { category: this.surface.category }
          }
        )
      ]
    };
  }

  createSlope() {
    const { POINTS } = config.SLOPE;

    this.slope = {
      curve: new Phaser.Curves.CubicBezier(
        // Start point
        new Phaser.Math.Vector2(POINTS.START.x, POINTS.START.y),
        // Control point
        ...POINTS.CONTROL.map( p => new Phaser.Math.Vector2(p.x, p.y) ),
        // End point
        new Phaser.Math.Vector2(POINTS.END.x, POINTS.END.y)
      ),
      interactive: { points: null },
      points: [],
      rects: []
    };

    this.slope.interactive.points = _.range(4).map((i) => {
      const basePoint = this.slope.curve[`p${i}`];
      const { x, y } = basePoint;

      const isControl = [1, 2].includes(i);

      let color, radius;

      if (isControl) {
        color = config.SLOPE.CONTROL.COLOR;
        radius = config.SLOPE.CONTROL.POINT.RADIUS;
      }
      else {
        color = config.SLOPE.COLOR;
        radius = config.SLOPE.POINT.RADIUS;
      }

      const point = this.add
        .circle(x, y, radius, color)
        .setData("vector", basePoint)
        .setInteractive();
      
      return point;
    });
  }

  createBall() {
    this.ball = this.matter.add.image(config.BALL.x, config.BALL.y, "ball", 1);

    this.ball.setCircle(20);
    // this.ball.setSlop(20);
    this.ball.setFriction(0.06);
    this.ball.setFrictionAir(0.0001);
    this.ball.setBounce(0.8);
    // this.ball.setInertia(1000);
    this.ball.setMass(0.1);
    this.ball.setDensity(0.0000008);
    this.ball.setVelocityX(1);
  }

  subscribeSlope() {
    this.input.setDraggable([
      this.slope.interactive.points[1],
      this.slope.interactive.points[2]
    ]);

    this.input.on("dragstart", (pointer, gameObject) => {
      // ...
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;

      gameObject.data.get("vector").set(dragX, dragY);
    });

    this.input.on("dragend", (pointer, gameObject) => {
      // ...
      this.buildSlope();
    });
  }

  buildSlope() {
    this.slope.points = this.slope.curve.getPoints(200);

    this.slope.rects.forEach((rect) => {
      rect && this.matter.world.remove(rect);
    });

    let nextPosition = {};

    // Slope rects
    this.slope.rects = this.slope.points.map(({ x, y }, i) => {
      if (i === this.slope.points.length - 1) return;

      nextPosition.x = this.slope.points[i + 1].x;
      nextPosition.y = this.slope.points[i + 1].y;

      const distance = Phaser.Math.Distance.Between(nextPosition.x, nextPosition.y, x, y);
      const angle = Phaser.Math.Angle.Between(nextPosition.x, nextPosition.y, x, y);

      const rect = this.matter.add.rectangle(x, y, distance, 2, {
        // friction: 0,
        // frictionAir: 0,
        // restitution: 0,
        // ignoreGravity: true,
        // inertia: Infinity,
        angle,
        isStatic: true,
        collisionFilter: { category: this.surface.category }
      });

      // console.log(rect);

      return rect;
    });
  }

  drawGround() {
    this.graphics.beginPath();

    this.graphics.fillStyle(config.GROUND.COLOR);
    this.graphics.lineStyle(8, 'transparent');

    // Stroke slope
    this.slope.curve.draw(this.graphics);

    // Stroke ground
    this.graphics.lineTo(config.WIDTH, config.SLOPE.POINTS.END.y);
    this.graphics.lineTo(config.WIDTH, config.HEIGHT);
    this.graphics.lineTo(0, config.HEIGHT);
    this.graphics.lineTo(0, config.SLOPE.POINTS.START.y);

    this.graphics.closePath();
    this.graphics.fillPath();

    // Draw slope over the ground
    this.graphics.lineStyle(config.SLOPE.LINE.WIDTH, config.SLOPE.COLOR);
    this.slope.curve.draw(this.graphics);
  }

  update() {
    this.graphics.clear();

    this.drawGround();

    // //  Draw t
    // this.slope.curve.getPoint(this.path.t, this.path.vec);
    // // console.log(this.path.vec);
  }
}

export default Play;
