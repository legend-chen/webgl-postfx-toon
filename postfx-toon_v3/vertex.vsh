#version 300 es

in vec2 position;

void main()
{
    gl_Position = vec4(position, 1.0f, 1.0f);
}