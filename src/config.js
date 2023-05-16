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
      CONTROL: [
        { x: 294, y: 265 },
        { x: 400, y: 296 },
        // { x: 147, y: 399 },
        // { x: 355, y: 460 },
      ],
      END: { x: 612, y: 360 },
    },
    CONTROL: {
      COLOR: '0xFFFFFF',
      POINT: {
        RADIUS: 12
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