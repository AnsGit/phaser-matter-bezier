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
        { x: 147, y: 399 },
        { x: 355, y: 460 },
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
    x: 82,
    y: 160
  }
};

export default config;