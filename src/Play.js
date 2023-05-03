import Phaser from "phaser";

class Play extends Phaser.Scene {
  graphics;
  points;
  curve;
  path;

  preload() {
    this.load.spritesheet("dragcircle", "assets/sprites/dragcircle.png", {
      frameWidth: 16
    });
    this.load.spritesheet("ball", "assets/ball.png", { frameWidth: 40 });
  }

  create() {
    this.graphics = this.add.graphics();

    this.path = { t: 0, vec: new Phaser.Math.Vector2() };

    console.log(console.log(this.matter));

    const startPoint = new Phaser.Math.Vector2(0, 260);
    const controlPoint1 = new Phaser.Math.Vector2(610, 25);
    const controlPoint2 = new Phaser.Math.Vector2(320, 370);
    const endPoint = new Phaser.Math.Vector2(735, 260);

    this.curve = new Phaser.Curves.CubicBezier(
      startPoint,
      controlPoint1,
      controlPoint2,
      endPoint
    );
    //this.curve.setStatic(true);
    console.log(this.curve);
    console.log(this.curve.setStatic);
    console.log(this.curve.getSpacedPoints);

    this.points = this.curve.getSpacedPoints(32);

    const point0 = this.add
      .image(startPoint.x, startPoint.y, "dragcircle", 0)
      .setInteractive();
    const point1 = this.add
      .image(endPoint.x, endPoint.y, "dragcircle", 0)
      .setInteractive();
    const point2 = this.add
      .image(controlPoint1.x, controlPoint1.y, "dragcircle", 2)
      .setInteractive();
    const point3 = this.add
      .image(controlPoint2.x, controlPoint2.y, "dragcircle", 2)
      .setInteractive();

    point0.setData("vector", startPoint);
    point1.setData("vector", endPoint);
    point2.setData("vector", controlPoint1);
    point3.setData("vector", controlPoint2);

    point0.setData("isControl", false);
    point1.setData("isControl", false);
    point2.setData("isControl", true);
    point3.setData("isControl", true);

    this.input.setDraggable([point0, point1, point2, point3]);

    this.input.on("dragstart", (pointer, gameObject) => {
      gameObject.setFrame(1);
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;

      gameObject.data.get("vector").set(dragX, dragY);

      //  Get 32 points equally spaced out along the curve
      this.points = this.curve.getSpacedPoints(32);
    });

    this.input.on("dragend", (pointer, gameObject) => {
      if (gameObject.data.get("isControl")) {
        gameObject.setFrame(2);
      } else {
        gameObject.setFrame(0);
      }
    });

    this.tweens.add({
      targets: this.path,
      t: 1,
      ease: "Sine.easeInOut",
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    //const curve = this.add.curve(1400, 1400, this.curve, 0xb5651d);
    //this.matter.add.gameObject(this.curve);
    //console.log(this.curve)
    //this.curve.setStatic(true);

    this.terrain = this.matter.add.fromVertices(
      0,
      0,
      this.curve.getPoints(),
      {
        isStatic: true,
        render: {
          fillStyle: "#fff",
          strokeStyle: "#000",
          lineWidth: 5
        }
      },
      true
    );

    this.ball = this.matter.add.image(100, 0, "ball");
    //this.ball = this.matter.add.circle(50, 0, 50, { fillStyle: '#fff', density: 0.005 });
    //this.ball = this.matter.bodies.circle(50, 0, 50, { fillStyle: '#fff', density: 0.005 });
    console.log(this.ball);

    /*
      this.ball.friction = 0.005;
      // this.ball.setBounce(0.6);
      this.ball.velocity.x = 1;
      this.ball.angularVelocity = 0.15;
      */

    this.ball.setCircle();
    this.ball.setFriction(0.005);
    this.ball.setBounce(0.6);
    this.ball.setVelocityX(1);
    this.ball.setAngularVelocity(0.15);
  }

  update() {
    this.graphics.clear();

    //  Draw the curve through the points
    this.graphics.lineStyle(1, 0xff00ff, 1);

    this.curve.draw(this.graphics);

    //  Draw t
    this.curve.getPoint(this.path.t, this.path.vec);

    this.graphics.fillStyle(0xffff00, 1);
    this.graphics.fillCircle(this.path.vec.x, this.path.vec.y, 16);
  }
}

export default Play;
