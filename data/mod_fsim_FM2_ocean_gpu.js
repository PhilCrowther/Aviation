//= DATA MODULE ================================================================

//	Updated: 5 Oct 2024

import {BoxGeometry,Color,Euler,Mesh,MeshBasicMaterial,Vector2,Vector3} from 'three';

//= GRDWTR MODULE ==============//==============================================
//	This ocean map has 3 nested grids of squares.
//	Grid0 has 16x16 squares, each of size GrdSiz (e.g. 1 mile, range = 8 miles)
//	Grid1 has 16x16 squares, each of size GrdSi*4z (e.g. 4 miles, range = 32 miles)
//	Grid2 has 16x16 squares, each of size GrdSiz*16 (e.g. 16 miles, range = 128 miles))
let WtrCol = 0x1060ff;			// Water (Nodes)
let GrdSiz = 1600;				// 1600 = 1 mile
let GrdRes = 512;
let GrdSeg = 256;				// Segments per Plane (256 = OK, 512 = too much)
let grd_ = {
		MSP: new Vector3(),		// MSX, MPY, MSZ (meters) (from Flight)
		RCs: 16,				// Squares in each of first 2 grids
		Siz: GrdSiz,			// Size of smallest square
		Stp: 4,					// Squares in each of first 2 grids
		Seg: GrdSeg,			// Segments for smallest square
		Grx: [],				// Index of Grids (0-2)
		Geo: [],				// Master Index of Basic Geometries
		Col: new Color(WtrCol),	// Color
		Dsp: 0,					// Grid 0 Displacement Map (from Ocean)
		Nrm: 0,					// Grid 0-1 Normal Map (from Ocean)
		NMS: new Vector2(),		// Grid 0-1 Normal Map Scale (from Ocean)
		Df0: [],				// Grid 0-1 Diffuse Maps
		Rf0: [],				// Grid 0-1 Roughness Maps
		Mt0: [],				// Grid 0 Materials
		Mt1: [],				// Grid 1 Materials
		Dif: 0,					// Grid 2 Diffuse Map
		Ruf: 0,					// Grid 2 Roughness Maps
		Gr2: 0,					// Grid 2 Normal Map
		Mat: [],				// Grid 2 Materials
		WMx: 5,					// Max wave height, used to lower outer squares
	};
//	Since textures must be loaded in the Main Program and since design of materials 
//	and goemetry can vary, some of the Grid initialization is handled in the Main Program
//  by the LoadGeoMat and InitGeoMat routines

//= OCEAN MODULE ===============//==============================================
let WndSpd = 10.0;
let WndHdg = 30.0;
let Choppy = 1.5;
let AnmSpd = 0.5;				// Can vary with GrdSiz
let wav_ = {
		// Sources
		Res: GrdRes,			// Resolution - segments per square (default = 512)
		Siz: GrdSiz,			// Size of Smallest Square = default = 3200m = 2 miles
		WSp: WndSpd,			// Wind Speed
		WHd: WndHdg,			// Wind Heading
		Chp: Choppy,			// default = 1
		// Animated Maps
		Dsp: 0,					// The Displacement Map
		Nrm: 0,					// The Normal Map
		NMS: new Vector2(1,1),	// Normal Map Scale (flip Y for left-handed maps)
		Spd: AnmSpd
	};

//= STATIC AND MOVING OBJECTS ==//==============================================
//- Islands --------------------------------------------------------------------
let isl_ = {
		Num: 2,
		Mdl: ["https://PhilCrowther.github.io/Aviation/scenery/models/homebase_ctr0.glb",
			  "https://PhilCrowther.github.io/Aviation/scenery/models/giaros.glb"],
		Txt: ["https://PhilCrowther.github.io/Aviation/scenery/textures/homebase.png",
			  "https://PhilCrowther.github.io/Aviation/scenery/textures/giaros.png"],
		Ptr: [],
		Siz: [new Vector3(MtrMil,MtrMil,MtrMil),
			  new Vector3(1.5*MtrMil,1.5*MtrMil,1.5*MtrMil)],
		Rot: [new Euler()],
		Pos: [new Vector3(610,30,5275),new Vector3(-1610,10,2440)],
		Ord: [0,0],				// renderOrder (not used)
		Ref: [makMsh(),makMsh()]
	};
//- Volcano Smoke --------------------------------------------------------------
let vlk_ = {
		Src: "https://PhilCrowther.github.io/Aviation/textures/fx/smoke1r.png",
		Map: 0,
		Mat: 0,
		Ptr: 0,
		Pos: new Vector3(50,75,25), // Relative Position
		Ord: 1,					// renderOrder
		Ref: isl_.Ref[0]
	};
//- General Static Objects: Linked ---------------------------------------------
//- 0 = Hangar
let lnk_ = {
		Num: 1,
		Src: ["https://PhilCrowther.github.io/Aviation/scenery/models/hangar.glb"],
		Ptr: [],				// Loaded Object
		Siz: [new Vector3(Ft2Mtr,Ft2Mtr,Ft2Mtr)],
		Rot: [new Euler()],
		Pos: [new Vector3(-562,-22.5,-363)], // Relative Position
		Ord: [1],				// renderOrder
		Ref: [isl_.Ref[0]]
	};
