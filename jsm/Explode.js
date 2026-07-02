/*******************************************************************************
*
*	EFFECTS MODULE
*
********************************************************************************

Copyright 2017-26, Phil Crowther <phil@philcrowther.com>
Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
Version dated 2 Jul 2026

@fileoverview
Subroutines to create an air combat simulation
See http://philcrowther.com/Aviation for more details.

NOTES:
Bul refers to aircraft bullets with double lines
AAA refers to anti-aircraft bullets with singles lines
Use lines and 2 colors so bullets appear against both light sky and dark ground

The AA module does not cycle through all bullets, but only enough to fill the sky.
This is because, once the time of flight has passed and the wait time has passed,
each bullet is ready to be fired again and the program uses the first available
bullet (similar to a LIFO method). This stops subsequent bullets from being fired.

AA Smoke was originally tied to a bullet, which limited the delay between bullets.
AA Smoke now has an independent delay which eliminates this problem.

Regarding implementing a delay in sounds due to distance:
When AA Smoke was tied to a bullet, the smoke was appearing so fast that that the 
delay counter was reset before it had a chance to hit zero. As a result, the sound 
was never triggered. Now that AA Smoke has an independent delay, this should be
less of a problem. 

However, since AA sound is not heard much until we get close, implementation of a
sound delay may be superfluous.
*/

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	AdditiveBlending,
	AnimationClip,
	AnimationMixer,
	BackSide,
	BufferGeometry,
	Euler,
	Line,
	LineBasicNodeMaterial,
	Line2NodeMaterial,
	MeshBasicNodeMaterial,
	Mesh,
	Object3D,
	PlaneGeometry,
	SphereGeometry,
	Spherical,
	Sprite,
	SpriteNodeMaterial,
	Vector3,	
} from 'three';

import {Line2} from "three/addons/lines/webgpu/Line2.js";
import {LineGeometry} from "three/addons/lines/LineGeometry.js";
import {color,mix,positionLocal,range,rotateUV,texture,time,uniform,uv} from 'three/tsl';

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

//= CONSTANTS ==================//==============================================

const DegRad = Math.PI/180;		// Convert Degrees to Radians

/*******************************************************************************
*
*	BOMB EXPLOSION
*
*******************************************************************************/

//= LOAD BOMB ==================//==============================================
function loadExpBom(bom_,gen_) {
	// Load Common Smoke Material
	bom_.SmkMap = gen_.txtrLd.load(bom_.SmkSrc);
}

//= INIT BOMB ==================//==============================================
function initExpBom(bom_bmx_,bmt_,bms_) {
	initBomExp(bom_bmx_);
	initBomSmT(bom_bmt_);
	initBomSmk(bom_bms_);

}

//= MOVE BOMB ==================//==============================================
function moveExpBom(bmx_,bmt_,bms_,tim_) {
	moveBomExp(bmx_);
	moveBomSmT(bmt_,tim_);
	moveBomSmk(bms_);
}

/*******************************************************************************
*
*	BOMB SPHERE GEOMETRY
*
*******************************************************************************/

//= INIT =======================//==============================================
function initBomExp(bom_,bmx_) {
	bmx_.ExpMat.depthWrite = false;
	bmx_.ExpMsh = new THREE.Mesh(bmx_.ExpGeo,bmx_.ExpMat);
	bmx_.ExpMsh.scale.setScalar(bmx_.ExpSiz);
	bom_.ExpGrp.add(bmx_.ExpMsh);
	bmx_.ExpMsh.position.y = 5;
}

//= MOVE =======================//==============================================
function moveBomExp(bmx_) {
	if (bmx_.ExpFlg) {
		// Display New Size and Opacity
		bmx_.ExpMsh.scale.setScalar(bmx_.ExpSiz);
		bmx_.ExpMat.OpacityNode = bmx_.ExpOpa;
		// Adjust Side and Opacity
		bmx_.ExpSiz = bmx_.ExpSiz + 1/Ft2Mtr; // Expand
		bmx_.ExpOpa = bmx_.ExpOpa - 0.01; // Fade Away
		// If Size > MaxSiz, Turn Off and Reset
		if (bmx_.ExpSiz > bmx_.MaxSiz) {
			bmx_.ExpFlg = 0;
			// Reset
			bmx_.ExpSiz = bmx_.BegSiz;
			bmx_.ExpOpa = 1;
			bmx_.ExpMsh.scale.setScalar(bmx_.ExpSiz);
			bmx_.ExpMat.OpacityNode = bmx_.ExpOpa;
		}
	}
}

/*******************************************************************************
*
*	BOMB SMOKE TRAILS
*
*******************************************************************************/

