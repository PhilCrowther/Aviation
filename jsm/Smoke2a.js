/*
 * Smoke.js (vers 25.03.10)
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
	Vector3,
	PlaneGeometry,
	SpriteNodeMaterial,
	Mesh,
	AdditiveBlending,
} from 'three';

import {uniform,range,color,texture,uv,rotateUV,mix,time,positionLocal} from "three/tsl";

/*******************************************************************************
*
*	GROUND BASED
*
*******************************************************************************/

//= INITIALIZE GROUND SMOKE ====//==============================================

function initGrdSmk(grs_) {
	for (let n = 0; n < grs_.ObjNum; n ++) {
		//- Timer
		let speed = uniform(.001); // r170
		let scaledTime = time.add(125).mul(speed); // r170
		//- Life
		let lifeRange = range(0.1,1);
		let lifeTime = scaledTime.mul(lifeRange).mod(.05); // r170
		let life = lifeTime.div(lifeRange);
		//- Rotation Range
		let rotateRange = range(.1,4);
		let textureNode = texture(grs_.ObjTxt[n], rotateUV(uv(),scaledTime.mul(rotateRange))); // r170
		let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);	
		//- Lateral Offset	
		let offsetRange = range(new Vector3(-.5,3,-.5), new Vector3(1,5,1)); // cone shaped
		//- Size Range
		let scaleRange = range(.1,.2);
		//
		let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
		//-	Wake
		let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
		//-	Material
		grs_.SmkMat[n] = new SpriteNodeMaterial();
		grs_.SmkMat[n].colorNode = mix(color("white"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
		grs_.SmkMat[n].opacityNode = opacityNode;
		grs_.SmkMat[n].positionNode = offsetRange.mul(lifeTime);
		grs_.SmkMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		grs_.SmkMat[n].depthWrite = false;
		grs_.SmkMat[n].transparent = true;
		//-	Mesh
		grs_.SmkMsh[n] = new Mesh(new PlaneGeometry(1, 1),grs_.SmkMat[n]);
		grs_.SmkMsh[n].scale.setScalar(grs_.ObjSiz[n]);
		grs_.SmkMsh[n].isInstancedMesh = true;
		grs_.SmkMsh[n].count = 600; // Increases continuity (was 100)
		grs_.SmkMsh[n].renderOrder = grs_.RndOrd[n]; // This allows the transparent smoke to work with transparent island
	}
}

//= INITIALIZE GROUND FIRE =====//===============================================

function initGrdFyr(grf_) {
	for (let n = 0; n < grf_.ObjNum; n ++) {
		// create nodes
		let lifeRange = range(.1,1);
		let speed = uniform(.01);
		let scaledTime = time.add(5).mul(speed);
		let lifeTime = scaledTime.mul(lifeRange).mod(1);
		let scaleRange = range(.3,2);
		let rotateRange = range(.1,4);
		let life = lifeTime.div(lifeRange);
		let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
		let textureNode = texture(grf_.ObjTxt, rotateUV(uv(),scaledTime.mul(rotateRange)));
		let opacityNode = textureNode.a.mul(life.oneMinus());
		let smokeColor = mix(color(0x2c1501),color(0x222222),positionLocal.y.mul(3).clamp());
		//-	Smoke
		grf_.SmkMat[n] = new SpriteNodeMaterial();
		grf_.SmkMat[n].colorNode = mix(color(0xf27d0c),smokeColor,life.mul(2.5).min(1)).mul(fakeLightEffect);
		grf_.SmkMat[n].opacityNode = opacityNode;
		grf_.SmkMat[n].positionNode = range(new Vector3(-2,3,-2), new Vector3(2,5,2)).mul(lifeTime);
		grf_.SmkMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		grf_.SmkMat[n].depthWrite = false;
		//
		grf_.SmkMsh[n] = new Mesh(new PlaneGeometry(1,1),grf_.SmkMat[n]);
		grf_.SmkMsh[n].scale.setScalar(grf_.ObjSiz);
		grf_.SmkMsh[n].count = 2000;
		//- Fire
		grf_.FyrMat[n] = new SpriteNodeMaterial();
		grf_.FyrMat[n].colorNode = mix(color(0xb72f17),color(0xb72f17),life);
		grf_.FyrMat[n].positionNode = range(new Vector3(-1,1,-1),new Vector3(1,2,1)).mul(lifeTime);
		grf_.FyrMat[n].scaleNode = grf_.SmkMat[n].scaleNode;
		grf_.FyrMat[n].opacityNode = opacityNode.mul(.5);
		grf_.FyrMat[n].blending = AdditiveBlending;
		grf_.FyrMat[n].transparent = true;
		grf_.FyrMat[n].depthWrite = false;
		//
		grf_.FyrMsh[n] = new Mesh(new PlaneGeometry(1,1),grf_.FyrMat[n]);
		grf_.FyrMsh[n].scale.setScalar(grf_.ObjSiz);
		grf_.FyrMsh[n].count = 1000;
		grf_.FyrMsh[n].renderOrder = 1;
	}
}

/*******************************************************************************
*
*	AIRPLANE BASED
*
*******************************************************************************/

//= INITIALIZE AIRPLANE SMOKE ==================================================

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
		let textureNode = texture(xas_.ObjTxt, rotateUV(uv(),scaledTime.mul(rotateRange))); // r170
		let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);
		//	Color
		let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
		//	Material
		xas_.SmkMat[n] = new SpriteNodeMaterial();
		xas_.SmkMat[n].colorNode = mix(color("white"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
		xas_.SmkMat[n].opacityNode = opacityNode;
		xas_.SmkMat[n].positionNode = offsetRange.mul(lifeTime);
		xas_.SmkMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		xas_.SmkMat[n].depthWrite = false;
		xas_.SmkMat[n].transparent = true;
		//	Mesh
		xas_.SmkMsh[n] = new Mesh(new PlaneGeometry(1, 1),xas_.SmkMat[n]);
		xas_.SmkMsh[n].scale.setScalar(xas_.ObjSiz);
		xas_.SmkMsh[n].isInstancedMesh = true;
		xas_.SmkMsh[n].count = 100;
		xas_.SmkMsh[n].rotation.x = Math.PI/2;
		xas_.SmkMsh[n].position.z = 10;
	}
}

