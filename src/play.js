import Phaser from "phaser";
import _ from "underscore";
import $ from "jquery";

import config from "./config.js";

class Play extends Phaser.Scene {
  graphics;

  preload() {
    this.load.image("ball", require("../assets/ball.png"), 40, 40);
  }

  _preset() {
    const { POINTS, CONTROL } = config.SLOPE;

    // Temp line
    const line = new Phaser.Geom.Line(
      POINTS.START.x, POINTS.START.y,
      POINTS.END.x, POINTS.END.y
    );

    this._preset = {};

    // Default center point
    this._preset.points = {
      center: line.getPoint(0.5),
    };

    // Default curves points
    this._preset.curves = [['START', -1], ['END', 1]].map(([type, direction], i) => {
      let points = {};

      points.control = line.getPoint(0.5 + CONTROL.POINT.OFFSET * direction);
      
      if (i === 0) {
        points.all = [
            // Start point
          new Phaser.Math.Vector2(POINTS[type].x, POINTS[type].y),
          // Control point 0 (fixed)
          new Phaser.Math.Vector2(POINTS[type].x, POINTS[type].y),
          // Control point 1 (draggable)
          new Phaser.Math.Vector2(points.control.x, points.control.y),
          // End point
          new Phaser.Math.Vector2(this._preset.points.center.x, this._preset.points.center.y)
        ];

        points.extreme = points.all[0];
      }
      else {
        points.all = [
          // Start point
          new Phaser.Math.Vector2(this._preset.points.center.x, this._preset.points.center.y),
          // Control point 0 (draggable)
          new Phaser.Math.Vector2(points.control.x, points.control.y),
          // Control point 1 (fixed)
          new Phaser.Math.Vector2(POINTS[type].x, POINTS[type].y),
          // End point
          new Phaser.Math.Vector2(POINTS[type].x, POINTS[type].y),
        ];

        points.extreme = points.all[3];
      }

      return { points };
    });

    // Remove temp line
    this.matter.world.remove(line);
  }

