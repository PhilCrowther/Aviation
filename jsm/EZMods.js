/*******************************************************************************
*
*	EZ MODULES
*
********************************************************************************

Copyright 2017-26, Phil Crowther <phil@philcrowther.com>
Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
Version dated 26 Jan 2026

@fileoverview
This moduel contains functions creating a scrolling grid map for Land
*/

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	Color,
	LineBasicNodeMaterial,
	LineSegments,
	PlaneGeometry,
} from 'three';

import {color} from 'three/tsl';

/*******************************************************************************
*
*	CONSTANTS
*
*******************************************************************************/

//=	CONVERSIONS ================//==============================================
let Ft2Mtr = 0.3048;			// Convert Feet to Meters
let DegRad = Math.PI/180;		// Convert Degrees to Radians

//= GROUND SQUARES =============//==============================================
// Layer 1 constains smaller higher definition squares
// Layer 2 contains larger lower definition squares (3X size of Layer 1 squares)
//- All Grids ------------------------------------------------------------------
let GrdSiz = 1609.33;			// Grid Size 1 Mile (1609.33m)
// Used to Position Map
let Grd0 = {
		SPS: new THREE.Vector3().copy(BegPos), // Map XSpd, YPos, ZSpd
	}
//= Grid 4 ---------------------------------------------------------------------
let Grd4 = {
		Typ: 4,					// Type of Grid - Inner or Outer
		RCs: 27,				// Rows and Columns - use odd number (for now = divisible by 3)
		Siz: GrdSiz,			// Size of square
		Stp: 3,					// Steps
		RCi: 0,					// Rows and Columns Index (computed)
		MZV: [0],				// Ground Z Value
		MXV: [0],				// Ground X Value
		Nor: 0,					// Max North Square (updated)
		Est: 0,					// Max East Square (updated)
		Num: 0,					// Size of array (computed)
		Ptr: [0],				// Ground Address
		RCF: 0,					// N/A
		NSA: 0,					// Shared North/South Adjustment (updated)
		EWA: 0,					// Shared East/West Adjustment (updated)
		Mat: 0					// Match Material of Outer and Inner Blocks
	}
//- Grid 5 ---------------------------------------------------------------------
let Grd5 = {
		Typ: 5,					// Type of Grid - Inner or Outer
		RCs: 27,				// Rows and Columns - use odd number (for now = divisible by 3)
		Siz: Grd4.Siz*Grd4.Stp,	// Size of square
		Stp: 3,					// Steps (### changed)
		RCi: 0,					// Rows and Columns Index (computed)
		MZV: [0],				// Ground Z Value
		MXV: [0],				// Ground X Value
		Nor: 0,					// Max North Square (updated)
		Est: 0,					// Max East Square (updated)
		Num: 0,					// Size of array (computed)
		Ptr: [0],				// Ground Address
		RCF: Grd4.RCs/Grd4.Stp,	// Cut-Out Area (27/3 = 9)
		NSA: 0,					// Shared North/South Adjustment (updated)
		EWA: 0,					// Shared East/West Adjustment (updated)
		Mat: 0					// Match Material of Outer and Inner Blocks
	}

/*******************************************************************************
*
*	GRID MAP
*
*******************************************************************************/

function initGrdMap(GrdSPS) {
	init1GrMap(GrdSPS,Grd4);
	init1GrMap(GrdSPS,Grd5);
}

function moveGrdMap(GrdSPS) {
	move1GrMap(GrdSPS,Grd4);
	move1GrMap(GrdSPS,Grd5);
}

//= Init Grid Map ==============================================================

