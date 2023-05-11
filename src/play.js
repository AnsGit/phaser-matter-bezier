import Phaser from "phaser";
import _ from "underscore";
import $ from "jquery";

import config from "./config.js";

class Play extends Phaser.Scene {
  graphics;

  preload() {
    this.load.image("ball", require("../assets/ball.png"), 40, 40);
  }

  create() {
    this.parent = $(`#${this.registry.parent.config.parent}`);

    this.matter.world.setBounds(0, 0, config.WIDTH, config.HEIGHT, 40, true, true, true, true);
    this.matter.world.setGravity(0, 2);

    this.graphics = this.add.graphics();

    this.createSurface();
    this.createPlain();

    this.createSlope();
    this.createBall();

    this.createCounters();
    this.createButtons();

    this.buildSlope();
    this.subscribe();


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
          config.SLOPE.POINTS.START.y + 20,
          config.SLOPE.POINTS.START.x,
          40,
          {
            isStatic: true,
            collisionFilter: { category: this.surface.category }
          }
        ),
        // Right part
        this.matter.add.rectangle(
          config.SLOPE.POINTS.END.x + (config.WIDTH - config.SLOPE.POINTS.END.x)/2,
          config.SLOPE.POINTS.END.y + 20,
          config.WIDTH - config.SLOPE.POINTS.END.x,
          40,
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

  resetSlope() {
    const { POINTS } = config.SLOPE;

    this.slope.curve.p0 = new Phaser.Math.Vector2(POINTS.START.x, POINTS.START.y);
    this.slope.curve.p1 = new Phaser.Math.Vector2(POINTS.CONTROL[0].x, POINTS.CONTROL[0].y);
    this.slope.curve.p2 = new Phaser.Math.Vector2(POINTS.CONTROL[1].x, POINTS.CONTROL[1].y);
    this.slope.curve.p3 = new Phaser.Math.Vector2(POINTS.END.x, POINTS.END.y);

    this.slope.interactive.points.forEach((point, i) => {
      const basePoint = this.slope.curve[`p${i}`];
      const { x, y } = basePoint;

      point.setPosition(x, y);
      point.setData("vector", basePoint)
    });

    this.buildSlope();
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

    this.ball.setStatic(true);
  }

  resetBall() {
    this.ball.setPosition(config.BALL.x, config.BALL.y);
    this.ball.setStatic(true);
  }

  createCounters() {
    this.counters = {
      view: $('<div>', { class: 'counters' }),
      best: {
        view: $('<div>', { class: 'counter best hidden' }),
        title: $('<div>', { class: 'title', text: 'лучшее время' }),
        value: $('<div>', { class: 'value', text: '0.00' }),
        timestamp: { initial: null, current: null },
        timeout: null
      },
      current: {
        view: $('<div>', { class: 'counter current' }),
        title: $('<div>', { class: 'title', text: 'текущее время' }),
        value: $('<div>', { class: 'value', text: '0.00' }),
        timestamp: { initial: null, current: null },
        timeout: null
      }
    };

    this.counters.view.append(
      this.counters.best.view.append(
        this.counters.best.title,
        this.counters.best.value
      ),
      this.counters.current.view.append(
        this.counters.current.title,
        this.counters.current.value
      ),
    );

    this.parent.append(this.counters.view);
  }

  runCounter(type = 'current') {
    const counter = this.counters[type];

    counter.timestamp.initial = new Date().getTime();

    counter.interval = setInterval(() => {
      counter.timestamp.current = new Date().getTime();
      this.updateCounter(type);
    }, 10);
  }

  updateCounter(type = 'current', timestamp = null) {
    const counter = this.counters[type];

    if (timestamp === null) {
      timestamp = counter.timestamp; 
    }
    
    const duration = (timestamp.current - timestamp.initial)/1000;
    
    counter.timestamp = timestamp;
    counter.value.text(duration.toFixed(2));
  }

  stopCounter(type = 'current') {
    const counter = this.counters[type];

    clearInterval(counter.interval);

    counter.timestamp.current = new Date().getTime();
    this.updateCounter(type);
  }

  resetCounter(type = 'current') {
    const counter = this.counters[type];

    clearInterval(counter.interval);

    counter.timestamp.initial = 0;
    counter.timestamp.current = 0;
    this.updateCounter(type);
  }

  createButtons() {
    this.buttons = {
      view: $('<div>', { class: 'buttons' }),
      reset: {
        view: $('<div>', { class: 'button reset disabled' })
      },
      run: {
        view: $('<div>', { class: 'button run', text: 'запустить мяч' })
      }
    };

    this.buttons.view.append(
      this.buttons.reset.view,
      this.buttons.run.view
    );

    this.parent.append(this.buttons.view);
  }

  subscribeButtons() {
    // RESET SLOPE AND BALL
    this.buttons.reset.view.on('click', (e) => {
      console.log('RESETED');

      this.resetSlope();
      this.resetBall();

      this.resetCounter('current');
      
      this.buttons.reset.view.addClass('disabled');
      this.buttons.run.view.removeClass('disabled');
      this.input.enabled = true;
    });

    // RUN BALL
    this.buttons.run.view.on('click', (e) => {
      console.log('STARTED');

      this.runCounter('current');

      this.buttons.reset.view.addClass('disabled');
      this.buttons.run.view.addClass('disabled');
      this.input.enabled = false;

      this.ball.setStatic(false);
      
      this.buttons.reset.view.removeClass('disabled');
      console.log('STOPED');
    });
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

  subscribe() {
    this.subscribeSlope();
    this.subscribeButtons();
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

  disable() {
    this.parent.addClass('disabled');
  }

  enable() {
    this.parent.removeClass('disabled');
  }
}

export default Play;