//= INIT =======================//==============================================

function initBomSmT(bom_,bmt_) {
	//	Init Material
	bmt_.SmkMat.colorNode = texture(bom_.SmkMap);
	bmt_.SmkMat.transparent = true;
	bmt_.SmkMat.opacity = bmt_.BegOpa;
	bmt_.SmkMat.depthWrite = false;
	//	Init Sprites (initializes Size and Rotation)
	for (let t = 0; t < bmt_.Trails; t++) {
		// Compute XYZ Speed (m/s) Before Gravity
		bmt_.SmkSpd[t].x = Math.cos(bmt_.SmkVec[t].x*DegRad)*Math.cos(bmt_.SmkVec[t].y*DegRad)*bmt_.SmkVec[t].z;
		bmt_.SmkSpd[t].y = Math.sin(bmt_.SmkVec[t].x*DegRad)*bmt_.SmkVec[t].z;
		bmt_.SmkSpd[t].z = Math.cos(bmt_.SmkVec[t].x*DegRad)*Math.sin(bmt_.SmkVec[t].y*DegRad)*bmt_.SmkVec[t].z;
		for (let n = 0; n < bmt_.SmkNum; n++) {
			//	Make Sprites
			bmt_.SmkSpr[t][n] = new THREE.Sprite(bmt_.SmkMat); // 10 different textures
			bmt_.SmkSpr[t][n].scale.setScalar(bmt_.SmkSiz);
			bmt_.SmkSpr[t][n].material.rotation = bmt_.SmkRot*DegRad;
			bmt_.SmkSpr[t][n].visible = false;
			bom_.ExpGrp.add(bmt_.SmkSpr[t][n]); // Add to Group
			//	Adjust Size and Rotation
			bmt_.SmkSiz = bmt_.SmkSiz - 0.01*bmt_.SmkMax;	// Reduce Size of Each Sprite	
			bmt_.SmkRot = Mod360(bmt_.SmkRot+36);		// Rotate Each Sprite
		}
		bmt_.SmkSiz = bmt_.SmkMax;
	}
}

//= MOVE =======================//==============================================

function moveBomSmT(bmt_,tim_) {
	// Make Smoke Trail (Only Position One Sprite per Frame)
	if (bmt_.MakFlg) {
		if (!bmt_.SpcCnt) {		// If Space Counter = 0;
			for (let t = 0; t < bmt_.Trails; t++) {
				bmt_.SmkPos.x = bmt_.SmkSpd[t].x*bmt_.SmkTim+bmt_.SmkRnd[t].x*Math.random()+bmt_.SmkOff[t].x;
				bmt_.SmkPos.y = bmt_.SmkSpd[t].y*bmt_.SmkTim-0.5*GrvMPS*(bmt_.SmkTim**2)+bmt_.SmkRnd[t].y*Math.random()+bmt_.SmkOff[t].y;
				bmt_.SmkPos.z = bmt_.SmkSpd[t].z*bmt_.SmkTim+bmt_.SmkRnd[t].z*Math.random()+bmt_.SmkOff[t].z;
				bmt_.SmkSpr[t][bmt_.SmkIdx].position.copy(bmt_.SmkPos);
				bmt_.SmkSpr[t][bmt_.SmkIdx].visible = true;
			}
			bmt_.SmkIdx++;		// Next Sprite
			if (bmt_.SmkIdx == bmt_.SmkNum) bmt_.MakFlg = 0; // End Smoke Generation
			bmt_.SpcCnt = bmt_.SmkSpc;	// Reset Space Counter
		}
		if (bmt_.SmkIdx) bmt_.SmkTim = bmt_.SmkTim + tim_.DifTim;
		bmt_.SpcCnt--;			// Decrement Space Counter
	}
	// Fade Smoke Trail (Only If bmt_.FadFlg > 0)
	else if (bmt_.FadFlg) {
		for (let t = 0; t < bmt_.Trails; t++) {
			for (let n = 0; n < bmt_.SmkNum; n++) { // Fade All at Same Time by Same Amount
				bmt_.SmkSpr[t][n].material.opacity = bmt_.FadTim/bmt_.SmkMul;
			}
		}
		bmt_.FadTim--;
		// If Done, Reset All
		if (bmt_.FadTim <= 0) {
			bmt_.FadFlg = 0;
			bmt_.SmkIdx = 0;
			bmt_.SmkTim = 0;
			bmt_.FadTim = bmt_.BegOpa*bmt_.SmkMul;
			bmt_.SmkSiz = bmt_.SmkMax;
			bmt_.SpcCnt = bmt_.SmkSpc;
			for (let t = 0; t < bmt_.Trails; t++) {
				for (let n = 0; n < bmt_.SmkNum; n++) {
					bmt_.SmkSpr[t][n].position.set(0,0,0); // Reset Position
					bmt_.SmkSpr[t][n].material.opacity = bmt_.BegOpa; // Reset Opacity
					bmt_.SmkSpr[t][n].visible = false; // Make Invisible
				}
			}
		}
	}
}