function init1GrMap(Grd) {
	// Load Variables
	Grd.RCi = Grd.RCs-1;				// Max Index Value
	Grd.MZV[Grd.RCi] = 0;				// Z-Values
	Grd.MXV[Grd.RCi] = 0;				// X-Values
	Grd.Nor = Grd.RCi;					// Max North Square (updated)
	Grd.Est = Grd.RCi;					// Max East Square (updated)
	Grd.Num = Grd.RCs * Grd.RCs;		// Size of array
	Grd.Ptr[Grd.Num-1] = 0;				// Mesh Pointers
	if (Grd.Typ > 4) {
		Grd.NSA = (Grd.RCs-Grd.RCF)/2;	// (27-3=6)
		Grd.EWA = Grd.NSA;
	}
	// Compute Starting Z and X Values
	let zx = -0.5*(Grd.RCs)*Grd.Siz+0.5*Grd.Siz;
	for (let i = 0; i < Grd.RCs; i++) {
		Grd.MZV[i] = zx;
		Grd.MXV[i] = zx;
		zx = zx + Grd.Siz;
	}
	let geometry;
	if (Grd.Typ == 4) geometry = new PlaneGeometry(Grd.Siz, Grd.Siz,2,2);
	if (Grd.Typ == 5) geometry = new PlaneGeometry(Grd.Siz, Grd.Siz, 2*Grd4.Stp, 2*Grd4.Stp);
	ToQuads(geometry);
	let airmat = new LineBasicNodeMaterial({colorNode: color("green")});
	// Set Starting Position of Squares
	let n = 0;
	for (let y = 0; y < Grd.RCs; y++) {		// Row
		for (let x = 0; x < Grd.RCs; x++) {	// Column
			Grd.Ptr[n] = new LineSegments(geometry,airmat);
			Grd.Ptr[n].rotation.x = -90*DegRad;
			scene.add(Grd.Ptr[n]);
			Grd.Ptr[n].position.set(Grd.MXV[x],-GrdSPS.y,-Grd.MZV[y]);
			n++;
		}
	}
}

function ToQuads(g) {
  let p = g.parameters;
  let segmentsX = (g.type == "TorusGeometry" ? p.tubularSegments : p.radialSegments) || p.widthSegments || p.thetaSegments || (p.points.length - 1) || 1;
  let segmentsY = (g.type == "TorusGeometry" ? p.radialSegments : p.tubularSegments) || p.heightSegments || p.phiSegments || p.segments || 1;
  let indices = [];
  for (let i = 0; i < segmentsY + 1; i++) {
    let index11 = 0;
    let index12 = 0;
    for (let j = 0; j < segmentsX; j++) {
      index11 = (segmentsX + 1) * i + j;
      index12 = index11 + 1;
      let index21 = index11;
      let index22 = index11 + (segmentsX + 1);
      indices.push(index11, index12);
      if (index22 < ((segmentsX + 1) * (segmentsY + 1) - 1)) {
        indices.push(index21, index22);
      }
    }
    if ((index12 + segmentsX + 1) <= ((segmentsX + 1) * (segmentsY + 1) - 1)) {
      indices.push(index12, index12 + segmentsX + 1);
    }
  }
  g.setIndex(indices);
}

//= Move Grid Map ============================================================

