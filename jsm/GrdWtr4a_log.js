//= GRID MAP MODULE ============================================================

// GrdWtr variation
// Version 3.0 (dated 3 Sep 2024)
// Copyright 2022-2024, Phil Crowther
// Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//
// @fileoverview
// This version of the GrdMap module is designed to work with your main program 
// and the Ocean module to create a nested scrolling Gridmap with three different
// sizes of grids and materials that include as many as 4 types of textures.
//
// The materials are created using the animated Ocean displacement and normal maps 
// along with diffuse and roughness textures that are loaded, subdivided in your 
// main program and saved to the grd_ variable (below).
//
// The grids have the following dimensions and use the following textures:

// DIMENSIONS:
//           Square Size   Grid Units      Grid Size          Visibility
// Grid0	 3.2 km / 2 mi     4x4      12.8 km /  8 mi     6.4 km /  4 mi
// Grid1     3.2 km / 2 mi    16x16     51.2 km / 32 mi    25.6 km / 16 mi
// Grid2	12.8 km / 8 mi    16x16    204.8 km / 128 mi  102.4 km / 64 mi
//
// TEXTURE MAPS:
//            Displacement    Normal        Diffuse           Rougness
// Grid0      Animated 4x    Animated 4x    Static 1/16      Static 1/16
// Grid1        None         Animated 4x    Static 1/16      Static 1/16
// Grid2        None         Static  16x    Static 1x        Static 1x

// Previously Grid0 squares were 1/4 the size of Grid1 squares which meant that we had to flip over
// a block of 4x4 Grid0 squares at at time. Since this made the 4x4 Grid0 squares equivalent to
// a Grid1 squares, we changed Grid0 squares to be the same size as Grid1 squares and flipped them 
// over 1 at a time. We increased the resolution of displacement and normal maps by repeating
// then 4x in each direction.

// @grd_ variable
// Here is the main grd_ variable:
//grd_ = {
//	MSP: new THREE.Vector3 (),	// MSX, MPY, MSZ (meters) (from Flight)
//	RCs: 16,				// Squares in each of first 2 grids
//	Siz: GrdSiz,			// Size of smallest square
//	Stp: 4,					// Squares in each of first 2 grids
//	Seg: GrdSeg,			// Segments for smallest square
//	Grx: [],				// Index of Grids (0-2)
//	Geo: [],				// Master Index of Basic Geometries
//	Col: WtrCol,			// Color
//	Dsp: 0,					// Grid 0 Displacement Map (from Ocean)
//	Nrm: 0,					// Grid 0-1 Normal Map (from Ocean)
//	Df0: [],				// Grid 0-1 Diffuse Maps
//	Rf0: [],				// Grid 0-1 Roughness Maps
//	Mt0: [],				// Grid 0 Materials
//	Mt1: [],				// Grid 1 Materials
//	Dif: 0,					// Grid 2 Diffuse Map
//	Ruf: 0,					// Grid 2 Roughness Maps
//	Gr2: 0,					// Grid 2 Normal Map
//	Mat: [],				// Grid 2 Materials
//	WMx: WavMax,			// Max wave height, used to lower outer squares
//};

import {Mesh,PlaneGeometry} from 'three';
import {color,texture,normalMap,positionLocal,MeshStandardNodeMaterial} from 'three/tsl';

/*= PROGRAM ==================================================================*/

