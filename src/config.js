const config = {
  WIDTH: 1024,
  HEIGHT: 512,
  BACKGROUND_COLOR: '0xC2EDFF',
  SLOPE: {
    COLOR: '0xBF81F0',
    POINT: {
      RADIUS: 12
    },
    LINE: {
      WIDTH: 8
    },
    POINTS: {
      START: { x: 82, y: 200 },
      END: { x: 612, y: 360 },
      COUNT: 60
    },
    CONTROL: {
      COLOR: '0xFFFFFF',
      POINT: {
        RADIUS: 8,
        OFFSET: 0.1
      },
      LINE: {
        WIDTH: 2
      }
    },
    DRAG: {
      AREA: {
        MIN: { x: 85, y: 84 },
        MAX: { x: 585, y: 470 },
      }
    }
  },
  GROUND: {
    COLOR: '0x320E3F'
  },
  BALL: {
    SIZE: 20,
    x: 103,
    y: 200,
  }
};

export default config;