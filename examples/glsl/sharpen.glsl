uniform lowp float strength;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float dx = strength / resolution.x;
  float dy = strength / resolution.y;
  vec4 sum = vec4(0.0);
  sum += -1. * texture2D(inputBuffer, uv + vec2( -1.0 * dx , 0.0 * dy));
  sum += -1. * texture2D(inputBuffer, uv + vec2( 0.0 * dx , -1.0 * dy));
  sum += 5. * texture2D(inputBuffer, uv + vec2( 0.0 * dx , 0.0 * dy));
  sum += -1. * texture2D(inputBuffer, uv + vec2( 0.0 * dx , 1.0 * dy));
  sum += -1. * texture2D(inputBuffer, uv + vec2( 1.0 * dx , 0.0 * dy));

  outputColor = sum;
}