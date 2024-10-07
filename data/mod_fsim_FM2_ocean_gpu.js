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

//- Sample Variable
let var_ = {
		Num: 1,					// Number of Objects
		Mdl: [0],				// Source File
		Txt: [0],				// Texture Source File
		Ptr: [0],				// Object Address
		Siz: [],				// Scale (e.g. Ft2Mtr)
		Ord: [0],				// renderOrder
		Rot: [new Euler(0,0,0)], // Object Rotation (in radians)
		MpP: [new Vector3(0,0,0)], // Map Position - Absolute or Relative
		Ref: [0],				// Parent Object
		// Moving
		Spd: [0],				// Speed - if Moving (mtr/sec)
		MpS: [new Vector3()], // Map Speed (mtr/sec)
		// Animations (Varies by Object)
		Dst: [0],				// Object distance (meters) used to activate effects
		Mx0: [0],				// Animation Mixer
		An0: [0]				// Animation
	};

//- Islands --------------------------------------------------------------------
let isl_ = {
		Num: 2,
		Mdl: ["https://PhilCrowther.github.io/Aviation/scenery/models/homebase_ctr0.glb",
			  "https://PhilCrowther.github.io/Aviation/scenery/models/giaros.glb"],
		Txt: ["https://PhilCrowther.github.io/Aviation/scenery/textures/homebase.png",
			  "https://PhilCrowther.github.io/Aviation/scenery/textures/giaros.png"],
		Ptr: [],
		Siz: [MtrMil,1.5*MtrMil], // Scale
		Ord: [0,0],				// renderOrder (not used)
		Rot: [new Euler(),new Euler()], // Rotation
		MpP: [new Vector3(610,30,5275),new Vector3(-1610,10,2440)],
		Ref: [makMsh(),makMsh()],
	};
//- Volcano Smoke --------------------------------------------------------------
let vlk_ = {
		Num: 1,
		Mdl: [0],
		Txt: ["https://PhilCrowther.github.io/Aviation/textures/fx/smoke1r.png"],
		Ptr: [0],
		Siz: [4000],			// Scale
		Ord: [1],				// renderOrder
		Rot: [new Euler()], // Rotation (not used)
		MpP: [new Vector3(50,75,25)], // Map Position
		Ref: [isl_.Ref[0]],
		// Moving	
		Spd: [0],				// 0 = not moving
		MpS: [new Vector3()]
	};
//- General Static Objects: Linked ---------------------------------------------
//- 0 = Hangar
let lnk_ = {
		Num: 1,
		Mdl: ["https://PhilCrowther.github.io/Aviation/scenery/models/hangar.glb"],
		Txt: [0],
		Ptr: [],				// Loaded Object
		Siz: [Ft2Mtr],			// Scale
		Ord: [0],				// renderOrder
		Rot: [new Euler()], // Rotation
		MpP: [new Vector3(-562,-22.5,-363)], // Relative Position
		Ref: [isl_.Ref[0]],
	};
//- General Static Objects: Unlinked -------------------------------------------
//- 0 = Fletcher
let fxd_ = {
		Num: 1,
		Mdl: ["https://PhilCrowther.github.io/Aviation/models/vehicles/fletcher.glb"],
		Txt: [0],
		Ptr: [],				// Loaded Object
		Siz: [Ft2Mtr],			// Scale
		Ord: [0],				// renderOrder
		Rot: [new Euler()], // Rotation
		MpP: [new Vector3(-300,0,5275)], // Absolute Position
	};

//= TRAFFIC ====================//==============================================
//- Airplane -------------------------------------------------------------------
let XPPath = "https://PhilCrowther.github.io/Aviation/models/vehicles/";
let XPFile = "fm2_flyt_xp1.glb"; // Name of airplane model file (rotated blender file)
//	Data
let xac_ = {
		Num: 1,					// Number of airplanes
		Mdl: [XPPath+XPFile],	// Model Source file
		Txt: [0],				// Texture Source File (not used)
		Ptr: [0],				// Object Address
		Siz: [Ft2Mtr],			// Scale
		Ord: [0],				// renderOrder (not used)
		Rot: [new Vector3(0,0,30)], // Rotation
		MpP: [new Vector3(180,100,5300)], // meters
		Ref: [0],				// 0 = not linked
		// Moving
		Spd: [91.5],			// Speed (mtr/sec) (91.5 ms = 329 kph = 205 mph)
		MpS: [new Vector3()], // not used
		// Animations
		Dst: [0],				// Object distance (meters) used to activate effects
		MxS: [0],				// Animation Mixer - Prop
		MxP: [0],				// Animation Mixer - Pitch
		MxB: [0],				// Animation Mixed - Bank
		AnP: [0],				// Animation - Pitch
		AnB: [0],				// Animation - Bank
		// Sound
		Snd: ["fm2_prop.wav"],	// Prop
		Vol: [1]
	};