/*******************************************************************************
*
*	BOMB SMOKE
*
*******************************************************************************/
// NOTES: Apparently, the SpriteMaterial moves, not the Sprites

//=	INIT =======================//==============================================

function initBomSmk(bom_,bms_) {
	//- Commom Variables -------------------------------------------------------
	//	Speed
	let speed = uniform(.2); // Used by scaledTime
	let scaledTime = time.add(5).mul(speed); // Used by lifeTime and Opacity
	//	Life
	let lifeRange = range(.1,1); // Used by lifeTime and life (for each particle)
	let lifeTime = scaledTime.mul(lifeRange).mod(1); // used by life and Position
	let life = lifeTime.div(lifeRange);	// Used by Color and Opacity
	//-	Material ---------------------------------------------------------------
	let smokeNodeMaterial = new THREE.SpriteNodeMaterial();
	//	Color
	let smokeColor = mix(color(0x2c1501),color(0x222222),positionLocal.y.mul(3).clamp());
	let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
		smokeNodeMaterial.colorNode = mix(color(0xf27d0c),smokeColor,life.mul(2.5).min(1)).mul(fakeLightEffect);
	//	Opacity
	let rotateRange = range(.1,4);
	let textureNode = texture(bom_.SmkMap,rotateUV(uv(),scaledTime.mul(rotateRange)));
	let opacityNode = textureNode.a.mul(life.oneMinus());
		smokeNodeMaterial.opacityNode = opacityNode;
	//	Position
	let offsetRange = range(new THREE.Vector3(-2,3,-2),new THREE.Vector3(2,5,2));
		smokeNodeMaterial.positionNode = offsetRange.mul(lifeTime);
	//	Scale
	let scaleRange = range(.3,2);
		smokeNodeMaterial.scaleNode = scaleRange.mul(lifeTime.max(0.3));
	//	Depth Write
		smokeNodeMaterial.depthWrite = false;
	//-	Sprites ----------------------------------------------------------------
		bms_.SmkSpr = new THREE.Sprite(smokeNodeMaterial);
		bms_.SmkSpr.scale.setScalar(bms_.RemSiz);
		bms_.SmkSpr.count = 1000;
		bms_.SmkSpr.position.y = 0; // Height Above Ground
		bom_.ExpGrp.add(bms_.SmkSpr);
}

//=	MOVE =======================//==============================================

function moveBomSmk(bms_) {
	// After First Rep, Smoke Plume is Fully Developed. So You Need to Expand the
	// Whole Plume to Create the Illusion of a Developing Smoke Plume

	// Expand Quickly
	if (bms_.GroFlg) {
		bms_.RemSiz = bms_.RemSiz + 0.175;
		if (bms_.RemSiz > bms_.MaxSiz) {
			bms_.RemSiz = bms_.MaxSiz;
			bms_.GroFlg = 0;
		}
	}
	// Contract Slowly
	if (!bms_.GroFlg) {
		bms_.RemSiz = bms_.RemSiz - 0.05; // TEST (default = 0.01)
		if (bms_.RemSiz < 1) {
			bms_.RemSiz = 1;
			bms_.GroFlg = 1;	// Grow Next Time
			bom_.ExpFlg = 0;	// End Entire Explosion
		}
	}
	bms_.SmkSpr.scale.setScalar(bms_.RemSiz);
}

/*******************************************************************************
*
*	SUBROUTINES
*
*******************************************************************************/

//= CONVERTS DEGREES TO 360 ====//==============================================
function Mod360(deg) {
	while (deg < 0) deg = deg + 360; // Make deg a positive number
	deg = deg % 360;				 // Compute remainder of any number divided by 360
return deg;}

//= SPHERE =====================//==============================================
//	Used to create flash explosions
function makeSphere(col) {
	let geometry = new SphereGeometry(1,32,16);
	let	material = new MeshBasicNodeMaterial({colorNode:color(col),transparent:true,opacity:1});
	let mesh = new Mesh(geometry,material);
	mesh.visible = false;
return mesh;}

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {loadExpBom,initExpBom,moveExpBom};

/*******************************************************************************
*
*	REVISIONS
*
********************************************************************************

260702:	Add Bomb Subroutines
*/
