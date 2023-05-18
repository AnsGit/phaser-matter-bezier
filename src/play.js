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

    this.matter.world.autoUpdate = false;

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
          .setData("vector", instance[i === 0 ? 'p2' : 'p1'])
          .setData("type", 'control')
          .setData("index", i);

        // Supporting data
        const data = { control: { offset: null } };

        return { instance, points, data };
      }),
      points: {
        center: this.add.circle(
          this._preset.points.center.x,
          this._preset.points.center.y,
          config.SLOPE.POINT.RADIUS,
          config.SLOPE.CONTROL.COLOR
        )
      },
      lines: {
        control: new Phaser.Curves.Line(
          new Phaser.Math.Vector2(
            this._preset.curves[0].points.control.x,
            this._preset.curves[0].points.control.y
          ),
          new Phaser.Math.Vector2(
            this._preset.curves[1].points.control.x,
            this._preset.curves[1].points.control.y
          )
        )
      },
      // interactive: { points: null },
      ground: null,
      path: [],
      rects: []
    };

    this.slope.points.center
      .setInteractive()
      .setData("vectors", this.slope.curves.map((c, i) => {
        return c.instance[i === 0 ? 'p3' : 'p0'];
      }))
      .setData("type", 'center');

    this.updateSlopeCurvesData();
  }

  resetSlope() {
    this.slope.curves.forEach(({ instance, points }, i) => {
      this._preset.curves[i].points.all.forEach((p, j) => {
        instance[`p${j}`].x = p.x;
        instance[`p${j}`].y = p.y;
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
      .setData("vectors", this.slope.curves.map((c, i) => {
        return c.instance[i === 0 ? 'p3' : 'p0'];
      }));
    
    this._preset.curves.forEach((cProps, i) => {
      this.slope.lines.control[`p${i}`].x = cProps.points.control.x;
      this.slope.lines.control[`p${i}`].y = cProps.points.control.y;
    });

    this.buildSlope();
  }

  updateSlopeCurvesData() {
    this.slope.curves.forEach((c) => {
      // Update info about offset from curve's control point to slope's center point
      c.data.control.offset = {
        x: c.points.control.x - this.slope.points.center.x,
        y: c.points.control.y - this.slope.points.center.y,
      };
    });
  }

  buildSlope() {
    // 1 WAY
    const { POINTS } = config.SLOPE;

    const Body = Phaser.Physics.Matter.Matter.Body;
    const Bodies = Phaser.Physics.Matter.Matter.Bodies;

    this.slope.path = [
      ...this.slope.curves[0].instance.getPoints(POINTS.COUNT/2),
      ...this.slope.curves[1].instance.getPoints(POINTS.COUNT/2).slice(1)
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
      // y: config.HEIGHT - this.slope.ground.bounds.max.y + (config.HEIGHT - POINTS.START.y),
    });

    this.matter.world.add(this.slope.ground)

    return;
    

    // 2 WAY
    this.slope.path = [
      ...this.slope.curves[0].instance.getPoints(32),
      ...this.slope.curves[1].instance.getPoints(32).slice(1)
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

  // Build points positions based on drag area bounds
  buildPoints(type, model) {
    const { DRAG } = config.SLOPE;

    let offset;

    this.slope.curves.forEach((c, i) => {
      // Fix current curve point position
      let p = model.control[i];

      if (type === 'center') {
        // Save offset before control point position change
        offset = {
          x: p.x - model.center.x,
          y: p.y - model.center.y
        };
      }

      let isCorrect = true;

      // Check if object was dragged out of the drag area
      if (p.x < DRAG.AREA.MIN.x) { 
        p.x = DRAG.AREA.MIN.x;
        isCorrect = false;
      };

      if (p.x > DRAG.AREA.MAX.x) { 
        p.x = DRAG.AREA.MAX.x;
        isCorrect = false;
      };

      if (p.y < DRAG.AREA.MIN.y) { 
        p.y = DRAG.AREA.MIN.y;
        isCorrect = false;
      };

      if (p.y > DRAG.AREA.MAX.y) { 
        p.y = DRAG.AREA.MAX.y;
        isCorrect = false;
      };
      
      // If need to fix position
      if (!isCorrect) {
        if (type === 'center') {
          // Fix center point position
          model.center.x = p.x - offset.x;
          model.center.y = p.y - offset.y;
        }

        if (type === 'control') {
          // Calculate offset after control point position change
          offset = {
            x: p.x - model.center.x,
            y: p.y - model.center.y
          };
        }

        // Fix opposite curve point position
        const opCurveIndex = (i + 1) % 2;

        model.control[opCurveIndex].x = model.center.x - offset.x;
        model.control[opCurveIndex].y = model.center.y - offset.y;
      }
    });

    // Fix control points positions
    this.slope.curves.forEach((c, i) => {
      const p = c.points.control;

      p.x = model.control[i].x;
      p.y = model.control[i].y;

      p.data.get("vector").set(p.x, p.y);
    });

    // fix center point position
    const centerPoint = this.slope.points.center;

    centerPoint.x = model.center.x;
    centerPoint.y = model.center.y;

    centerPoint.data.get("vectors").forEach( v => v.set(centerPoint.x, centerPoint.y) );
    
    // Fix control line position
    this.slope.curves.forEach((c, i) => {
      this.slope.lines.control[`p${i}`].x = c.points.control.x;
      this.slope.lines.control[`p${i}`].y = c.points.control.y;
    });;
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
    const { DRAG } = config.SLOPE;
    const { curves } = this.slope;

    this.input.setDraggable([
      ...this.slope.curves.map( c => c.points.control ),
      this.slope.points.center
    ]);

    this.input.on("dragstart", (pointer, gameObject) => {
      this.disableButtons();
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      const type = gameObject.data.get("type");

      const model = { center: {}, control: [ {}, {} ] };

      if (type === 'center') {
        model.center.x = dragX;
        model.center.y = dragY;

        // Move control points towards center point
        curves.forEach((c, i) => {
          model.control[i].x = dragX + c.data.control.offset.x;
          model.control[i].y = dragY + c.data.control.offset.y;
        });
      }
      else {
        model.center.x = this.slope.points.center.x;
        model.center.y = this.slope.points.center.y;

        const i = gameObject.data.get("index");

        if (i === 0) {
          if (dragX > model.center.x) dragX = model.center.x;
        }
        else {
          if (dragX < model.center.x) dragX = model.center.x;
        }

        // Change position of dragged point
        model.control[i].x = dragX;
        model.control[i].y = dragY;
        
        // Move the opposite control point to match the control point being dragged
        const offset = {
          x: dragX - model.center.x,
          y: dragY - model.center.y
        };

        const opCurveIndex = (i + 1) % 2;

        model.control[opCurveIndex].x = model.center.x - offset.x;
        model.control[opCurveIndex].y = model.center.y - offset.y;
      }

      this.buildPoints(type, model);

      this.build();
    });

    this.input.on("dragend", (pointer, gameObject) => {
      this.enableButtons();
      this.updateSlopeCurvesData();
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
    this.drawSlope();

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

  drawControlLine() {
    this.graphics.lineStyle(config.SLOPE.CONTROL.LINE.WIDTH, config.SLOPE.CONTROL.COLOR);
    this.slope.lines.control.draw(this.graphics);
  }

  draw() {
    this.graphics.clear();

    this.drawGround();
    this.drawControlLine();
  }

  update(time, delta) {
    this.draw();

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

      this.draw();

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
