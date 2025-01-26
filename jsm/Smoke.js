/*
 * Smoke.js (vers 25.01.25)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
 * Adapted from three.js examples.
*/

/*
 * @fileoverview
 * Subroutines to create smoke
 * See http://philcrowther.com/Aviation for more details.
 */

//= IMPORTS ====================================================================

import {
	Mesh,
	PlaneGeometry,
	SpriteNodeMaterial,
	Vector3,
} from 'three';

import {uniform,range,color,texture,uv,rotateUV,mix,time} from "three/tsl";

//= INITIALIZE VOLCANO SMOKE ===================================================

function initVulkan(vlk_) {
	//- Timer
	let speed = uniform(.001); // r170
	let scaledTime = time.add(125).mul(speed); // r170
	//- Life
	let lifeRange = range(0.1,1);
	let lifeTime = scaledTime.mul(lifeRange).mod(.05); // r170
	let life = lifeTime.div(lifeRange);
	//- Rotation Range
	let rotateRange = range(.1,4);
	let textureNode = texture(vlk_.VlkTxt[0], rotateUV(uv(),scaledTime.mul(rotateRange))); // r170
	let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);	
	//- Lateral Offset	
	let offsetRange = range(new Vector3(-.5,3,-.5), new Vector3(1,5,1)); // cone shaped
	//- Size Range
	let scaleRange = range(.1,.2);
	//
	let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
	// Wake
	let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
	let VlkMat = new SpriteNodeMaterial();
		VlkMat.colorNode = mix(color("white"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
		VlkMat.opacityNode = opacityNode;
		VlkMat.positionNode = offsetRange.mul(lifeTime);
		VlkMat.scaleNode = scaleRange.mul(lifeTime.max(0.3));
		VlkMat.depthWrite = false;
		VlkMat.transparent = true;
	vlk_.ObjAdr[0] = new Mesh(new PlaneGeometry(1, 1),VlkMat);
		vlk_.ObjAdr[0].scale.setScalar(vlk_.ObjSiz[0]);
		vlk_.ObjAdr[0].isInstancedMesh = true;
		vlk_.ObjAdr[0].count = 600; // Increases continuity (was 100)
		vlk_.ObjAdr[0].position.copy(vlk_.MapPos[0]);
		vlk_.ObjAdr[0].renderOrder = vlk_.RndOrd[0]; // This allows the transparent smoke to work with transparent island
		vlk_.ObjRef[0].add(vlk_.ObjAdr[0]);
}

//= EXPORTS ====================================================================

export {initVulkan};

/*= REVISIONS ==================================================================
 * 250125:	Created
*/