//- General Static Objects: Unlinked -------------------------------------------
//- Nothing yet
let fxd_ = {
		Num: 0,
		Src: ["https://PhilCrowther.github.io/Aviation/"],
		Ptr: [],				// Loaded Object
		Siz: [new Vector3(Ft2Mtr,Ft2Mtr,Ft2Mtr)],
		Rot: [new Euler()],
		Pos: [new Vector3()],	// Relative Position
		Ord: [1]				// renderOrder
	};

//= TRAFFIC ====================//==============================================
//- Airplane -------------------------------------------------------------------
let XPPath = "https://PhilCrowther.github.io/Aviation/models/vehicles/";
let XPFile = "fm2_flyt_xp1.glb"; // Name of airplane model file (rotated blender file)
//	Data
let xac_ = {
		Num: 1,					// Number of airplanes
		FNm: [XPPath+XPFile],	// Source file
		Ptr: [0],				// Object Address
		Spd: [91.5],			// Speed (mtr/sec) (91.5 ms = 329 kph = 205 mph)
		Rot: [new Vector3(0,0,30)],
		MpS: [new Vector3()],	// not used
		MpP: [new Vector3(180,100,5300)], // meters
		Dst: [0],				// Object distance (meters) used to activate effects
		// Animations
		MxS: [0],				// Animation Mixer - Prop
		MxP: [0],				// Animation Mixer - Pitch
		MxB: [0],				// Animation Mixed - Bank
		AnP: [0],				// Animation - Pitch
		AnB: [0],				// Animation - Bank
		// Sound
		Snd: ["fm2_prop.wav"],	// Prop
		Vol: [1]
	}
//- Aircraft Carrier -----------------------------------------------------------
//let CVEMsh = makMsh();			// To hold CVE and smoke
//	CVEMsh.rotation.order = "YXZ";
//	scene.add(CVEMsh);			// Uses position of CVE to compute relative position
let XSPath = "https://PhilCrowther.github.io/Aviation/models/vehicles/";	// Other Planes
let XSFile = "CVE_noflag.glb";
//	Data
let xsh_ = {
		Num: 1,					// Number of ships
		FNm: [XSPath+XSFile],	// Source File
		Ptr: [0],				// Object Address
		Spd: [9],				// Speed (mtr/sec) (9 ms = 34 kph = 20 mph) [top speed = 21 mph]
		Rot: [new Euler()], 	// Object Rotation
		MpS: [new Vector3()],	// Object Map Speed (mtr/sec) used by airplane if landed
		MpP: [new Vector3(-4133,0.1,146)], // Object Map Position (meters) [used by Mesh]
		Dst: [0],				// Object distance (meters) used to activate effects
		Ref: [makMsh()],
		// Animations
		Mx0: [0],				// Animation Mixer - Radar
		An0: [0]				// Animation - Radar
	}
//. Wake .......................................................................
let wak_ = {
		Src: ["https://PhilCrowther.github.io/Aviation/textures/fx/smoke1.png"],
		Map: [],
		Mat: [],
		Ptr: [],
		Ref: [xsh_.Ref[0]]
		};
//. Flag .......................................................................
let	flg_ = {
		// Material and Geometry
		Src: "https://PhilCrowther.github.io/Aviation/models/vehicles/textures/USA.png",
		Mat: 0,
		Geo: 0,					// Geometry Address (can use this for all flags)
		Siz: new Vector2(3,1.8), // Size ZY (meters)
		Seg: new Vector2(50,1), // Segments ZY
		// Mesh
		Ptr: 0,
		Rot: new Euler(0,270*DegRad,0),
		MpP: new Vector3(44.2,92.47,-58.93), // Map Position		
		// Animation
		Tim: 0,
		Wav: 1.5,				// Number of waves per Plane
		Deg: 0,					// Degrees per segment (360/5 = 72)
		Amp: 0.1524,			// Amplitude (meters = 0.5 ft)
		Per: 2,					// Period (seconds) to complete cycle
		// Viz Test
		Viz: 152.4,				// (meters)
		Ref: xsh_.Ref[0]
	}

//= MINIMUM ALTITUDE ===========//==============================================
let alt_ = {
		Num: 2,
		Ref: [isl_.Ref[0],xsh_.Ref[0]],
		Var: [0,xsh_],
		Typ: [0,1], 			// 0 = stationary, 1 = movine
		Alt: [7.59,13.1],
		Lft: [-635,-13.2],
		Rgt: [-585,13.2],
		Fnt: [410,70.5],
		Bak: [-335,-70.5],
	}

//= SUBROUTINES ================//==============================================

//- Make Mesh ------------------------------------------------------------------
function makMsh() {
	let geometry = new BoxGeometry(0.01,0.01,0.01); 
	let material = new MeshBasicMaterial({transparent:true,opacity:0}); 
	let mesh = new Mesh(geometry, material);
return mesh;}

//= EXPORT =====================================================================

export {grd_,wav_,isl_,vlk_,lnk_,fxd_,xac_,xsh_,wak_,flg_,alt_};