class GrdMap {

constructor(grd_,scene, vertexShader, vDepth, cameraNear, cameraFar) {
	this.grd_ = grd_;
	this.scene = scene;

//- Grid 0 ---------------------------------------------------------------------
	this.grd_.Grx[0] = {
		Typ:	0,					// Type of Grid - Inner or Outer
		RCs:	grd_.RCs/grd_.Stp,	// Since each square is 4x4, only need 4x4 
		Siz:	grd_.Siz*grd_.Stp,	// Size of square = Sizx4
		Stp:	1,					// Steps (only 1 since use 4x4 squares)
		RCi:	0,					// Rows and Columns Index (computed)
		MZV:	[0],				// Ground Z Value
		MXV:	[0],				// Ground X Value
		Nor:	0,					// Max North Square (updated)
		Est:	0,					// Max East Square (updated)
		Num:	0,					// Size of array (computed)
		Ptr:	[0],				// Ground Address
		Shd:	1,					// Shadow enabled
		RCF:	0,					// N/A
		NSA:	0,					// N/A
		EWA:	0,					// N/A
	}
//- Grid 1 ---------------------------------------------------------------------
	this.grd_.Grx[1] = {
		Typ:	1,					// Type of Grid - Inner or Outer
		RCs:	grd_.RCs,			// Rows and Columns - use odd number
		Siz:	grd_.Grx[0].Siz,	// Size of square = same as Grid0
		Stp:	grd_.Stp,			// Steps
		RCi:	0,					// Rows and Columns Index (computed)
		MZV:	[0],				// Ground Z Value
		MXV:	[0],				// Ground X Value
		Nor:	0,					// Max North Square (updated)
		Est:	0,					// Max East Square (updated)
		Num:	0,					// Size of array (computed)
		Ptr:	[0],				// Ground Address
		Shd:	0,					// Shadow enabled ### off for outergrids
		RCF:	grd_.Grx[0].RCs/grd_.Grx[0].Stp,	// Cut-Out Area (4x4)
		NSA:	0,					// Shared North/South Adjustment (updated)
		EWA:	0,					// Shared East/West Adjustment (updated)
	}
//- Grid 2 ---------------------------------------------------------------------
	this.grd_.Grx[2] = {
		Typ:	2,					// Type of Grid - Inner or Outer
		RCs:	grd_.RCs,			// Rows and Columns - use odd number (for now = divisible by 3)
		Siz:	grd_.Grx[1].Siz*grd_.Grx[1].Stp,	// Size of square
		Stp:	1,					// Squares to flip
		RCi:	0,					// Rows and Columns Index (computed)
		MZV:	[0],				// Ground Z Value
		MXV:	[0],				// Ground X Value
		Nor:	0,					// Max North Square (updated)
		Est:	0,					// Max East Square (updated)
		Num:	0,					// Size of array (computed)
		Ptr:	[0],				// Ground Address
		Shd:	0,					// Shadow enabled ### off for outergrids
		RCF:	grd_.Grx[1].RCs/grd_.Grx[1].Stp,	// Cut-Out Area (16x16)
		NSA:	0,					// Shared North/South Adjustment (updated)
		EWA:	0,					// Shared East/West Adjustment (updated)
	}
	this.grd_.Nrm.repeat.set(this.grd_.Stp,this.grd_.Stp);
	this.grd_.Dsp.repeat.set(this.grd_.Stp,this.grd_.Stp);
	this._initGeoMat(this.grd_,this.scene);	// Init Grid Materials
	this._init1GrMap(this.grd_.Grx[0], grd_,this.scene);
	this._init1GrMap(this.grd_.Grx[1], grd_,this.scene);
	this._init1GrMap(this.grd_.Grx[2], grd_,this.scene);
}

_initGeoMat(grd_,scene, vertexShader, vDepth, cameraNear, cameraFar) {
// Define Geometries and Materials Referenced in grd_.Geo and grd_.Mat
	// Grid0 ------------------------------------------------------------------
	// For Grid0, using geometry = siz*stp since flip over stp at a time
	// Color texture is full-sized, normal and displacement maps repeat
	let n = 0;
	let idx = 0;
	let normalMapScale = grd_.NMS;
	// Create 4 Textures
	for (let z = 0; z < 4; z++) {
		for (let x = 0; x < 4; x++) {
			grd_.Mt0[idx] = new MeshStandardNodeMaterial({
				colorNode: color(grd_.Col),
				map: grd_.Df0[idx],
				metalness: 0.5,			// 1 for max reflection
				roughness: 0.5,			// 0 for max reflection
				roughnessMap: grd_.Rf0[idx],
				normalNode: normalMap(texture(grd_.Nrm),normalMapScale),
				positionNode: positionLocal.add(texture(grd_.Dsp)),
				envMap: scene.background,			
				envMapIntensity: 0.5,		// max reflection suggested = 5
			});
			grd_.Mt0[idx].vertexNode = vertexShader(vertexShaderParams); // ### log
			grd_.Mt0[idx].depthNode = perspectiveDepthToLogarithmicDepth(vDepth, cameraNear, cameraFar); // ### log
			idx++
		}
	}
	// Single 4x4 Geometry works for all
	let sz0 = grd_.Siz*grd_.Stp;
	let sg0 = grd_.Seg*grd_.Stp;
	grd_.Geo[n] = new PlaneGeometry(sz0,sz0,sg0,sg0);
	grd_.Geo[n].rotateX(-Math.PI*0.5);
	//- Grid1 ------------------------------------------------------------------
	// For Grid1, using geometry = siz*stp
	// Color texture is full-sized, normal and displacement maps repeat
	n = 1;
	idx = 0;
	for (let z = 0; z < 4; z++) {
		for (let x = 0; x < 4; x++) {
			grd_.Mt1[idx] = new MeshStandardNodeMaterial({	// Normal Map Only, 
				colorNode: color(grd_.Col),
				map: grd_.Df0[idx],
				metalness: 0.5,		// 1 for max reflection
				roughness: 0.5,		// 0 for max reflection
				roughnessMap: grd_.Rf0[idx],
				normalNode: normalMap(texture(grd_.Nrm),normalMapScale),
				envMap: scene.background,
				envMapIntensity: 0.5,	// max reflection suggested = 5	
				premultipliedAlpha: true,
			});
			grd_.Mt1[idx].vertexNode = vertexShader(vertexShaderParams); // ### log
			grd_.Mt1[idx].depthNode = perspectiveDepthToLogarithmicDepth(vDepth, cameraNear, cameraFar); // ### log
			idx++
		}
	}
	// Single Geometry works for all
	grd_.Geo[n] = new PlaneGeometry(sz0,sz0);
	grd_.Geo[n].rotateX(-Math.PI*0.5);
	//- Grid2 ------------------------------------------------------------------
	n = 2;
	grd_.Mat[n] = new MeshStandardNodeMaterial({
		colorNode: color(grd_.Col),
		map: grd_.Dif,			// Full-Sized Texture
		metalness: 0.5,			// 1 for max reflection
		roughness: 0.5,			// 0 for max reflection
		roughnessMap: grd_.Ruf,
		normalMap: grd_.Nrm,	// Static normalMap
		envMap: scene.background,
		envMapIntensity: 0.5,		// max reflection suggested = 5
		premultipliedAlpha: true,
	});
	grd_.Mat[n].vertexNode = vertexShader(vertexShaderParams); // ### log
	grd_.Mat[n].depthNode = perspectiveDepthToLogarithmicDepth(vDepth, cameraNear, cameraFar); // ### log
	// Single Geometry works for all
	let sz1 = sz0*grd_.Stp;
	grd_.Geo[n] = new PlaneGeometry(sz1,sz1);
	grd_.Geo[n].rotateX(-Math.PI*0.5);
}

//- Init Moving Map (Ocean) ----------------------------------------------------

_init1GrMap(grx_, grd_, scene) {
	// Load Variables
	grx_.RCi = grx_.RCs-1;					// Max Index Value
	grx_.MZV[grx_.RCi] = 0;					// Z-Values
	grx_.MXV[grx_.RCi] = 0;					// X-Values
	grx_.Nor = grx_.RCi;					// Max North Square (updated)
	grx_.Est = grx_.RCi;					// Max East Square (updated)
	grx_.Num = grx_.RCs * grx_.RCs;			// Size of array
	grx_.Ptr[grx_.Num-1] = 0;				// Mesh Pointers
	if (grx_.Typ > 0) {
		grx_.NSA = (grx_.RCs-grx_.RCF)/2;	// (27-3=6)
		grx_.EWA = grx_.NSA;
	}
	// Compute Starting Z and X Values
	let zx = -0.5*(grx_.RCs)*grx_.Siz+0.5*grx_.Siz;
	for (let i = 0; i < grx_.RCs; i++) {
		grx_.MZV[i] = zx;
		grx_.MXV[i] = zx;
		zx = zx + grx_.Siz;
	}
	// Load Geometry and Material
	let geometry = grd_.Geo[grx_.Typ];
	let material = grd_.Mat[grx_.Typ];			// Grid 2 only
	// Set Starting Position of Squares
	let n = 0;
	let idx;
	for (let z = 0; z < grx_.RCs; z++) {		// Row
		for (let x = 0; x < grx_.RCs; x++) {	// Column
			if (grx_.Typ == 0) {				// Grid 0 Load one of 4x4 materials into 4x4 places
				idx = ((x%4)+2)%4 + ((z%4)+2)%4*4;	// Center X and Z
				material = grd_.Mt0[idx];
			}
			if (grx_.Typ == 1) {				// Grid 1 Load one of 4x4 materials into 16x16 places
				idx = (x%4) + (z%4)*4;
				material = grd_.Mt1[idx];
			}
			grx_.Ptr[n] = new Mesh(geometry,material);
			if (grx_.Shd == 1) grx_.Ptr[n].receiveShadow = true;
			scene.add(grx_.Ptr[n]);
			grx_.Ptr[n].position.set(grx_.MXV[x],-grd_.MSP.y,-grx_.MZV[z]);
			if (grx_.Typ > 0) grx_.Ptr[n].position.y = grx_.Ptr[n].position.y-grd_.WMx;
			n++;
		}
	}
}

//= UPDATE =====================================================================

update() {
	this._move1GrMap(this.grd_.Grx[0],this.grd_);
	this._move1GrMap(this.grd_.Grx[1],this.grd_);
	this._move1GrMap(this.grd_.Grx[2],this.grd_);
}

//- Move Moving Map ------------------------------------------------------------

_move1GrMap(grx_, grd_) {
	let grd1_ = grd_.Grx[1];
	let grd2_ = grd_.Grx[2];
	let j, v = 0;
	let max = 0.5*grx_.RCs*grx_.Siz;
	let min = -max;
	// Update ZX
	for (let i = 0; i < grx_.RCs; i++) {
		grx_.MZV[i] = grx_.MZV[i] - grd_.MSP.z;	// Rows
		grx_.MXV[i] = grx_.MXV[i] - grd_.MSP.x;	// Columns
	}
	// Test North/South
	if (grd_.MSP.z < 0) {					// If Moving South
		j = grx_.Nor;
		if (grx_.MZV[j] >= max) {
			v = min+(grx_.MZV[j]-max);
			for (let i = 0; i < grx_.Stp; i++) {
				grx_.MZV[j] = v;
				j = j - 1;
				if (j < 0) j = grx_.RCi;
				v = v - grx_.Siz;
			}
			grx_.Nor = grx_.Nor - grx_.Stp;
			if (grx_.Nor < 0) grx_.Nor = grx_.Nor + grx_.RCs;
			if (grx_.Typ == 0) grd1_.NSA = grd1_.NSA - 1;
			if (grx_.Typ == 1) {
				grx_.NSA = grx_.NSA + grx_.Stp;
				grd2_.NSA = grd2_.NSA - 1;
			}
			if (grx_.Typ == 2) grd2_.NSA = grd2_.NSA + grx_.Stp;
		}
	}
	if (grd_.MSP.z > 0) {					// If Moving North
		j = grx_.Nor + 1;
		if (j > grx_.RCi) j = 0;
		if (grx_.MZV[j] <= min) {
			v = max-(min-grx_.MZV[j]);
			for (let i = 0; i < grx_.Stp; i++) {
				grx_.MZV[j] = v;
				j++;
				if (j > grx_.RCi) j = 0;
				v = v + grx_.Siz;
			}
			grx_.Nor = grx_.Nor + grx_.Stp;
			if (grx_.Nor > grx_.RCi) grx_.Nor = grx_.Nor - grx_.RCs;
			if (grx_.Typ == 0) grd1_.NSA = grd1_.NSA + 1;
			if (grx_.Typ == 1) {
				grx_.NSA = grx_.NSA - grx_.Stp;
				grd2_.NSA = grd2_.NSA + 1;
			}
			if (grx_.Typ == 2) grd2_.NSA = grd2_.NSA - grx_.Stp;
		}
	}
	// Test East/West
	if (grd_.MSP.x < 0) {					// If Moving West
		j = grx_.Est;
		if (grx_.MXV[j] >= max) {
			v = min+(grx_.MXV[j]-max);
			for (let i = 0; i < grx_.Stp; i++) {
				grx_.MXV[j] = v;
				j = j - 1;
				if (j < 0) j = grx_.RCi;
				v = v - grx_.Siz;
			}
			grx_.Est = grx_.Est - grx_.Stp;
			if (grx_.Est < 0) grx_.Est = grx_.Est + grx_.RCs;
			if (grx_.Typ == 0) grd1_.EWA = grd1_.EWA - 1;
			if (grx_.Typ == 1) {
				grx_.EWA = grx_.EWA + grx_.Stp;
				grd2_.EWA = grd2_.EWA - 1;
			}
			if (grx_.Typ == 2) grd2_.EWA = grd2_.EWA + grx_.Stp;
		}
	}
	if (grd_.MSP.x > 0) {						// If Moving East
		j = grx_.Est + 1;
		if (j > grx_.RCi) j = 0;	
		if (grx_.MXV[j] <= min) {
			v = max-(min-grx_.MXV[j]);
			for (let i = 0; i < grx_.Stp; i++) {			
				grx_.MXV[j] = v;
				j++;
				if (j > grx_.RCi) j = 0;
				v = v + grx_.Siz;
			}
			grx_.Est = grx_.Est + grx_.Stp;
			if (grx_.Est > grx_.RCi) grx_.Est = grx_.Est - grx_.RCs;
			if (grx_.Typ == 0) grd1_.EWA = grd1_.EWA + 1;
			if (grx_.Typ == 1) {
				grx_.EWA = grx_.EWA - grx_.Stp;
				grd2_.EWA = grd2_.EWA + 1;
			}
			if (grx_.Typ == 2) grd2_.EWA = grd2_.EWA - grx_.Stp;
		}
	}
	// Set Position
	let n = 0;
	for (let r = 0; r < grx_.RCs; r++) {	// Row
		for (let c = 0; c < grx_.RCs; c++) {	// Col
			grx_.Ptr[n].position.set(grx_.MXV[c],-grd_.MSP.y,-grx_.MZV[r]);
			if (grx_.Typ > 0) grx_.Ptr[n].position.y = -grd_.MSP.y-grd_.WMx;
			grx_.Ptr[n].visible = true;	// Default for Outer Grid
			n++;
		}
	}
	// Outer Grids Only - Make Cut-Out Area Invisible
	if (grx_.Typ > 0) {
		let r = grx_.Nor + 1 + grx_.NSA;		// Get Lower index
		if (r > grx_.RCi) r = r - grx_.RCs;
		let c = grx_.Est + 1 + grx_.EWA;		// Get Left Index
		if (c > grx_.RCi) c = c - grx_.RCs;
		for (let i = 0; i < grx_.RCF; i++) {
			n = r * grx_.RCs + c;
			if (n < 0) n = n + grx_.Num;
			if (n > grx_.Num) n = n - grx_.Num;
			let n2 = (r+1) * grx_.RCs - 1;
			if (n2 > grx_.Num) n2 = n2 - grx_.Num;
			if (n2 < 0) n2 = n2 + grx_.Num;
			for (let j = 0; j < grx_.RCF; j++) {
				grx_.Ptr[n].visible = false;
				n++;
				if (n > n2) n = n - grx_.RCs; 
				if (n < 0) n = n + grx_.Num;
				if (n > grx_.Num) n = n - grx_.Num;
			}
			r++;
			if (r > grx_.RCi) r = r - grx_.RCs;
		}
	}
}

}	// END OF MODULE

export {GrdMap};

//= REVISIONS ==================================================================
//- 230530	Created this simplified version of GrdMap by moving Grid Definitions 
//			and routines for creating Geometries and Materials into this Module
//- 240108	This version 2 initalizes large-sized diffuse and roughness maps
//			grx_ changed to grd_ and, in subroutines, grx_.Grd[] to grd_.Grx[]
//- 240903	Converted to Class
//- 240908	Turned off shadows for outer grids (due to changes made by r168)