//= INITIALIZE AIRPLANE FIRE ===================================================

function initAirFyr(xaf_) {
	for (let n = 0; n < xaf_.ObjNum; n ++) {
		let lifeRange = range(0.1,1);
		let speed = uniform(0.2);
		let scaledTime = time.add(5).mul(speed);
		let lifeTime = scaledTime.mul(lifeRange).mod(1);
//		let scaleRange = range(.3,2);
		let scaleRange = range(.01,.02);
		let rotateRange = range(0.1,4);
		let life = lifeTime.div(lifeRange);
		let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
		let textureNode = texture(xaf_.ObjTxt, rotateUV(uv(),scaledTime.mul(rotateRange)));
		let opacityNode = textureNode.a.mul(life.oneMinus());
		let smokeColor = mix(color(0x2c1501),color(0x222222),positionLocal.y.mul(3).clamp());
		//-	Smoke
		xaf_.SmkMat[n] = new SpriteNodeMaterial();
		xaf_.SmkMat[n].colorNode = mix(color(0xf27d0c),smokeColor,life.mul(2.5).min(1)).mul(fakeLightEffect);
		xaf_.SmkMat[n].opacityNode = opacityNode;
		xaf_.SmkMat[n].positionNode = range(new Vector3(-.5,3,-.5), new Vector3(1,5,1)).mul(lifeTime);
		xaf_.SmkMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		xaf_.SmkMat[n].depthWrite = false;
		//
		xaf_.SmkMsh[n] = new Mesh(new PlaneGeometry(1,1),xaf_.SmkMat[n]);
		xaf_.SmkMsh[n].scale.setScalar(xaf_.ObjSiz);
		xaf_.SmkMsh[n].count = 1000;
		xaf_.SmkMsh[n].rotation.x = Math.PI/2;
		//- Fire
		xaf_.FyrMat[n] = new SpriteNodeMaterial();
		xaf_.FyrMat[n].colorNode = mix(color(0xb72f17),color(0xb72f17),life);
		xaf_.FyrMat[n].positionNode = range(new Vector3(-.25,1,-.25),new Vector3(.5,2,.5)).mul(lifeTime);
		xaf_.FyrMat[n].scaleNode = xaf_.SmkMat[n].scaleNode;
		xaf_.FyrMat[n].opacityNode = opacityNode.mul(.5);
		xaf_.FyrMat[n].blending = AdditiveBlending;
		xaf_.FyrMat[n].transparent = true;
		xaf_.FyrMat[n].depthWrite = false;
		//
		xaf_.FyrMsh[n] = new Mesh(new PlaneGeometry(1,1),xaf_.FyrMat[n]);
		xaf_.FyrMsh[n].scale.setScalar(xaf_.ObjSiz);
		xaf_.FyrMsh[n].count = 500;
		xaf_.FyrMsh[n].renderOrder = 1;
		xaf_.FyrMsh[n].rotation.x = Math.PI/2;
		xaf_.FyrMsh[n].position.z = -10;
	}
}

/*******************************************************************************
*
*	SHIP BASED
*
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
*	EXPORTS                                                                    *
*                                                                              *
*******************************************************************************/

export {initGrdSmk,initGrdFyr,initAirSmk,initAirFyr,initShpWak};

/*******************************************************************************
*                                                                              *
*	REVISIONS                                                                  *
*                                                                              *
*******************************************************************************/
/*
// 250125: Version 1	:
*/


