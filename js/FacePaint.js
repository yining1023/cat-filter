class FacePaint {
	static get EYE_VERTICES() {
		return [
			// LEFT EYE
			133, 173, 157, 158,
			159, 160, 161, 246,
			33, 7, 163, 144,
			145, 153, 154, 155,
			// RIGHT EYE
			362, 398, 384, 385,
			386, 387, 388, 466,
			263, 249, 390, 373,
			374, 380, 381, 382
		];
	}
	_addCamera() {
		this._camera = new THREE.OrthographicCamera(
			this._halfW,
			-this._halfW,
			-this._halfH,
			this._halfH,
			1, 1000
		);
		this._camera.position.x = this._halfW;
		this._camera.position.y = this._halfH;
		this._camera.position.z = -600;
		this._camera.lookAt(
			this._halfW,
			this._halfH,
			0
		);
	}

	set blendMode(val) {
		this._renderer.domElement.style.mixBlendMode = val;
	}

	_addLights() {
		const light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
		this._scene.add(light);
		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(this._halfW, this._halfH * 0.5, -1000).normalize();
		this._scene.add(directionalLight);
	}

	_addGeometry() {
		this._geometry = new THREE.BufferGeometry();
		const EV = FacePaint.EYE_VERTICES;
		for (let i = TRIANGULATION.length - 1; i > -1; i -= 3) {
			const a = TRIANGULATION[i];
			const b = TRIANGULATION[i - 1];
			const c = TRIANGULATION[i - 2];
			if (EV.indexOf(a) !== -1 ||
				EV.indexOf(b) !== -1 ||
				EV.indexOf(c) !== -1) {
				TRIANGULATION.splice(i - 2, 3);
			}
		}
		this._geometry.setIndex(TRIANGULATION);
		this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionBufferData, 3));
		this._geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
		this._geometry.computeVertexNormals();
	}

	_addMaterial() {
		this._textureLoader = new THREE.TextureLoader();
		const texture = this._textureLoader.load(this._textureFilePath);
		// set the "color space" of the texture
		texture.encoding = THREE.sRGBEncoding;

		// reduce blurring at glancing angles
		texture.anisotropy = 16;
		const alpha = 0.4;
		const beta = 0.5;
		this._material = new THREE.MeshPhongMaterial({
			map: texture,
			color: new THREE.Color(0xffffff),
			specular: new THREE.Color(beta * 0.2, beta * 0.2, beta * 0.2),
			reflectivity: beta,
			shininess: Math.pow(2, alpha * 10),
		});
	}

	_setupScene() {
		this._scene = new THREE.Scene();
		this._addCamera();
		this._addLights();
		this._addGeometry();
		this._addMaterial();
		this._mesh = new THREE.Mesh(this._geometry, this._material);
		this._scene.add(this._mesh);
	}

	async updateTexture(url, isVideo) {
		let texture;
		if (this._video) {
			this._video.pause();
		}
		if (isVideo) {
			this._video = document.querySelector(`video[src="${url}"]`);

			this._video.play();
			texture = new THREE.VideoTexture(this._video);
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;
		} else {
			texture = await this._textureLoader.loadAsync(url);
		}

		this._material.map = texture;
	}

	render(positionBufferData) {

		this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionBufferData, 3));
		this._geometry.attributes.position.needsUpdate = true;

		this._renderer.render(this._scene, this._camera);
		// const imgData = this._renderer.domElement.toDataURL();
		// console.log('imgData', imgData)
		// var img = new Image();
		// img.src = imgData;
		// var gl = this._renderer.getContext();
		// var pixels = new Uint8Array(this._w * this._h * 4);
		// gl.readPixels(0, 0, this._w, this._h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		// console.log(pixels.length); // Uint8Array
		// const srcImageData = toImageData(pixels, this._w, this._h);

		// blendImages({
		// 	srcImageData, base_size: {
		// 		width: this._w,
		// 		height: this._h
		// 	}
		// });
	}

	constructor({
		id,
		textureFilePath,
		w,
		h
	}) {
		this._renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			canvas: document.querySelector(`#${id}`)
		});
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setSize(w, h);
		this._w = 1280;
		this._h = 720;
		this._halfW = w * 0.5;
		this._halfH = h * 0.5;
		this._textureFilePath = textureFilePath;
		this._setupScene();
	}
}

const toImageData = (pixels, w, h) => {
	var image = new ImageData(w, h);
	//copy texture data to Image data where format is RGBA
	var size = w * h * 4;
	for (var i = 0; i < size; i++) {
		image.data[i] = pixels[i];
	}
	return image;
}

// function initializeResultCtx(base_pixels, base_size) {
// 	const resultCanvas = document.querySelector('#resultCanvas');
// 	const result_ctx = resultCanvas.getContext('2d');
// 	// var result_pixels = result_ctx.getImageData(0, 0, base_size.width, base_size.height);
// 	// for (var i = 0; i < result_pixels.data.length; i++) {
// 	// 	result_pixels.data[i] = 255;
// 	// }
// 	// result_ctx.putImageData(base_pixels, 0, 0);
// 	return result_ctx;
// }