//- Aircraft Carrier -----------------------------------------------------------
let XSPath = "https://PhilCrowther.github.io/Aviation/models/vehicles/";	// Other Planes
let XSFile = "CVE_noflag.glb";
//	Data
let xsh_ = {
		Num: 1,					// Number of ships
		Mdl: [XSPath+XSFile],	// Source File
		Txt: [0],				// Texture Source File (not used)
		Ptr: [0],				// Object Address
		Siz: [Ft2Mtr],			// Scale
		Ord: [0],				// renderOrder (not used)
		Rot: [new Euler()], // Object Rotation
		MpP: [new Vector3(-4133,0.1,146)], // Object Map Position (meters) [used by Mesh]
		Ref: [makMsh()],
		// Moving
		Spd: [9],				// Speed (mtr/sec) (9 ms = 34 kph = 20 mph) [top speed = 21 mph]
		MpS: [new Vector3()], // Object Map Speed (mtr/sec) used by airplane if landed
		// Animations
		Dst: [0],				// Object distance (meters) used to activate effects
		Mx0: [0],				// Animation Mixer - Radar
		An0: [0],				// Animation - Radar
		Pit: [0],				// Pitch
		Lok: [makMsh()]			// Deck Lock
	};
//. Wake .......................................................................
let wak_ = {
		Num: 1,
		Mdl: [0],
		Txt: ["https://PhilCrowther.github.io/Aviation/textures/fx/smoke1.png"],
		Ptr: [0],
		Siz: [4000],			// Scale
		Ord: [1],				// renderOrder
		Rot: [new Euler()], // Rotation (not used)
		MpP: [new Vector3(50,75,25)], // Map Position
		Ref: [xsh_.Ref[0]],
	};

//. Flag .......................................................................
let	flg_ = {
		Num:1,
		// Material and Geometry
		Src: ["https://PhilCrowther.github.io/Aviation/models/vehicles/textures/USA.png"],
		Mat: [0],
		Geo: [0],				// Geometry Address (can use this for all flags)
		Ptr: [0],
		Siz: [1],				// Scale (not used)
		Ord: [0],				// renderOrder (not used)
		Rot: [new Euler(0,270*DegRad,0)],
		MpP: [new Vector3(44.2,92.47,-58.93).multiplyScalar(Ft2Mtr)], // Relative Map Position
		Ref: [xsh_.Ref[0]],	
		// Animation
		Dst: [152.4],			// Visibility Distance (meters)
		Tim: [0],
		Wav: [1.5],				// Number of waves per Plane
		Deg: [0],				// Degrees per segment (360/5 = 72)
		Amp: [0.1524],			// Amplitude (meters = 0.5 ft)
		Per: [2],				// Period (seconds) to complete cycle
	};

//= MINIMUM ALTITUDE ===========//==============================================
//- For pitching deck: compute resting angle and hypotenuse for given z and y distance from ship center
//- If airplane is stationary: as ship pitches, hypotenuse will remain the same and angle will change, based on pitch angle
//- Can compute new y distance = sin(base angle + ship pitch);
//- Use three.js to compute?

let alt_ = {
		Num: 2,
		Ref: [isl_.Ref[0],xsh_.Ref[0]],
		Var: [0,xsh_],
		Typ: [0,1], 			// 0 = stationary, 1 = movine
		Alt: [7.59,13.1],
		Lft: [-635,-13.2],
		Rgt: [-585,13.2],
		Fnt: [410,70.5],
		Bak: [-335,-70.5]
	};
//- Carrier Deck Lock Down
	xsh_.Lok[0].position.y = 1.4+(alt_.Alt[1]-xsh_.MpP[0].y);
	xsh_.Ref[0].add(xsh_.Lok[0]);

//= SUBROUTINES ================//==============================================

//- Make Mesh ------------------------------------------------------------------
function makMsh() {
	let geometry = new BoxGeometry(0.01,0.01,0.01); 
	let material = new MeshBasicMaterial({transparent:true,opacity:0}); 
	let mesh = new Mesh(geometry, material);
return mesh;}

//= EXPORT =====================================================================

export {grd_,wav_,isl_,vlk_,lnk_,fxd_,xac_,xsh_,wak_,flg_,alt_};

