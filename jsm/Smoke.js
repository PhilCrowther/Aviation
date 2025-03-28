/*
 * Smoke.js (vers 25.03.03)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
 * Adapted from three.js examples.
*/

/*
 * @fileoverview
 * Subroutines to create smoke
 * See http://philcrowther.com/Aviation for more details.
 */

/*******************************************************************************
*                                                                              *
*	IMPORTS                                                                    *
*                                                                              *
*******************************************************************************/

import {
	Mesh,
	PlaneGeometry,
	SpriteNodeMaterial,
	Vector3,
} from 'three';

import {uniform,range,color,texture,uv,rotateUV,mix,time,positionLocal} from "three/tsl";

/*******************************************************************************
*                                                                              *
*	VOLCANO SMOKE                                                              *
*                                                                              *
*******************************************************************************/

//= INITIALIZE VOLCANO SMOKE ===================================================

function initVulkan(vlk_) {
	for (let n = 0; n < vlk_.ObjNum; n ++) {
		//- Timer
		let speed = uniform(.001); // r170
		let scaledTime = time.add(125).mul(speed); // r170
		//- Life
		let lifeRange = range(0.1,1);
		let lifeTime = scaledTime.mul(lifeRange).mod(.05); // r170
		let life = lifeTime.div(lifeRange);
		//- Rotation Range
		let rotateRange = range(.1,4);
		let textureNode = texture(vlk_.ObjTxt[n], rotateUV(uv(),scaledTime.mul(rotateRange))); // r170
		let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);	
		//- Lateral Offset	
		let offsetRange = range(new Vector3(-.5,3,-.5), new Vector3(1,5,1)); // cone shaped
		//- Size Range
		let scaleRange = range(.1,.2);
		//
		let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
		// Wake
		let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
		//	Material
		vlk_.ObjMat[n] = new SpriteNodeMaterial();
		vlk_.ObjMat[n].colorNode = mix(color("white"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
		vlk_.ObjMat[n].opacityNode = opacityNode;
		vlk_.ObjMat[n].positionNode = offsetRange.mul(lifeTime);
		vlk_.ObjMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		vlk_.ObjMat[n].depthWrite = false;
		vlk_.ObjMat[n].transparent = true;
		//	Mesh
		vlk_.ObjAdr[n] = new Mesh(new PlaneGeometry(1, 1),vlk_.ObjMat[n]);
		vlk_.ObjAdr[n].scale.setScalar(vlk_.ObjSiz[n]);
		vlk_.ObjAdr[n].isInstancedMesh = true;
		vlk_.ObjAdr[n].count = 600; // Increases continuity (was 100)
		vlk_.ObjAdr[n].position.copy(vlk_.MapPos[n]);
		vlk_.ObjAdr[n].renderOrder = vlk_.RndOrd[n]; // This allows the transparent smoke to work with transparent island
		//lINK
		vlk_.ObjRef[n].add(vlk_.ObjAdr[n]);
	}
}

/*******************************************************************************
*                                                                              *
*	SHIP WAKE                                                                  *
*                                                                              *
*******************************************************************************/

//= INITIALIZE SHIP WAKE =======================================================

function initShpWak(wak_) {
	for (let n = 0; n < wak_.ObjNum; n ++) {
		//- Timer
		let speed = uniform(.001); // r170 Lower = slower
		let scaledTime = time.add(125).mul(speed); // r170
		//- Life
		let lifeRange = range(0.1,1);
		let lifeTime = scaledTime.mul(lifeRange).mod(.05); // r170
		let life = lifeTime.div(lifeRange);
		//- Rotation Range
		let rotateRange = range(.1,.2);
		let textureNode = texture(wak_.ObjTxt[n], rotateUV(uv(),scaledTime.mul(rotateRange))); // r170
		let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);	
		//- Lateral Offset	
		let offsetRange = range(new Vector3(0,3,0), new Vector3(0,5,0));
		//- Size Range
		let scaleRange = range(.01,.02);
		//
		let fakeLightEffect = positionLocal.x.oneMinus().max(0.2);
		//	Color
		let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
		//	Material
		wak_.ObjMat[n] = new SpriteNodeMaterial();
		wak_.ObjMat[n].colorNode = mix(color("white"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
		wak_.ObjMat[n].opacityNode = opacityNode;
		wak_.ObjMat[n].positionNode = offsetRange.mul(lifeTime);
		wak_.ObjMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		wak_.ObjMat[n].depthWrite = false;
		wak_.ObjMat[n].transparent = true;
		//	Mesh
		wak_.ObjAdr[n] = new Mesh(new PlaneGeometry(1, 1),wak_.ObjMat[n]);
		wak_.ObjAdr[n].scale.setScalar(wak_.ObjSiz[n]);
		wak_.ObjAdr[n].isInstancedMesh = true;
		wak_.ObjAdr[n].count = 600; // Increases continuity (was 100)
		wak_.ObjAdr[n].rotation.x = Math.PI/2; // Set Flat
		wak_.ObjAdr[n].position.y = -5; // Added
		//	Link
		wak_.ObjRef[n].add(wak_.ObjAdr[n]);
	}
}

/*******************************************************************************
*                                                                              *
*	AIRPLANE SMOKE                                                             *
*                                                                              *
*******************************************************************************/

//= INITIALIZE HORIZONTAL SMOKE ================================================

function initAirSmk(xas_) {
	for (let n = 0; n < xas_.ObjNum; n ++) {
		let lifeRange = range(0.1,1);
		let offsetRange = range(new Vector3(0,3,0), new Vector3(0,5,0));
		let speed = uniform(.2);		// r170
		let scaledTime = time.add(5).mul(speed); // r170
		let lifeTime = scaledTime.mul(lifeRange).mod(.05); // r170
		let scaleRange = range(.01,.02);
		let rotateRange = range(.1,4);
		let life = lifeTime.div(lifeRange);
		let fakeLightEffect = positionLocal.x.oneMinus().max(0.2);
		let textureNode = texture(xas_.ObjTxt[n], rotateUV(uv(),scaledTime.mul(rotateRange))); // r170
		let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);
		//	Color
		let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
		//	Material
		xas_.ObjMat[n] = new SpriteNodeMaterial();
		xas_.ObjMat[n].colorNode = mix(color("white"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
		xas_.ObjMat[n].opacityNode = opacityNode;
		xas_.ObjMat[n].positionNode = offsetRange.mul(lifeTime);
		xas_.ObjMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		xas_.ObjMat[n].depthWrite = false;
		xas_.ObjMat[n].transparent = true;
		//	Mesh
		xas_.ObjAdr[n] = new Mesh(new PlaneGeometry(1, 1),xas_.ObjMat[n]);
		xas_.ObjAdr[n].scale.setScalar(xas_.ObjSiz[n]);
		xas_.ObjAdr[n].isInstancedMesh = true;
		xas_.ObjAdr[n].count = 100;
		xas_.ObjAdr[n].rotation.x = Math.PI/2;
		xas_.ObjAdr[n].position.z = 10;
		//	Link
//		xas_.ObjRef[n].add(xas_.ObjAdr[n]); // ### not work! xas_.ObjRef[n].add is not a function
	}
}

/*******************************************************************************
*                                                                              *
*	EXPORTS                                                                    *
*                                                                              *
*******************************************************************************/

export {initVulkan,initShpWak,initAirSmk};

/*******************************************************************************
*                                                                              *
*	REVISIONS                                                                  *
*                                                                              *
*******************************************************************************/
/*
// 250125: Version 1	:
*/


