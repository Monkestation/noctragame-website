function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}
function lerpColor(c1, c2, t) {
  const r = c1[0] + (c2[0] - c1[0]) * t;
  const g = c1[1] + (c2[1] - c1[1]) * t;
  const b = c1[2] + (c2[2] - c1[2]) * t;
  return [r, g, b];
}

window.backgroundContext = {
  _startColor: "#000000",
  _endColor: "#000000",
  _gradientAngle: 90,
  _numColors: 5,
  _scale: 4,

  get startColor() {
    return this._startColor;
  },
  set startColor(value) {
    if (typeof value === "string") {
      this._startColor = hexToRgb(value);
    } else this._startColor = value;
    this.redraw();
  },

  get endColor() {
    return this._endColor;
  },
  set endColor(value) {
    if (typeof value === "string") {
      this._endColor = hexToRgb(value);
    } else this._endColor = value;
    this.redraw();
  },

  get gradientAngle() {
    return this._gradientAngle;
  },
  set gradientAngle(value) {
    this._gradientAngle = value;
    this.redraw();
  },

  get numColors() {
    return this._numColors;
  },
  set numColors(value) {
    this._numColors = value;
    this.redraw();
  },

  get scale() {
    return this._scale;
  },

  set scale(value) {
    this._scale = value;
    this.redraw()
  }
};
window.onload = function () {
  const canvas = document.getElementById("backgroundCanvas");
  const ctx = canvas.getContext("2d");
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const matrixSize = bayerMatrix.length;

  function drawDitheredGradient(startColor, endColor, angleDeg, numColors, scale = 4) {
    const internalWidth = Math.floor(canvas.offsetWidth / scale);
    const internalHeight = Math.floor(canvas.offsetHeight / scale);
    canvas.width = internalWidth;
    canvas.height = internalHeight;

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    const palette = [];
    for (let i = 0; i < numColors; i++) {
      const t = i / (numColors - 1);
      palette.push(lerpColor(startColor, endColor, t));
    }

    const angleRad = (angleDeg * Math.PI) / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    const length = Math.max(
      Math.abs(canvas.width * cosAngle),
      Math.abs(canvas.height * sinAngle)
    );

    const ditherThreshold = 1 / (matrixSize * matrixSize);

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const projectedX = (x - canvas.width / 2) * cosAngle;
        const projectedY = (y - canvas.height / 2) * sinAngle;
        const t = (projectedX + projectedY + length / 2) / length;
        const tClamped = Math.min(1, Math.max(0, t));

        const tScaled = tClamped * (numColors - 1);
        const baseIndex = Math.floor(tScaled);

        const remainder = tScaled - baseIndex;

        const threshold =
          bayerMatrix[y % matrixSize][x % matrixSize] * ditherThreshold;

        let finalColor;
        if (remainder > threshold && baseIndex < numColors - 1) {
          finalColor = palette[baseIndex + 1];
        } else {
          finalColor = palette[baseIndex];
        }

        const index = (y * canvas.width + x) * 4;
        data[index + 0] = finalColor[0];
        data[index + 1] = finalColor[1];
        data[index + 2] = finalColor[2];
        data[index + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function redraw() {
    drawDitheredGradient(
      window.backgroundContext.startColor,
      window.backgroundContext.endColor,
      window.backgroundContext.gradientAngle,
      window.backgroundContext.numColors,
      window.backgroundContext.scale
    );
  }

  redraw();

  window.backgroundContext.redraw = redraw;
  window.addEventListener("resize", redraw);
};
