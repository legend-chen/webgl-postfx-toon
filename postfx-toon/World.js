/**
 * Created by legend on 16/12/7.
 */
/*
 * Copyright (C) 2012 Legend Chen.  All rights reserved.
 */
// 2016-12-18 webgl

function create_shader(source, type)
{
    // 用来保存着色器的变量
    var shader = gl.createShader(type);
    
    // 将标签中的代码分配给生成的着色器
    gl.shaderSource(shader, source);

    // 编译着色器
    gl.compileShader(shader);

    // 判断一下着色器是否编译成功
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        // 编译成功，则返回着色器
        return shader;
    }
    else
    {

    // 编译失败，弹出错误消息
        console.warn(gl.getShaderInfoLog(shader));
    }
}

function create_program(vs, fs)
{
    // 程序对象的生成  
    var program = gl.createProgram();

    // 向程序对象里分配着色器  
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    // 将着色器连接  
    gl.linkProgram(program);

    // 判断着色器的连接是否成功  
    if (gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        // 成功的话，将程序对象设置为有效  
        gl.useProgram(program);

        // 返回程序对象
        return program;
    }
    else
    {
        // 如果失败，弹出错误信息  
        alert(gl.getProgramInfoLog(program));
    }
}

function create_vbo(data)
{
    // 生成缓存对象  
    var vbo = gl.createBuffer();

    // 绑定缓存  
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    // 向缓存中写入数据  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    // 将绑定的缓存设为无效  
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // 返回生成的VBO  
    return vbo;
}

function requestShader(url, callback)
{
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onload = function ()
    {
        callback(this.response)
    }
    
    xhr.onerror = function ()
    {
        console.error("Failed to load " + url);
    }
    
    xhr.send();
}

function requestImage(url, callback)
{
    var img = new Image();
    img.src = url;

    img.onload = function ()
    {
        callback(img);
        img.onload = null;
    }
}

function Sequence (callback)
{
    var _this = this; 

    _this._count = 0;
    _this._length = 0;
    _this._results = [];
    _this._callback = callback;
}

var _proto_ = Sequence.prototype;

_proto_._addSource = function(name)
{
    var _this = this;

    var index = _this._length++;

    function onLoaded(result)
    {
         _this._results[index] = result;
        (++_this._count == _this._length) && _this._callback.apply(null, _this._results);

    }
    var ext = name.slice(-3);
    if (ext == "jpg" || ext == "png") requestImage (name, onLoaded);
    else requestShader (name, onLoaded)
};

