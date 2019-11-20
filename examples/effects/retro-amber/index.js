
const { readFileSync } = require('fs');
const { resolve } = require('path');
const THREE = require('three');
const POSTPROCESSING = require('postprocessing');

class GlslEffect extends POSTPROCESSING.Effect {

	constructor(name, options = {}) {
		const fragmentShader = readFileSync(resolve(__dirname, '../../glsl/' + name + '.glsl')).toString();
		options.blendFunction = options.blendFunction || POSTPROCESSING.BlendFunction.NORMAL;

		super(name, fragmentShader, options);
	}
}


module.exports = ({ hyperTerm, xTerm }) => {

const saveTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { format: THREE.RGBAFormat, stencilBuffer: false })
const savePass = new POSTPROCESSING.SavePass(saveTarget)

const burnInEffect = new GlslEffect('burn-in', { 
		uniforms: new Map([
			[ 'burnInSource', new THREE.Uniform(savePass.renderTarget.texture)], 
			[ 'burnInTime', new THREE.Uniform(0.2)], 
		]),
	}
);

// ---------------------- RETRO EFFECT ----------------------
const jitter = 0.2;
const scale = 0.99;
const retroEffect = new GlslEffect('retro_scaled', {
		uniforms: new Map([
			[ 'fontColor', new THREE.Uniform(new THREE.Vector3(1.5, 0.9, 0.6))], 
			// [ 'backgroundColor', new THREE.Uniform(new THREE.Vector3(0.1, 0.0, 0.0))], 
			[ 'chromaColor', new THREE.Uniform(0.5)], 
			// [ 'staticNoise', new THREE.Uniform(0.2)], 
			[ 'noiseSource', new THREE.Uniform(null)], 
			// [ 'horizontalSyncStrength', new THREE.Uniform(0.05)], 
			// [ 'horizontalSyncFrequency', new THREE.Uniform(0.30)], 
			[ 'jitter', new THREE.Uniform(new THREE.Vector2(0.007 * jitter, 0.002 * jitter))], 
			[ 'glowingLine', new THREE.Uniform(0.4)], 
			[ 'flickering', new THREE.Uniform(0.2)], 
			// [ 'ambientLight', new THREE.Uniform(0.05)],
			[ 'scale', new THREE.Uniform(scale)], 
			// [ 'scanLineDensity', new THREE.Uniform(0.5)], 
			// [ 'pixelization', new THREE.Uniform(true)], 
			// [ 'rbgSplit', new THREE.Uniform(0.2)], 
		]),
	}
);

new THREE.TextureLoader().load(resolve(__dirname, '../../images/allNoise512.png'), texture => {
	texture.minFilter = THREE.LinearFilter;
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	retroEffect.uniforms.get('noiseSource').value = texture;
});


// ---------------------- BLOOM EFFECT ----------------------
const bloomEffect = new POSTPROCESSING.BloomEffect({
	kernelSize: 3,
	luminanceThreshold: 0,
	luminanceSmoothing: 0.5,
	// blendFunction: POSTPROCESSING.BlendFunction.ADD,	
});
// bloomEffect.luminancePass.enabled = false;
// bloomEffect.blendMode.opacity.value = 0.6;


// ---------------------- FRAME EFFECT ----------------------
const screenCurvature = 0.2;
const frameEffect = new GlslEffect('retro_frame', {
		uniforms: new Map([
			[ 'frameColor', new THREE.Uniform(new THREE.Vector3(150/255, 80/255, 60/255))], 
			[ 'screenCurvature', new THREE.Uniform(screenCurvature)], 
		]),
	}
);

function coordinateTransform(x, y) {
	x -= 0.5;
	y -= 0.5;

	let dist = screenCurvature * (x*x + y*y);
	dist *= 1.0 + dist;

	return [x * dist + x + 0.5, y * dist + y + 0.5];
};


// ---------------------- SCALE EFFECT ----------------------
const scaleEffect = new GlslEffect('scale', {
	defines: new Map([['scale', scale.toString()]])
})


// ---------------------- SHARPEN EFFECT ----------------------
const sharpenEffect = new GlslEffect('sharpen', {
	uniforms: new Map([
		['strength', new THREE.Uniform(0.3)],
	])
});


// // antialiasing disabled for clearer texts
// const searchImage = new Image(); searchImage.src = POSTPROCESSING.SMAAEffect.searchImageDataURL;
// const areaImage = new Image(); areaImage.src = POSTPROCESSING.SMAAEffect.areaImageDataURL;
// const smaaEffect = new POSTPROCESSING.SMAAEffect(searchImage, areaImage, SMAAPreset = 3);


// debugging
// window.THREE = THREE;
// window.POSTPROCESSING = POSTPROCESSING;
// window.retroEffect = retroEffect;
// window.sharpenEffect = sharpenEffect;
// window.bloomEffect = bloomEffect;
// window.scaleEffect = scaleEffect;

return {
	passes: [
		new POSTPROCESSING.EffectPass(null, burnInEffect),
		savePass,
		new POSTPROCESSING.EffectPass(null, retroEffect, scaleEffect),
		// new POSTPROCESSING.EffectPass(null, sharpenEffect),
		new POSTPROCESSING.EffectPass(null, bloomEffect),
		new POSTPROCESSING.EffectPass(null, frameEffect),
		// new POSTPROCESSING.EffectPass(null, smaaEffect),
	],
	coordinateTransform: coordinateTransform,
};

};