  create() {
    this._preset();

    this.parent = $(`#${this.registry.parent.config.parent}`);

    this.matter.world.setBounds(0, 0, config.WIDTH, config.HEIGHT, 50, true, true, true, true);
    this.matter.world.setGravity(0, 1);

    // this.matter.world.runner.isFixed = true;
    this.matter.world.autoUpdate = false;
    // this.acc = 0;

    // console.log(Phaser);
    // console.log(this.matter);
    // console.log(this.matter.systems.cache.game);
    // console.log(this.matter.systems.cache.game.config);
    // console.log(this.matter.systems.cache.game.config.seed);
    // console.log(Phaser.Physics.Matter);
    // console.log(Phaser.Physics.Matter.Matter.Common);
    // Phaser.Physics.Matter.Matter.Common._seed = 12345678;

    this.graphics = this.add.graphics();

    this.createSlope();
    this.createBall();

    this.createCounters();
    this.createButtons();

    this.build();
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

  createSlope() {
    this.slope = {
      curves: _.range(2).map((i) => {
        const instance = new Phaser.Curves.CubicBezier(
          ...this._preset.curves[i].points.all.map((p) => {
            return new Phaser.Math.Vector2(p.x, p.y);
          })
        );
        
        // Visible points
        const points = {
          extreme: this.add.circle(
            this._preset.curves[i].points.extreme.x,
            this._preset.curves[i].points.extreme.y,
            config.SLOPE.POINT.RADIUS,
            config.SLOPE.COLOR
          ),
          control: this.add.circle(
            this._preset.curves[i].points.control.x,
            this._preset.curves[i].points.control.y,
            config.SLOPE.CONTROL.POINT.RADIUS,
            config.SLOPE.CONTROL.COLOR
          )
        };

        points.control
          .setInteractive()
          .setData("vector", instance[i === 0 ? 'p2' : 'p1']);

        return { instance, points };
      }),
      points: {
        center: this.add.circle(
          this._preset.points.center.x,
          this._preset.points.center.y,
          config.SLOPE.CONTROL.POINT.RADIUS,
          config.SLOPE.CONTROL.COLOR
        )
      },
      // interactive: { points: null },
      ground: null,
      path: [],
      rects: []
    };

    this.slope.points.center
      .setInteractive()
      .setData("vector", this.slope.curves.map((c, i) => {
        return c.instance[i === 0 ? 'p3' : 'p0'];
      }));

    console.log(this.slope.curves[0].instance);
    console.log(this.slope.curves[1].instance);

    // this.slope.interactive.points = _.range(4).map((i) => {
    //   const basePoint = this.slope.curve[`p${i}`];
    //   const { x, y } = basePoint;

    //   const isControl = [1, 2].includes(i);

    //   let color, radius;

    //   if (isControl) {
    //     color = config.SLOPE.CONTROL.COLOR;
    //     radius = config.SLOPE.CONTROL.POINT.RADIUS;
    //   }
    //   else {
    //     color = config.SLOPE.COLOR;
    //     radius = config.SLOPE.POINT.RADIUS;
    //   }

    //   const point = this.add
    //     .circle(x, y, radius, color)
    //     .setData("vector", basePoint)
    //     .setInteractive();

    //   return point;
    // });

    // console.log(this.slope.curve.getTangent(0.5));
    // console.log(this.slope.curve.getPoint(0.5));
    // getTangent(t [, out])

    // const line = new Phaser.Curves.Line(
    //   new Phaser.Math.Vector2(POINTS.START.x, POINTS.START.y),
    //   new Phaser.Math.Vector2(POINTS.END.x, POINTS.END.y)
    // );

    // console.log(line.getPoint(0.4));
    // console.log(line.getPoint(0.6));
  }

  resetSlope() {
    this.slope.curves.forEach(({ instance, points }, i) => {
      this._preset.curves[i].points.all.forEach((p, j) => {
        instance[`p${j}`] = new Phaser.Math.Vector2(p.x, p.y);
      });

      points.extreme.setPosition(
        this._preset.curves[i].points.extreme.x,
        this._preset.curves[i].points.extreme.y,
      );
      
      points.control.setPosition(
        this._preset.curves[i].points.control.x,
        this._preset.curves[i].points.control.y,
      );

      points.control.setData("vector", instance[i === 0 ? 'p2' : 'p1']);
    });

    this.slope.points.center
      .setPosition(
        this._preset.points.center.x,
        this._preset.points.center.y,
      )
      .setData("vector", this.slope.curves.map((c, i) => {
        return c.instance[i === 0 ? 'p3' : 'p0'];
      }));

    this.buildSlope();
  }

  buildSlope() {
    // 1 WAY
    const { POINTS } = config.SLOPE;

    const Body = Phaser.Physics.Matter.Matter.Body;
    const Bodies = Phaser.Physics.Matter.Matter.Bodies;

    this.slope.path = [
      ...this.slope.curves[0].instance.getPoints(32),
      ...this.slope.curves[1].instance.getPoints(32)
    ];
    
    this.slope.ground && this.matter.world.remove(this.slope.ground);

    this.slope.ground = Bodies.fromVertices(
      config.WIDTH - 0,
      config.HEIGHT - POINTS.START.y,
      [
        new Phaser.Math.Vector2(0, config.HEIGHT),
        new Phaser.Math.Vector2(0, POINTS.START.y),
        ...this.slope.path,
        new Phaser.Math.Vector2(config.WIDTH, POINTS.END.y),
        new Phaser.Math.Vector2(config.WIDTH, config.HEIGHT)
      ],
      { isStatic: true },
      true
    );

    Body.setPosition(this.slope.ground, {
      x: config.WIDTH - this.slope.ground.bounds.min.x,
      y: POINTS.START.y + (config.HEIGHT - POINTS.START.y) - this.slope.ground.bounds.max.y + (config.HEIGHT - POINTS.START.y),
      y: config.HEIGHT - this.slope.ground.bounds.max.y + (config.HEIGHT - POINTS.START.y),
    });

    this.matter.world.add(this.slope.ground)

    return;
    

    // 2 WAY
    this.slope.path = [
      ...this.slope.curves[0].instance.getPoints(32),
      ...this.slope.curves[1].instance.getPoints(32)
    ];

    this.slope.rects.forEach((rect) => {
      rect && this.matter.world.remove(rect);
    });

    let nextPosition = {};

    // Slope rects
    this.slope.rects = this.slope.path.map(({ x, y }, i) => {
      if (i === this.slope.path.length - 1) return;

      nextPosition.x = this.slope.path[i + 1].x;
      nextPosition.y = this.slope.path[i + 1].y;

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

      // rect.density = 0
      // rect.friction = 0.11
      // rect.frictionStatic = 0
      // rect.inertia = 1000
      // rect.inverseInertia = 100000

      // console.log(rect);

      return rect;
    });
  }

  createBall() {
    this.ball = this.matter.add.image(0, 0, "ball", 1);
    // console.log(this.ball);

    this.ball.setCircle(config.BALL.SIZE);
    // this.ball.setSlop(20);
    this.ball.setFriction(0.16);
    this.ball.setFrictionAir(0.0001);
    this.ball.setBounce(0.9);
    // this.ball.setInertia(1000);
    this.ball.setMass(0.1);
    this.ball.setDensity(0.0000008);
    this.ball.setVelocityX(1);

    // const body = this.ball.body;
    // this.matter.body.setInertia(body, 0.1);

    this.ball.setStatic(true);
  }

  resetBall() {
    this.buildBall();
    this.ball.setStatic(true);
  }

  buildBall() {
    const [ p0, p1 ] = this.slope.path.slice(0, 2);

    // const p0 = this.slope.curve.getPoint(0.05);
    // const p1 = this.slope.curve.getPoint(0.06);

    const angle = Phaser.Math.Angle.Between(p0.x, p0.y, p1.x, p1.y);

    const x = p0.x + config.BALL.SIZE * Math.sin(angle);
    const y = p0.y - config.BALL.SIZE * Math.cos(angle);

    this.ball.setPosition(x, y);
  }

  createCounters() {
    this.counters = {
      view: $('<div>', { class: 'counters' }),
      best: {
        view: $('<div>', { class: 'counter best hidden' }),
        title: $('<div>', { class: 'title', text: 'лучшее время' }),
        value: $('<div>', { class: 'value', text: '0.00' }),
        timestamp: { initial: null, current: null },
        duration: 0,
        timeout: null
      },
      current: {
        view: $('<div>', { class: 'counter current' }),
        title: $('<div>', { class: 'title', text: 'текущее время' }),
        value: $('<div>', { class: 'value', text: '0.00' }),
        timestamp: { initial: null, current: null },
        duration: 0,
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
    
    counter.duration = (timestamp.current - timestamp.initial)/1000;
    
    counter.timestamp = timestamp;
    counter.value.text(counter.duration.toFixed(2));
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
    counter.duration = 0;

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

  disableButtons() {
    this.buttons.view.addClass('disabled');
  }

  enableButtons() {
    this.buttons.view.removeClass('disabled');
  }

  reset() {
    this.runnning = false;

    // this.resetSlope();
    this.resetBall();

    this.resetCounter('current');
    
    this.buttons.reset.view.addClass('disabled');
    this.buttons.run.view.removeClass('disabled');
    this.input.enabled = true;
  }

  run() {
    // console.log(this.matter.systems.cache.game.config.seed)
    this.runnning = true;
    this.finished = false;

    this.runCounter('current');

    this.buttons.reset.view.addClass('disabled');
    this.buttons.run.view.addClass('disabled');
    this.input.enabled = false;

    this.ball.setStatic(false);
    // this.ball.setVelocityY(5);
    // this.ball.setAngularVelocity(0.1);

    // let i = 0;
    // this.ball.setOnCollideEnd((...args) => {
    //   // console.log(args);
    //   console.log(i++);
    //   // console.log(this.ball.body.angularSpeed);
    // })

    // let i = 0;
    // this.ball.setSleepEndEvent((...args) => {
    //   // console.log(args);
    //   console.log(i++);
    // })
    
    this.buttons.reset.view.removeClass('disabled');
    // console.log('STOPED');
  }

  stop() {
    this.finished = true;

    this.stopCounter('current');

    const isNewBestResult = (
      !this.saved ||
      (this.counters.current.duration < this.counters.best.duration)
    );

    if (isNewBestResult) {
      this.saved = true;
      this.updateCounter('best', this.counters.current.timestamp);
    }

    this.counters.best.view.removeClass('hidden');
  }

  build() {
    this.buildSlope();
    this.buildBall();
  }

  subscribeButtons() {
    // RESET SLOPE AND BALL
    this.buttons.reset.view.on('click', (e) => {
      // console.log('RESETED');

      this.reset();
    });

    // RUN BALL
    this.buttons.run.view.on('click', (e) => {
      // console.log('STARTED');

      this.run();
    });
  }

  subscribeSlope() {
    this.input.setDraggable([
      ...this.slope.curves.map( c => c.points.control ),
      this.slope.points.center
    ]);

    this.input.on("dragstart", (pointer, gameObject) => {
      this.disableButtons();
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      if (dragX < 110) dragX = 110;
      if (dragX > 585) dragX = 585;
      if (dragY < 90) dragY = 90;
      if (dragY > 470) dragY = 470;
      
      gameObject.x = dragX;
      gameObject.y = dragY;

      const vector = [].concat( gameObject.data.get("vector") );

      vector.forEach( v => v.set(dragX, dragY) );

      this.build();
    });

    this.input.on("dragend", (pointer, gameObject) => {
      this.enableButtons();
      // this.build();
    });
  }

  subscribe() {
    this.subscribeSlope();
    this.subscribeButtons();
  }

  drawSlope() {
    this.graphics.moveTo(this.slope.path[0].x, this.slope.path[1].y);

    for (var i = 1; i < this.slope.path.length; i++) {
      this.graphics.lineTo(this.slope.path[i].x, this.slope.path[i].y);
    }
  }

  drawGround() {
    this.graphics.beginPath();

    this.graphics.fillStyle(config.GROUND.COLOR);
    this.graphics.lineStyle(8, 'transparent');

    // Stroke slope
    this.drawSlope()

    // Stroke ground
    this.graphics.lineTo(config.WIDTH, config.SLOPE.POINTS.END.y);
    this.graphics.lineTo(config.WIDTH, config.HEIGHT);
    this.graphics.lineTo(0, config.HEIGHT);
    this.graphics.lineTo(0, config.SLOPE.POINTS.START.y);

    this.graphics.closePath();
    this.graphics.fillPath();

    // Draw slope over the ground
    this.graphics.lineStyle(config.SLOPE.LINE.WIDTH, config.SLOPE.COLOR);
    this.slope.curves.forEach( c =>  c.instance.draw(this.graphics) );
  }

  update(time, delta) {
    this.graphics.clear();

    this.drawGround();

    if (this.runnning && !this.finished) {
      (this.ball.x > config.SLOPE.POINTS.END.x) && this.stop();
    }

    this.matter.world.step(delta);

    return;

    // Check it if needing in fps limitation
    this.acc += delta;
    while(this.acc >= 16.66) {
      this.acc -= 16.66;

      this.graphics.clear();

      this.drawGround();

      if (this.runnning && !this.finished) {
        (this.ball.x > config.SLOPE.POINTS.END.x) && this.stop();
      }

      this.matter.world.step(16.66);
    }
  }

  disable() {
    this.parent.addClass('disabled');
  }

  enable() {
    this.parent.removeClass('disabled');
  }
}

export default Play;