var loader = new Sequence(onResourcesReady);
    loader._addSource("vertex.glsl");
    loader._addSource("webgl_postfx_toon.glsl");
    loader._addSource("flexible_keyboard.jpg");

    var gl;
    var program1;
    var mVBO_Tri;
    var origintexture;

    function onResourcesReady(base0, base1, image)
    {
    	stageWidth = document.body.offsetWidth; //image.width;
    	stageHeight = document.body.offsetHeight; //image.height;
    	
        var canvas = document.createElement("canvas");
        canvas.width = stageWidth;
        canvas.height = stageHeight;
        document.body.appendChild(canvas);
        
        gl = canvas.getContext("webgl");

        // 设定canvas初始化的颜色  
        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        var mFloat32Textures  = gl.getExtension( 'OES_texture_float' );
        var mFloat32Filter    = gl.getExtension( 'OES_texture_float_linear');
        var mFloat16Textures  = gl.getExtension( 'OES_texture_half_float' );
        var mFloat16Filter    = gl.getExtension( 'OES_texture_half_float_linear' );
        var mDerivatives      = gl.getExtension( 'OES_standard_derivatives' );
        var mDrawBuffers      = gl.getExtension( 'WEBGL_draw_buffers' );
        var mDepthTextures    = gl.getExtension( 'WEBGL_depth_texture' );
        var mShaderTextureLOD = gl.getExtension( 'EXT_shader_texture_lod' );

        var h0 = "#extension GL_OES_standard_derivatives : enable\n\
#extension GL_EXT_shader_texture_lod : enable\n";
        
        var h1 = "#ifdef GL_ES\nprecision highp float;\n#endif\n";
        var h2 = "#ifdef GL_ES\nprecision mediump float;\n#endif\n";
        var h3 = "#ifdef GL_ES\nprecision lowp float;\n#endif\n";
        
        var vs = create_shader(base0, gl.VERTEX_SHADER);
        var fs = create_shader(base1, gl.FRAGMENT_SHADER);
            
        program1 = create_program(vs, fs);
        origintexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, origintexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, origintexture);

        gl.useProgram(program1);

        var uniform;
        uniform = gl.getUniformLocation(program1, "tex0_size");
        gl.uniform2f(uniform, image.width, image.height);

        uniform = gl.getUniformLocation(program1, "HueLevels");
        gl.uniform1fv(uniform, [0.0,140.0,160.0,240.0,240.0,360.0]);

        uniform = gl.getUniformLocation(program1, "SatLevels");
        gl.uniform1fv(uniform, [0.0,0.15,0.3,0.45,0.6,0.8,1.0]);

        uniform = gl.getUniformLocation(program1, "ValLevels");
        gl.uniform1fv(uniform, [0.0,0.3,0.6,1.0]);

        uniform = gl.getUniformLocation(program1, "edge_thres");
        gl.uniform1f(uniform, 0.2);

        uniform = gl.getUniformLocation(program1, "edge_thres2");
        gl.uniform1f(uniform, 5.0);

        uniform = gl.getUniformLocation(program1, "tex0");
        gl.uniform1i(uniform, 0);


        // var location = gl.getAttribLocation(program1, 'position');
        // // gl.bindBuffer(gl.ARRAY_BUFFER, mVBO_Tri);
        // gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(location);
        // texture = gl.createTexture();
        // gl.bindTexture(gl.TEXTURE_2D, texture);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 400, 400, 0, gl.RGBA, gl.FLOAT, null);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, texture);

        // gl.bindTexture(gl.TEXTURE_2D, origintexture);
        
        // fbo = gl.createFramebuffer();
        // gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        
        //console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        mVBO_Tri = create_vbo([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
                
            1.0, 1.0,
            1.0, -1.0,
            -1.0, 1.0]);

        onReady();
    }

    var     stageWidth = 512;
    var    stageHeight = 512;

    var  PerfCountFreq = 30;
    var      TimeScale = 1 / PerfCountFreq;

    function onDraw()
    {
        var uniform;

        gl.useProgram(program1);

        uniform = gl.getUniformLocation(program1, "iResolution");
        gl.uniform2f(uniform, stageWidth, stageHeight);
        
        uniform = gl.getUniformLocation(program1, "mouse_x_offset");
        gl.uniform1f(uniform, mMouseOffset/stageWidth);


        // gl.bindTexture(gl.TEXTURE_2D, null)
        // gl.bindTexture(gl.TEXTURE_2D, origintexture);

        // local = gl.getUniformLocation(program1, "iMouse");
        // gl.uniform4fv(local, new Float32Array(pMouseVector));
        

        // gl.clearDepth(1.0);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // gl.bindTexture(gl.TEXTURE_2D, null);
        
        var location = gl.getAttribLocation(program1, 'position');
        gl.bindBuffer(gl.ARRAY_BUFFER, mVBO_Tri);
        gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(location);

        // gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
//        
        gl.flush();
    }

    function onReady()
    {
        var last_timestamp;

        mMouseOffset = 0;
        mMousePosX = stageWidth * 0.5;

        function draw(timestamp)
        {
            var time_elapsed = (timestamp - last_timestamp) * TimeScale || 0;
            last_timestamp = timestamp;

            if (isNeedRedrawing)
            {
                mMouseOffset += (mMousePosX-mMouseOffset) * 0.6;
                onDraw(time_elapsed);

                if (Math.abs(mMouseOffset-mMousePosX)*0.6 < 1)
                {
                    isNeedRedrawing = false;
                }
                //Render(time_elapsed);
            }
        
            requestAnimationFrame(draw);
        }
        
        requestAnimationFrame(draw);
    }

    var mMousePosX = 0.5;
    var mMouseOffset = 0.5;

    var mMouseIsDown;
    var isNeedRedrawing = true;

    // function getCoords(element)
    // {
    //     var x = 0;
    //     var y = 0;

    //     do {
    //         x += element.offsetLeft;
    //         y += element.offsetTop;
    //     } while(element = element.offsetParent);

    //     return {x: x, y: y};
    // }

    function onMouseDown(event)
    {
        var clientX = event.clientX;
        var clientY = event.clientY;
        var clientRect = event.target.getBoundingClientRect();
        
        mMousePosX = clientX - clientRect.left;
        // mMouseOriY = mMousePosY = clientY - clientRect.top;

        // mMouseOffset = mMousePosX / stageWidth;

        mMouseIsDown = true;
        isNeedRedrawing = true;
        
        // trace("mousedown", event.target.offsetLeft)
    }

    function onMouseMove()
    {
        if (mMouseIsDown)
        {
            var clientX = event.clientX;
            var clientY = event.clientY;
            var clientRect = event.target.getBoundingClientRect();

            mMousePosX = clientX - clientRect.left;
            mMousePosX = Math.min(Math.max(mMousePosX, 0), stageWidth);

            isNeedRedrawing = true;
        }
    }

    function onMouseUp()
    {
        if (mMouseIsDown)
        {

        }

        mMouseIsDown = false;
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    
    function trace()
    {
        console.log.apply(null, arguments);
    }