/*-----------------------------------------
	Blend Images
	g : src_pixels (using mask_pixels)
	f*: base_pixels
	---> Blend result is result_pixels
-----------------------------------------*/
const blendImages = ({
	srcImageData,
	base_size
}) => {
	const videoEl = document.querySelector('#webcam');
	// const baseCanvas = document.createElement("canvas");
	// baseCanvas.width = 1280;
	// baseCanvas.height = 720;
	const baseCanvas = document.querySelector("#baseCanvas");
	const base_ctx = baseCanvas.getContext('2d');
	// base_ctx.drawImage(videoEl, 0, 0, base_size.width, base_size.height);
	// console.log('base', baseCanvas.toDataURL())


	var base_pixels = base_ctx.getImageData(0, 0, base_size.width, base_size.height);
	var src_pixels = srcImageData; //src_ctx.getImageData(0, 0, base_size.width, base_size.height);
	var mask_pixels = src_pixels; // mask_ctx.getImageData(0, 0, base_size.width, base_size.height);

	// const result_ctx = initializeResultCtx(base_pixels, base_size);
	const resultCanvas = document.querySelector('#resultCanvas');
	const result_ctx = resultCanvas.getContext('2d');
	var result_pixels = base_pixels;//result_ctx.getImageData(0, 0, base_size.width, base_size.height);

	// console.log('base_pixels.data.length', base_pixels.data.length)
	// console.log('src_pixels.data.length', src_pixels.data.length)
	// console.log('base_pixels', base_pixels)
	// console.log('src_pixels', src_pixels)
	// console.log('result_pixels', result_pixels)

	// var dx, absx, previous_epsilon = 1.0;
	// var cnt = 0;
	// var blend_position_offset = { x: 0, y: 0 };
	// var is_mixing_gradients = false;

	// do {
	// 	dx = 0; absx = 0;
	// 	for (var y = 1; y < base_size.height - 1; y++) {
	// 		for (var x = 1; x < base_size.width - 1; x++) {
	// 			// p is current pixel
	// 			// rgba r=p+0, g=p+1, b=p+2, a=p+3
	// 			var p = (y * base_size.width + x) * 4;

	// 			// Mask area is painted with a opacity
	// 			if (mask_pixels.data[p + 3] == 255) {
	// 				var p_offseted = p + 4 * (blend_position_offset.y * base_size.width + blend_position_offset.x);

	// 				// q is array of connected neighbors
	// 				var q = [((y - 1) * base_size.width + x) * 4, ((y + 1) * base_size.width + x) * 4,
	// 				(y * base_size.width + (x - 1)) * 4, (y * base_size.width + (x + 1)) * 4];
	// 				var num_neighbors = q.length;

	// 				for (var rgb = 0; rgb < 3; rgb++) {
	// 					var sum_fq = 0;
	// 					var sum_vpq = 0;
	// 					var sum_boundary = 0;

	// 					for (var i = 0; i < num_neighbors; i++) {
	// 						var q_offseted = q[i] + 4 * (blend_position_offset.y * base_size.width + blend_position_offset.x);

	// 						if (mask_pixels.data[q[i] + 0] == 0 && mask_pixels.data[q[i] + 1] == 255 &&
	// 							mask_pixels.data[q[i] + 2] == 0 && mask_pixels.data[q[i] + 3] == 255) {
	// 							sum_fq += result_pixels.data[q_offseted + rgb];
	// 						} else {
	// 							sum_boundary += base_pixels.data[q_offseted + rgb];
	// 						}

	// 						if (is_mixing_gradients && Math.abs(base_pixels.data[p_offseted + rgb] - base_pixels.data[q_offseted + rgb]) >
	// 							Math.abs(src_pixels.data[p + rgb] - src_pixels.data[q[i] + rgb])) {
	// 							sum_vpq += base_pixels.data[p_offseted + rgb] - base_pixels.data[q_offseted + rgb];
	// 						} else {
	// 							sum_vpq += src_pixels.data[p + rgb] - src_pixels.data[q[i] + rgb];
	// 						}
	// 					}
	// 					var new_value = (sum_fq + sum_vpq + sum_boundary) / num_neighbors;
	// 					dx += Math.abs(new_value - result_pixels.data[p_offseted + rgb]);
	// 					absx += Math.abs(new_value);
	// 					result_pixels.data[p_offseted + rgb] = new_value;
	// 				}
	// 			}
	// 		}
	// 	}
	// 	cnt++;
	// 	var epsilon = dx / absx;
	// 	if (!epsilon || previous_epsilon - epsilon === 0) break; // convergence
	// 	else previous_epsilon = epsilon;
	// } while (true);
	// // console.log('final result_pixels', result_pixels)
	result_ctx.putImageData(result_pixels, 0, 0);
	// // const resultCanvas = document.querySelector('#resultCanvas');
	// // const result = resultCanvas.toDataURL();
	// // console.log('result', result)
}

const convertURIToImageData = (URI) => {
	return new Promise(function (resolve, reject) {
		if (URI == null) return reject();
		var canvas = document.createElement('canvas'),
			context = canvas.getContext('2d'),
			image = new Image();
		image.addEventListener('load', function () {
			canvas.width = image.width;
			canvas.height = image.height;
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			resolve(context.getImageData(0, 0, canvas.width, canvas.height));
		}, false);
		image.src = URI;
	});
}