function move1GrMap(Grd) {
	let j = 0;
	let v = 0; 
	let max = 0.5*Grd.RCs*Grd.Siz;
	let min = -max;
	// Update Z, X and Y-Values
	for (let i = 0; i < Grd.RCs; i++) {
		Grd.MZV[i] = Grd.MZV[i] - GrdSPS.z;	// Rows
		Grd.MXV[i] = Grd.MXV[i] - GrdSPS.x;	// Columns
	}
	Grd.MYV = GrdSPS.y;					// Altitude
	// Test North/South
	if (GrdSPS.z < 0) {					// If Moving South
		j = Grd.Nor;
		if (Grd.MZV[j] >= max) {
			v = min+(Grd.MZV[j]-max);
			for (let i = 0; i < Grd.Stp; i++) {
				Grd.MZV[j] = v;
				j = j - 1;
				if (j < 0) j = Grd.RCi;
				v = v - Grd.Siz;
			}
			Grd.Nor = Grd.Nor - Grd.Stp;
			if (Grd.Nor < 0) Grd.Nor = Grd.Nor + Grd.RCs;
			if (Grd.Typ == 2) Grd.NSA = Grd.NSA + 1;
			else Grd5.NSA = Grd5.NSA - 1;
		}
	}
	if (GrdSPS.z > 0) {					// If Moving North
		j = Grd.Nor + 1;
		if (j > Grd.RCi) j = 0;
		if (Grd.MZV[j] <= min) {
			v = max-(min-Grd.MZV[j]);
			for (let i = 0; i < Grd.Stp; i++) {
				Grd.MZV[j] = v;
				j = j + 1;
				if (j > Grd.RCi) j = 0;
				v = v + Grd.Siz;
			}
			Grd.Nor = Grd.Nor + Grd.Stp;
			if (Grd.Nor > Grd.RCi) Grd.Nor = Grd.Nor - Grd.RCs;
			if (Grd.Typ == 2) Grd.NSA = Grd.NSA - 1;
			else Grd5.NSA = Grd5.NSA + 1;
		}
	}
	// Test East/West
	if (GrdSPS.x < 0) {					// If Moving West
		j = Grd.Est;
		if (Grd.MXV[j] >= max) {
			v = min+(Grd.MXV[j]-max);
			for (let i = 0; i < Grd.Stp; i++) {
				Grd.MXV[j] = v;
				j = j - 1;
				if (j < 0) j = Grd.RCi;
				v = v - Grd.Siz;
			}
			Grd.Est = Grd.Est - Grd.Stp;
			if (Grd.Est < 0) Grd.Est = Grd.Est + Grd.RCs;
			if (Grd.Typ == 2) Grd.EWA = Grd.EWA + 1;
			else Grd5.EWA = Grd5.EWA - 1;
		}
	}
	if (GrdSPS.x > 0) {						// If Moving East
		j = Grd.Est + 1;
		if (j > Grd.RCi) j = 0;	
		if (Grd.MXV[j] <= min) {
			v = max-(min-Grd.MXV[j]);
			for (let i = 0; i < Grd.Stp; i++) {			
				Grd.MXV[j] = v;
				j = j + 1;
				if (j > Grd.RCi) j = 0;
				v = v + Grd.Siz;
			}
			Grd.Est = Grd.Est + Grd.Stp;
			if (Grd.Est > Grd.RCi) Grd.Est = Grd.Est - Grd.RCs;
			if (Grd.Typ == 2) Grd.EWA = Grd.EWA - 1;
			else Grd5.EWA = Grd5.EWA + 1;
		}
	}
	// Set Position
	let n = 0;
	for (let r = 0; r < Grd.RCs; r++) {	// Row
		for (let c = 0; c < Grd.RCs; c++) {	// Col
			Grd.Ptr[n].position.set(Grd.MXV[c],-Grd.MYV,-Grd.MZV[r]);
			Grd.Ptr[n].visible = true;	// Default for Outer Grid
			n = n + 1;
		}
	}
	// Outer Grid Only - Make Cut-Out Area Invisible
	if (Grd.Typ == 2) {
		let r = Grd.Nor + 1 + Grd.NSA;			// Get Lower index
		if (r > Grd.RCi) r = r - Grd.RCs;
		let c = Grd.Est + 1 + Grd.EWA;			// Get Left Index
		if (c > Grd.RCi) c = c - Grd.RCs;
		for (let i = 0; i < Grd.RCF; i++) {
			n = r * Grd.RCs + c;
			if (n < 0) n = n + Grd.Num;
			if (n > Grd.Num) n = n - Grd.Num;
			let n2 = (r+1) * Grd.RCs - 1;
			if (n2 > Grd.Num) n2 = n2 - Grd.Num;
			if (n2 < 0) n2 = n2 + Grd.Num;
			for (let j = 0; j < Grd.RCF; j++) {
				Grd.Ptr[n].visible = false;
				n = n + 1;
				if (n > n2) n = n - Grd.RCs; 
				if (n < 0) n = n + Grd.Num;
				if (n > Grd.Num) n = n - Grd.Num;
			}
			r = r + 1;
			if (r > Grd.RCi) r = r - Grd.RCs;
		}
	}
}

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {initGrdMap,moveGrdMap};

/*******************************************************************************
*
*	REVISIONS
*
********************************************************************************

*/