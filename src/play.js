import Phaser from "phaser";

class Play extends Phaser.Scene {
  graphics;
  points;
  curve;
  path;

  preload() {
    // this.load.spritesheet("dragcircle", "assets/sprites/dragcircle.png", {
    //   frameWidth: 16
    // });
    this.load.spritesheet("ball", "assets/ball.png", { frameWidth: 40 });
  }

  create() {
    this.graphics = this.add.graphics();

    this.path = { t: 0, vec: new Phaser.Math.Vector2() };

    console.log(this);
    console.log(this.matter);

    const startPoint = new Phaser.Math.Vector2(100, 100);
    const controlPoint1 = new Phaser.Math.Vector2(220, 40);
    const controlPoint2 = new Phaser.Math.Vector2(510, 470);
    const endPoint = new Phaser.Math.Vector2(900, 350);

    this.curve = {
      instance: new Phaser.Curves.CubicBezier(
        startPoint,
        controlPoint1,
        controlPoint2,
        endPoint
      ),
      category: this.matter.world.nextCategory(),
      points: [],
      rects: []
    };

    console.log(this.curve);

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
      // this.points = this.curve.getSpacedPoints(32);
    });

    this.input.on("dragend", (pointer, gameObject) => {
      if (gameObject.data.get("isControl")) {
        gameObject.setFrame(2);
      } else {
        gameObject.setFrame(0);
      }

      this.buildCurve();
    });

    this.tweens.add({
      targets: this.path,
      t: 1,
      ease: "Sine.easeInOut",
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    this.ball = this.matter.add.image(200, 0, "ball");

    this.ball.setCircle(20);
    this.ball.setFriction(0.005);
    this.ball.setBounce(0.6);
    // this.ball.setVelocityX(1);
    // this.ball.setAngularVelocity(0.15);

    this.buildCurve();
  }

  buildCurve() {
    this.curve.points = this.curve.instance.getPoints(100);

    this.curve.rects.forEach((rect) => {
      rect && this.matter.world.remove(rect);
    });

    let nextPosition = {};

    this.curve.rects = this.curve.points.map(({ x, y }, i) => {
      if (i === this.curve.points.length - 1) return;

      nextPosition.x = this.curve.points[i + 1].x;
      nextPosition.y = this.curve.points[i + 1].y;

      const distance = Phaser.Math.Distance.Between(nextPosition.x, nextPosition.y, x, y);
      const angle = Phaser.Math.Angle.Between(nextPosition.x, nextPosition.y, x, y);

      const rect = this.matter.add.rectangle(x, y, distance, 8, {
        // friction: 0,
        // frictionAir: 0,
        // restitution: 0,
        // ignoreGravity: true,
        // inertia: Infinity,
        angle,
        isStatic: true,
        collisionFilter: { category: this.curve.category },
        render: {
          strokeStyle: '#fff',
          fillStyle: '#fff',
          lineWidth: 2,
        }
      });

      console.log(rect);

      return rect;
    })

    // const options = {
    //   // friction: 0,
    //   // frictionAir: 0,
    //   // restitution: 0,
    //   // ignoreGravity: true,
    //   // inertia: Infinity,
    //   // angle: 0,
    //   isStatic: true,
    //   collisionFilter: { category: this.curve.category }
    // };

    // let nextPosition = {};
    
    // this.curve.points.forEach(({x, y}, i) => {
    //   if (i === this.curve.points.length - 1) return;

    //   nextPosition.x = this.curve.points[i + 1].x;
    //   nextPosition.y = this.curve.points[i + 1].y;

    //   const distance = Phaser.Math.Distance.Between(nextPosition.x, nextPosition.y, x, y);

    //   const angle = Phaser.Math.Angle.Between(nextPosition.x, nextPosition.y, x, y);

    //   const rect = this.curve.rects[i];
    //   console.log(rect);
      
    //   // rect.set('scale', { x: distance, y: 1 });
    //   // rect.set('angle', angle);
    //   // rect.scale(distance, 1);
    //   // rect.setAngle(angle);
    //   // rect.scale = { x: distance, y: 1 };
    //   // rect.vertices[0].x = x;
    //   // rect.vertices[3].x = x;
    //   // rect.vertices[2].x = x + distance;
    //   // rect.vertices[1].x = x + distance;
    //   // rect.angle = angle;
    //   // console.log(rect);

    //   // const rect = this.matter.add.rectangle(x, y, distance, 8, options);
    //   // this.curve.rects.push(rect);
    // });
  }

  update() {
    this.graphics.clear();

    //  Draw the curve through the points
    this.graphics.lineStyle(1, 0xff00ff, 1);

    this.curve.instance.draw(this.graphics);

    //  Draw t
    this.curve.instance.getPoint(this.path.t, this.path.vec);
    // console.log(this.path.vec);

    this.graphics.fillStyle(0xffff00, 1);
    this.graphics.fillCircle(this.path.vec.x, this.path.vec.y, 16);
  }
}

export default Play;
