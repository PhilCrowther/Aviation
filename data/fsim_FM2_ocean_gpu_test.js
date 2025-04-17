//= PRE-LOAD DATA ==============================================================
//	No three.js routines allowed since three.js has not been loaded yet.

/*******************************************************************************
*
*	INDEX TO VARIABLES
*
*******************************************************************************

	1. MAIN VARIABLES
	   Constants
	   Input Values					(gen_)
	   Fad2Black					(f2b_)
	2. SKY VARIABLES				(sky_)
	3. OCEAN GRID VARIABLES
		GRDWTR MODULE				(grd_)
		OCEAN MODULE				(wav_)
	4. OBJECT VARIABLES
		SHARED TEXTURES				(txt_)
		STATIC OBJECTS
			Islands					(isl_)
			Fixed Objects			(fxd_)
		MOVING VEHICLES
			Moving Airplanes		(xac_)
			Moving Ships			(xsh_)
		ANIMATED FLAG				(flg_)
		AIRPLANE EXPLOSION			(xae_)
	    SMOKE MODULE
	    	Volcano Smoke			(vlk_)
	    	Ground Fire				(grf_)
	    	Airplane Smoke Trail	(xas_)
	    	Airplane Fire Trail		(xaf_)
	    	Ship Wakes				(wak_)
		MYPEEPS						(myp_)
		MINIMUM ALTITUDE			(alt_)
	5. MY AIRPLANE VARIABLES		(air_)
		FLIGHT MODULE
		ANIMFM2 MODULE				(anm_,mxr_,vxr_)
	x. GUNASG MODULE
			My Guns					(myg_)
			Moving Airplanes		(xag_)
			Moving Ships			(xsg_)
			Fixed Guns				(aaf_)
	6. SOUND VARIABLES
		My Sounds					(mys_)
		Radio Variables				(rad_)
	7. CAMERA VARIABLES				(cam_)
	8. OUTPUT VARIABLES
	9. INPUT VARIABLES
	   Pointer Lock Control
*/

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

//= 1. MAIN VARIABLES ==========//==============================================

//- CONSTANTS ------------------//----------------------------------------------
//	Conversions
const DegRad = Math.PI/180;		// Convert Degrees to Radians
const RadDeg = 180/Math.PI;		// Convert Radians to Degrees
const Ft2Mtr = 0.3048;			// Convert Feet to Meters
const Mtr2Ft = 1/Ft2Mtr;		// Meters to Feet
const Km2Mil = 0.621371;		// Kilometers to Miles
const Mil2Km = 1.60934;			// Miles to Kilometers
const MtrMil = 1609.34;			// Meters per Mile
//	Environmental
const GrvMPS = 9.80665; 		// Gravity (mps)
const BegTmp = 303.15;			// K = 86F (loaded into _air)
// These values could also be used by modules, but that would require that all 
// module users also create a data file - which complicates the use of modules.

//- GENERAL VARIABLES ----------//----------------------------------------------

let gen_ = {
		//- Flght Controls
		PwrMul:	0.0005,			// Power % Input - Mouse Multiplier
		PwrDif:	0,				// Power % Input - Value
		InpBrk:	0,				// Brakes
		//- Display
		PawsOn:	0,				// Pause
		InfoOn:	0,				// Info
		SndFlg:	0,				// Sound (0 = off; 1 = on)
		StatOn:	1,				// Stats (0 = off, 1 = on)
		LnFFlg:	1,				// Lensflare
		//	Program Flags
		LodFlg:	0,				// Set at end of initialization
		LodSnd:	0,				// Set when sound initialized
		MYGFlg:	0,				// My Guns (1 = firing)
		//	Altitude Adjustment
		AltAdj:	0.99,			// Raises objects above map as altitude increases
		AltDif:	0,
	}

let tim_ = {
		DLTime: 1/60,
		DLTim2: 0,
		GrvDLT: 0,
		NowTim: 0,
		DifTim: 0,
	}

//- Fade2Black Values -----------//----------------------------------------------
//	If FadBeg > 0, Prop Invisible.
//	Therefore, limit use to where Prop would be invisible.
let f2b_ = {
		Flr: 0.25,
		Beg: 0.99,
		End: 0.25,
		Spd: 0.005,
		Mat: 0,
		Col: "black",
		Msh: 0,
	}
	
//= 2. SKY VARIABLES ===========//==============================================
let sky_ = {
		// Sun
		SunCol: "white",		// Sun
		SunInt: 3,
		// Fog
		FogCol: 0xbab4a6,		// Sky (for Fog only)
		// SkyBox
		SBxSrc: "https://PhilCrowther.github.io/Aviation/textures/cube/skyboxsun25deg/",
		SunLat: 23,				// Direction - Vert (+/- 90) deg
		SunLon: 312,			// Direction - Horz (0->360) deg
		// Lensflare
		LF0Src: "https://threejs.org/examples/textures/lensflare/lensflare1.png",
		LF1Src: "https://threejs.org/examples/textures/lensflare/lensflare3.png",
		LF0Txt: 0,
		LF1Txt: 0,
		// Shadow Beg Info
		SunDst: 50,				// Distance
		ShdBox: 15,				// Size of shadow box
		ShdBLR: 12,
		ShdBTB: 4,
		ShdDst: 1500,			// Shadow Distance (meters)
	}
let	envMap = 0;

//= 3. OCEAN GRID VARIABLES ====//==============================================
//	This ocean map has 3 nested grids of squares.
//	Grid0 has 16x16 squares, each of size GrdSiz (e.g. 1 mile, range = 8 miles)
//	Grid1 has 16x16 squares, each of size GrdSi*4z (e.g. 4 miles, range = 32 miles)
//	Grid2 has 16x16 squares, each of size GrdSiz*16 (e.g. 16 miles, range = 128 miles))
//- GRDWTR ---------------------//----------------------------------------------
let grids = 0;
let grd_ = {
		MSP: 0,					// MSX, MPY, MSZ (meters) (from Flight)
		RCs: 16,				// Squares in each of first 2 grids
		Siz: 2400,			// Size of smallest square
		Stp: 4,					// Squares in each of first 2 grids
		Seg: 256,				// Segments for smallest square (512 = too much)
		Grx: [],				// Index of Grids (0-2)
		// Geometry and Materials
		Geo: [],				// Master Index of Basic Geometries
		Mat: [[0],[0],0],		// Materials
		// Displacement
		Dsp: 0,					// Grid 0 Displacement Map (from Ocean)
		// Normal Map
		Nrm: 0,					// Grid 0-1 Normal Map (from Ocean)
		NMS: 0,					// Grid 0-1 Normal Map Scale (from Ocean)
		N2S: "https://threejs.org/examples/textures/waternormals.jpg", // Size = 1024x1024
		NM2: 0,					// Grid 2 Normal Map
		// Indices
		Col: 0,
		DfS: "https://PhilCrowther.github.io/Aviation/textures/ocean/transition1F.png",
		Mtl: [0.5,0.5,0.5],		// Metalness (1 for max reflection)
		RfS: "https://PhilCrowther.github.io/Aviation/textures/ocean/transition5.png",
		Ruf: [0.5,0.5,0.5],		// Roughness (0 for max reflection)
		EMI: [0.5,0.42,0.42],	// EnvMap Intensity
		// Maps
		MSz: 512,				// Image Size
		DfM: [[0],[0],0],		// Diffuse
		RfM: [[0],[0],0],		// Roughness
		// Other
		WMx: 5,					// Max wave height, used to lower outer squares
	};
//- OCEAN MODULE ---------------//----------------------------------------------			
let waves = 0;
let wav_ = {
		// Sources
		Res: 512,				// Resolution - segments per square (default = 512)
		Siz: grd_.Siz,			// Size of Smallest Square
		WSp: 10.0,				// Wind Speed
		WHd: 90,				// Wind Heading (0=0,Spd; 90=Spd,0; 180=0,-Spd; 270=-Spd,0)
		Chp: 1.5,				// default = 1
		// Animated Maps
		Dsp: 0,					// The Displacement Map
		Nrm: 0,					// The Normal Map
		NMS: 0, 				// Normal Map Scale (flip Y for left-handed maps)
		Spd: 0.5,				// Can vary with GrdSiz
	};

//= 4. OBJECT VARIABLES ========//==============================================

// Sample Variable
//let var_ = {
//		ObjNum: 1,				// Number of Objects
//		ObjSrc: [0],			// Source File
//		ObjTxt: [0],			// Texture Source File
//		ObjAdr: [0],			// Object Address
//		ObjSiz: [],				// Scale (e.g. Ft2Mtr)
//		RndOrd: [0],			// renderOrder
//		ObjRot: [new THREE.Euler(0,0,0)], // Object Rotation (in radians)
//		MapPos: [new THREE.Vector3(0,0,0)], // Map Position - Absolute or Relative
//		ObjRef: [0],			// Child: Reference to Parent or Group
//		ObjGrp: [0],			// Group: new makMsh()
		// Moving
//		SpdMPS: [0],			// Speed - if Moving (mtr/sec)
//		MapSpd: [new THREE.Vector3()], // Map Speed (mtr/sec)
		// Animations (Varies by Object)
//		ObjDst: [0],			// Object distance (meters) used to activate effects
//		MixNam: [0],			// Animation Mixer
//		AnmNam: [0]				// Animation
//	};

//= SHARED TEXTURES ============//==============================================
let txt_ = {
		ObjNum: 3,
		ObjSrc: ["https://PhilCrowther.github.io/Aviation/textures/fx/smoke1.png",
				 "https://PhilCrowther.github.io/Aviation/textures/fx/smoke1r.png",
				 "https://PhilCrowther.github.io/Aviation/textures/fx/aaa.png"],
		ObjTxt: [],
	};
//= STATIC OBJECTS =============//==============================================
//- Islands --------------------//----------------------------------------------
let isl_ = {
		ObjNum: 2,
		ObjSrc: ["https://PhilCrowther.github.io/Aviation/scenery/models/homebase_ctr0.glb",
				 "https://PhilCrowther.github.io/Aviation/scenery/models/giaros.glb"],
		ObjTxt: ["https://PhilCrowther.github.io/Aviation/scenery/textures/homebase.png",
				 "https://PhilCrowther.github.io/Aviation/scenery/textures/giaros.png"],
		ObjAdr: [],
		ObjSiz: [MtrMil,1.5*MtrMil], // Scale
		RndOrd: [0,0],			// renderOrder (not used)
		ObjRot: [0,0],			// Rotation
		MapPos: [0,0],			// Absolute Position
		ObjGrp: [0,0],			// Group
	};
//- Static Objects -------------//----------------------------------------------
//- 0 = Hangar;
let fxd_ = {
		ObjNum: 1,
		ObjSrc: ["https://PhilCrowther.github.io/Aviation/scenery/models/hangar.glb"],
		ObjTxt: [0],
		ObjAdr: [0],			// Loaded Object
		ObjSiz: [Ft2Mtr],		// Scale
		RndOrd: [0],			// renderOrder
		ObjRot: [0],			// Rotation
		MapPos: [0],			// Relative Position
		ObjRef: [0],			// Parent
	};
//- Moving Airplanes -----------//----------------------------------------------
const XPPath = "https://PhilCrowther.github.io/Aviation/models/vehicles/";
const XP1Nam = "fm2_flyt_xp.glb"; // Name of airplane model file (rotated blender file)
const XP2Nam = "A6M_flyt_xp.glb"; // Name of airplane model file (rotated blender file)
let xac_ = {
		ObjNum: 2,				// Number of airplanes
		ObjSrc: [XPPath+XP1Nam, // Model Source file
				 XPPath+XP2Nam],
		ObjTxt: [0,0],			// Texture Source File (not used)
		ObjAdr: [0,0],			// Object Address
		ObjSiz: [Ft2Mtr,Ft2Mtr], // Scale
		RndOrd: [0,0],			// renderOrder (not used)
		ObjRot: [0,0],			// Rotation
		MapPos: [0,0],			// meters
		ObjRef: [0,0],			// 0 = not linked
		// Speed
		SpdMPS: [91.5,91,5],	// Speed (mtr/sec) (91.5 ms = 329 kph = 205 mph)
		MapSpd: [0,0],			// not used
		// Basic Animations
		ObjDst: [0,0],			// Object distance (meters) used to activate effects
		MixSpn: [0,0],			// Animation Mixer - Prop
		MixPit: [0,0],			// Animation Mixer - Pitch
		AnmPit: [0,0],			// Animation
		MixBnk: [0,0],			// Animation Mixer - Bank
		AnmBnk: [0,0],			// Animation
		// Engine Sounds
		EngSrc: [XPPath + "sounds/fm2.wav",
				 XPPath + "sounds/fm2.wav"],
		EngPtr: [0,0],
		EngMsh: [0,0],
		EngVol: [0.1,0.1],		// Volume
		// End Sequence
		HitCnt: [0,0],			// Hits Taken
		HitMax: 5,				// Hits Requred
		EndSeq: [0,0],			// End Sequence Running
		EndTim: 5,				// End Sequence Time (Seconds)
		// End Sound
		SndFlg: [0,0],			// 1 = Start Explosion Sound
		SndSrc: "https://PhilCrowther.github.io/Aviation/sounds/fx/aaa.mp3",
		SndPtr: [0,0],
		SndVol: 15,				// Volume
		SndMsh: [0,0],
		SndDTm: [0,0],
	};

//- Airplane Smoke Trail .......//..............................................
let xas_ = {
		// Shared Values
		ObjNum: 1,				// Number of Smoke Trails
		ObjTxt: 0,				// Shared Texture Reference Number
		ObjSiz: 800,			// Scale
		// Smoke
		SmkMat: [0],			// Material
		SmkMsh: [0],			// Emitter Address
	};

//- Airplane Flame Trail .......//..............................................
let xaf_ = {
		ObjNum: 1,				// Number of Smoke Trails
		// Shared Values
		ObjTxt: 0,				// Texture
		ObjSiz: 40,				// Scale
		// Smoke
		SmkMat: [0],			// Material
		SmkMsh: [0],			// Mesh
		// Fire
		FyrMat: [0],			// Material
		FyrMsh: [0],			// Mesh
	};

//. Moving Ships ---------------//----------------------------------------------
let xsh_ = {
		ObjNum: 2,				// Number of ships
		ObjSrc: ["https://PhilCrowther.github.io/Aviation/models/vehicles/CVE_noflag.glb",
				 "https://PhilCrowther.github.io/Aviation/models/vehicles/fletcher.glb"], // Source File
		ObjTxt: [0,0],			// Texture Source File (not used)
		ObjAdr: [0,0],			// Object Address
		ObjSiz: [Ft2Mtr,Ft2Mtr], // Scale		 
		RndOrd: [0,0],			// renderOrder (not used)
		ObjRot: [0,0],			// Object Rotation
		MapPos: [0,0],			// Object Map Position (meters) [used by Mesh]
		ObjGrp: [0,0],			// Group
		// Speed
		SpdMPS: [9,11],			// Speed (mtr/sec) (9 ms = 34 kph = 20 mph) [top speed = 21 mph]
		MapSpd: [0,0],			// Object Map Speed (mtr/sec) used by airplane if landed
		// Animations
		ObjDst: [0,0],			// Object distance (meters) used to activate effects
		MixRdr: [0,0],			// Animation Mixer - Radar
		AnmRdr: [0,0],			// Animation
		ShpPit: [0,0],			// Ship Pitch
		ShpLok: [0,0],			// Deck Lock
	};

//= ANIMATED FLAGS =============//==============================================
//	Can attach to Ships or Flagpoles
let	flg_ = {
		ObjNum:	1,				// Number of Flags
		// Material and Geometry
		ObjSrc: [0],			// Geometry Address (can use this for all flags)
		ObjTxt: ["https://PhilCrowther.github.io/Aviation/models/vehicles/textures/USA_48.png"],
		ObjAdr: [0],
		ObjSiz: [0.125],		// Scale (flag height = 2 meters)
		RndOrd: [0],			// renderOrder (not used)
		// Position and Rotation
		ObjRot: [0],			// Adjust to make the flag visible at start
		MapPos: [0],			// Relative Map Position
		ObjRef: [0],			// Parent Object
		// Animation
		ObjDst: [152.4],		// Visibility Distance from Parent (meters)
		ObjAdj: [0]
	};

//= AIRPLANE END SEQUENCE ======//==============================================
let xat_ = {
		// Segments:
		// 0 = 1st Explosion
		// 1 = Spinning and Burning
		// 2 = 2nd Explosion
		// 3 = Delay
		// 4 = Radio Call
		SegTim: [0.05,5,0.1,2,2],		
		SegIdx: -1,				// Start at -1 so can increment at beginning
		TimRem: 0,
	}

//= AIRPLANE EXPLOSION =========//==============================================
let xae_ = {
		ExpSiz: 0,				// Explosion Size
		ExpLif: 0,				// Remaining Life
		ExpMsh: 0,				// Mesh
	};

//= SMOKE MODULE ===============//==============================================
//- Vertical Smoke -------------//----------------------------------------------
let grs_ = {
		ObjNum: 1,				// Number of Smokes
		// Shared Values		
		ObjTxt: 1,				// Shared Texture Reference Number
		ObjSiz: 4000,			// Scale
		// Smoke
		SmkMat: [0],			// Material
		SmkMsh: [0],			// Emitter Address
		// Rotaton and Position
		ObjRot: [0],			// Rotation (not used)
		MapPos: [0], 			// Map Position
		ObjRef: [0],			// Parent Object
	};
//- Ground Fire ----------------//----------------------------------------------
let grf_ = {
		ObjNum: 1,				// Number of Smoke Trails
		// Shared Values
		ObjTxt: 0,				// Texture
		ObjSiz: 40,				// Scale
		// Smoke
		SmkMat: [0],			// Material
		SmkMsh: [0],			// Mesh
		// Fire
		FyrMat: [0],			// Material
		FyrMsh: [0],			// Mesh
		// Rotation and Position
		ObjRot: [0],			// Rotation
		MapPos: [0],			// Map Position
		ObjRef: [0],			// Parent Object
	};

//- Ship Wake ------------------//------------------------------------------
let wak_ = {
		ObjNum: xsh_.ObjNum,	// Number of Wakes
		ObjSrc: [0,0],			// Not Used
		ObjTxt: [0,0],			// Shared Texture Reference Number
		ObjMat: [0,0],			// Material
		ObjAdr: [0,0],			// Emitter Address
		ObjSiz: [4000,4000],	// Scale
		RndOrd: [1,1],			// renderOrder
		ObjRot: [0,0],			// Rotation (not used)
		MapPos: [0,0],			// Map Position
		ObjRef: [0,0],			// Parent Object
	};

//= MY PEEPS ===================//==============================================
//- Animated Objects: Linked ---//----------------------------------------------
let myp_ = {
		ObjNum: 2,
		ObjSrc: ["https://PhilCrowther.github.io/Aviation/people/Brian_Wave2.glb",
				 "https://PhilCrowther.github.io/Aviation/people/Brian_Anim.glb"],
		ObjTxt: [0,0],
		ObjAdr: [0,0],			// Loaded Object
		ObjSiz: [1,1],			// Scale
		RndOrd: [0,0],			// renderOrder
		ObjRot: [0,0],			// Rotation (degrees)
		MapPos: [0,0],			// Relative Position (if parent)
		ObjRef: [0,0],			// Parent, if any
		// Animation Action
		AnmAct: [0,0],			// Animation Action
		AnmMxr: [0,0],			// Animation Mixer
		AnmTim: [0,0],			// Animation
		AnmRep: [0,0],			// Number of Times to Repeat
		AnmRng: [80,360],
		// Animation Segments (within single Animation)
		SegNum: [2,1],			// Number of Segments
		SegRef: [0,0],			// Currently Playing
		SegBeg: [[0,40],[0]],	// Animation Segment Beg (Absolute Position)
		SegEnd: [[40,80],[360]], // Animation Segment End (Absolute Position)
		// Repetitions
		RepNum: [[10,0],[99]],	// Number of Times to Repeat Before Moving On
		RepRem: [0,0],			// Animation Reps Remaining		
		// Delay
		DlyBeg: [[0,3],[0]],	// Delay Time Between Animation Segments (Secs)
		DlyPos: [[0,60],[0]],	// Absolute Position in Range where Delay Starts
		DlyMid: [[0,3],[0]],		// Delay Time Within Animation Segments (Secs)
		DlyFlg: [0,0],			// Flag for Middle Delay - So Only Delay Once
		DlyRem: [0,0],			// Delay Time Remaining (Shared)
		// Visibility
		MaxDst: 1000,			// Max Distance where visible (meters)
		ObjViz: [1,1],			// Visibility Flag On
		// Segment Names (Optional)
		SegNam: [["Chocks Removed","Set Brakes"]],
	};

//= MINIMUM ALTITUDE ===========//==============================================
let alt_ = {
		Num: 2,
		Ref: [0,0],
		Var: [0,xsh_],
		Typ: [0,1], 			// 0 = stationary, 1 = moving
		Alt: [7.57,13.1],
		Lft: [-635,-13.2],
		Rgt: [-585,13.2],
		Fnt: [410,70.5],
		Bak: [-335,-70.5]
	};

//= 5. MY AIRPLANE VARIABLES ===//==============================================

//- Flight Module --------------//----------------------------------------------
let	flight = 0;
let air_ = {
		// General Variables
		DLTime: tim_.DLTime,			// Seconds per frame (can vary)
		GrvMPS: GrvMPS,			// Gravity (ups)
		AirDSL: 0,				// Air Density (varies with altitude)
		// Designators
		AirDat: 0,				// Aircraft Data
		// Airplane Rotation: Vertical Angle, Horizontal Angle, Bank Angle
		AirRot: 0, 				// Rotation (in degrees)
		AirObj: 0,				// Airplane Object 
		AirPBY: 0,				// Changes in radians
		// Changes to Airplane Pitch Bank and Yaw
		RotDif: 0, 				// Change
		// Airplane Speed
		SpdKPH: 0,				// Speed in KPH
		SpdMPS: 0,				// Speed - meters per second
		SpdMPF: 0, 				// Speed - meters per frame	
		// Airplane Map Speed and Position		
		MapSpd: 0, 				// Map Speed (meters)
		MapPos: 0, 				// Map Position (meters)
		MapSPS: 0, 				// MSX, MPY, MSZ (meters)	
		// Variables Obtained from Flight
		PwrPct: 0,				// % of Primary Power (0 to 1) (Main and Flight)
		SupPct: 0,				// Percent of Supplemental Power (War Enmergency or Afterburner)
		CfLift: 0,				// Coefficient of Lift (user input) - determines lift
		CfFlap: 0,				// Coefficient of Lift due to flaps (user input)
		FlpPct: 0,				// Percent of Flaps
		LngPct: 0,				// Percent of Landing Gear
		BrkPct: 0,				// Percent of Air Brakes
		SplPct: 0,				// Percent of Spoiler
		AGBank: 0,				// Aileron Bank on Ground
		BrkVal: 0,				// Brakes
		GrdZed: 0,				// Ground level (default)
		GrdFlg: 0,				// Ground Flag (1 = on ground)
		ACPAdj: 0,				// Airplane pitch adjustment
		// Values for the Selected Airplane Type (obtained from Flight)
		CfLMax: 0,				// Maximum Coefficient of Lift
		FlpCfL: 0,				// Max Flap Cfl (0.2*CfLMax)
		ACMass: 0,				// Airplane Mass
		Weight: 0,				// Used by AutoPilot
		PYBmul: 0, 				// Airplane Pitch/Yaw/Bank Multiplier
		BnkMax: 0,				// Maximum bank rate
		// AutoPilot - Additional Variables
		AutoOn: 0,				// Autopilot Flag
		InpKey: 0, 				// Inputs - Keys (replace InpKey)
		OldRot: 0, 				// Old Rotation (radians)
		CfLDif: 0,				// Change in CfL
		MaxBnk: 0,				// Max Bank (display only)
		HdgDif: 0,				// Horizontal Turn Rate (display only)
		// Air Density and IAS Comps
		BegTmp: 0,				// Beginning Sea Level Temperature (K)
		BegPrs: 1013.25,		// Beginning Sea Level Air Pressure (mB) - not used
		SpdIAS: 0,				// Indicated Airspeed
		// Ship Pitch and Bank
		MovFlg: 0,				// If Sitting on Moving Ship
		ShpPit: 0,
		ShpBnk: 0,
		// G-Force
		GFmult: 0,
	}

//- Load Models and Animations -//----------------------------------------------
//	File Paths
const AirSrc = "https://PhilCrowther.github.io/Aviation/models/fm2/"; // Used to load models and sounds
const mxrFNm = "fm2_flyt_caf_npa.glb"; // Name of airplane model file (rotated blender file)
const vxrFNm = "fm2_flyt_vcp_npa.glb"; // Name of airplane model file (rotated blender file)
const mxrSrc = AirSrc + mxrFNm;
const vxrSrc = AirSrc + vxrFNm;

//- FM2 Animations -------------------------------------------------------------
let	anmfps = 24;				// Blender FPS (used by Main Program and all modules
//	Animation Positions (all range from 0 to 360 with center at 180)
let anm_ = {
		anmfps: anmfps,			// Blender FPS
		spnprp: 180,			// SpinProp 	degrees = 0 to 360
		rudder: 180,			// Rudder 		degrees = +/- 360
		elvatr: 180,			// Elevator 	degrees = +/- 360
		aillft: 180,			// AileronL 	degrees = +/- 360
		ailrgt: 180,			// AileronR 	degrees = +/- 360
		flppos: 180,			// Flaps 		degrees = 0 to 180
		lngpos: 0,				// Landing Gear degrees = 0 to 180
		canpos: 180,			// Canopy 		degrees = 0 to 180
		thkpos: 180,			// Tailhook 	degrees = 0 to 180
		cmphdg: 0,				// Compass Heading
		atiarr: 180,			// Attitude - Arrow
		atibnk: 0,				// Attitude - Bank
		atipit: 180,			// Attitude - Pitch
		altft0: 0,				// Altitude - feet
		altft1: 0,				// Altitude - feet X 1000
		spdmph: 0,				// Speed - MPH
		vsifpm: 0,				// Vertical Speed - fpm
		manprs: 0,				// Manifold Pressure
		rpmprp: 0,				// Propeller RPM
		hdgdif: 180,			// Change in heading
		yawval: 180,			// Slip indicator
		stkpit: 180,			// Joystick pitch
		stkpcm: 0,				// cumulative
		stkbnk: 180,			// Joystick bank
		stkbcm: 0,				// cumulative
		vchead: 0,				// Pilot head
		// Gear and Flap					
		lngspd: 0,				// Change in Gear
		flpspd: 0,				// Change in Flaps
		canspd: 0,				// Change in Canopy
		thkspd: 0,				// Change in Canopy
		// Flags
		lngflg: 0,				// Gear (up.down)
		flpflg: 0,				// Flap (up/down)
		canflg: 0,				// Canopy (up/down)
		thkflg: 0,				// Tailhook (up/down)
	}
//	Animation Mixers - External Model
let mxr_ = {
		// GLTF
		GLT: 0,
		// Address
		Adr: 0,
		// Prop, Rudder, Elevator, AileronL, AileronR,  FlapL, FlapR
		Prp:0, Rdr:0, Elv:0, AiL:0, AiR:0, FlL:0, FlR:0,
		// Wheel: HingeL, HingeR, StrutBL, StrutBR, StrutTL, StrutTR, ShockL, ShockR, UpperL, UpperR
		WHL:0, WHR:0, WBL:0, WBR:0, WTL:0, WTR:0, WSL:0, WSR:0, WUL:0, WUR:0,
		// Canopy, Tailhook, SpinProp XP
		Cnp:0, THk:0
	}
//	Animation Mixers - Internal Model
let vxr_ = {
		// GLTF
		GLT: 0,
		// Address
		Adr: 0,
		// Propeller, AileronL, AileronR, Canopy
		Prp:0, AiL:0, AiR:0, Cnp:0,
		// Gauge: Compass Heading, AI Arrow, AI Bank, AI Pitch, ManPrs
		GaH:0, GaA:0, GaB:0, GaP:0, GaM:0,
		// Pointer: Alt, Alt*1k, MPH, TrnInd, Ball, VSI, RPM, Heading
		PtA:0, PtB:0, PtS:0, PtT:0, PtC:0, PtV:0, PtR:0, PtH:0,
		// ArmL (T), ArmR (PB), HandL (T), HandR (P), HandR (B), 
		ArL:0, ArR:0, HLT:0, HRP:0, HRB:0,
		// LegL, LegR, RudderL, RudderR, Head
		LgL:0, LgR:0, RdL:0, RdR:0, Hed:0,
		// Old Heading, Old Altitude
		HdO:0, AlO:0,
		// Camera Distance from Reference Point
		Cam: -0.1
	}

//= GUNASG MODULE ==============//==============================================
//- Aircraft Guns
//	M2 Browning .50 caliber
let BulSpd = 887;				// Muzzle velocity [mps = 2910 fps]
let BulDLT = 0.5;				// Bullet Maximum Time in Flight
let BulNum = 16;				// Number of bullets
let BulSpc = 4*BulDLT/BulNum;	// Bullet spacing
//	AA Guns
//	Bofors anti-aircraft guns - 40 mm (1.57 in)
let AAANum = 16;				// Number of bullets
let AAASpd = 850;				// Muzzle Velocity [mps = 2,800 fps]
let AAADLT = 4.0;				// Life of bullet [23,490 ft range/2800 fps]
let AAASpc = 4*AAADLT/AAANum;	// Bullet spacing
//	Adjust y-Rotation
let AARYBg = [90,0];			// Starting Y-Rotation
let AARYDf = [0,0];				// Y-Rotation Adjustment
//	Smoke
let SmkOpR = 0.005;				// Opacity Reduction per Frame

//- My Guns --------------------//----------------------------------------------
let myg_ = {
		// Data
		BulSpd: BulSpd,			// Muzzle Velocity (mps)
		BulDLT: BulDLT,			// Max Bullet Time in Flight
		BulNum: BulNum,			// Number of bullets
		BulSpc: BulSpc,			// Bullet spacing
		BulSp2: BulSpc,
		// Object
		BulClr: 0,				// Red (Vector2)
		BulPtr: [0],			// Bullet Objects
		BulMpS: [0],			// Bullet Speed
		BulTim: [0],			// Bullet Time in Flight
		// Sound
		ObjNum: 2,
		SndSrc: 0,				// File (my guns)
		SndPtr: [0,0],
		SndVol: 0.5,			// Volume
		SndMsh: [0,0],			// (makMsh)
		// HitBox
		HitTgt: 1,				// Hit Target (1 = enemy airplane)
		HitDst: 10,				// Hit Radius
	}

//- Moving Airplanes -----------//----------------------------------------------
let xag_ = {
		ObjNum: 2,
		// Parent
		XACRot: [0,0],
		XACPos: [0,0],
		// Gun Object (Fixed Firing Forward)
		// GunPtr = Airplane Object
		GunPtr: [0,0],			// Not Used Yet
		GunRot: [0,0],			// Gun Rotation (Euler degrees)
		GunPos: [0,0],			// Map Position (Vector3)
		// Bullet Data
		BulFlg: [0,1],			// 1 = Guns Firing
		BulNum: BulNum,			// Number of bullets		
		BulSpd: BulSpd,			// Muzzle Velocity (mps)
		BulDLT: BulDLT,			// Max Bullet Time in Flight
		BulSpc: BulSpc,			// Bullet spacing
		BulSp2: [BulSpc,BulSpc], // Bullet spacing time remaining
		// Bullet Colors and Opacity
		BulClr: 0,				// Red (Vector2)
		BulOpa: 0.8,
		// Bullets for each gun
		BulPtr: [[],[]],		// Bullet Objects
		BulMpS: [[0],[0]],		// Bullet Map Speed (V3)
		BulMpP: [[0],[0]],		// Bullet Map Position (V3)
		BulTim: [[],[]],		// Bullet Time in Flight
		// Gun Sounds
		SndSrc: [0,0],			// File (my guns)
		SndPtr: [0,0],
		SndVol: [0.5,0.5],		// Volume
		SndMsh: [0,0],			// (makMsh)
		// Timer
		XPGMax: [0,120],		// Guns On (frames)
		XPGMin: [0,-600],		// Guns Off (frames)
		XPGFlg: [0,120],		// Timer (set to Max)
	};

//- Moving Ships ---------------//----------------------------------------------
let xsg_ = {
		ObjNum: 2,				// Number of guns
		// Parent
		XSHRot: [0,0],			// Fletcher
		XSHPos: [0,0],
		// Gun Object
		GunPtr: [0,0],			// Gun Object (makMsh)
		GunRot: [0,0],			// Gun Rotation (Euler - degrees)
		GunPos: [0,0],			// Relative Map Position (Vector3) [used by Mesh]
		// Bullet Data
		AAAFlg: [0,0],			// 1 = Guns Firing
		AAANum: AAANum,			// Number of bullets
		AAASpd: AAASpd,			// Muzzle Velocity (mps)
		AAADLT: AAADLT,			// Max Bullet Time in Flight
		AAASpc: AAASpc,			// Bullet spacing
		AAASp2: [AAASpc,AAASpc], // Bullet spacing time remaining	 
		// Bullet Colors and Opacity
		AAACol: 0,				// Red (Vector2)
		AAAOpa: 0.4,			// Opacity
		// Bullets for each gun		
		AAAPtr: [[],[]],		// Bullet Objects
		AAAMpS: [[0],[0]],		// Bullet Map Speed (V3)
		AAAMpP: [[0],[0]],		// Bullet Map Position (V3)
		AAATim: [[],[]],		// Bullet Time in Flight
		// Smoke
		SmkFlg: [0,0],			// 1 = Start Smoke ### new
		SmkMap: 2,				// Shared Texture Reference Number
		SmkMat: [0,0],			// Smoke Material
		SmkPtr: [0,0],			// Smoke Sprite
		SmkRot: [0,165],		// Z-rotation of smoke
		SmkMpP: [0,0],			// Map Position (Vector3)
		SmkDMx: [12,14],		// Delay between Smoke events (secs)
		SmkDTm: [0,7],			// Delay Counter
		SmkOpR:	SmkOpR,			// Opacity Reduction
		// Smoke Sounds
		SndFlg: [0,1],			// 1 = Explosion
		SndSrc: "https://PhilCrowther.github.io/Aviation/sounds/fx/aaa.mp3",
		SndPtr: [0,0],
		SndVol: 15,				// Volume
		SndMsh: [0,0],			// Sound Mesh (makMsh())
		SndDTm: [0,0],
		// Exploding Center
		ExpPtr: [0,0],			// Pointer to Exploding Center
		ExpSiz: [0,0],			// Expanding Size
		ExpLif: [0,0],			// Life of Explosion (seconds)
		// Timer
		XSGMax: [0,1200],		// Guns On (frames)
		XSGMin: [0,-1200],		// Guns Off (frames)
		XSGFlg: [0,1200],		// Timer (set to Max)
	};

//- Fixed Guns -----------------//----------------------------------------------
let aaf_ = {
		ObjNum: 2,
		// No Parent
		XSHRot: [0,0],			//
		XSHPos: [0,0],			//
		// Gun Object
		GunPtr: [0,0],			// Gun Object (makMsh)
		GunRot: [0,0],			// Gun Rotation (Euler - degrees)
		GunPos: [0,0],			// Map Position (Vector3)
		// Bullet Data
		AAAFlg: [1,1],			// 1 = Gun Firing
		AAANum: AAANum,			// Number of Bullets
		AAASpd: AAASpd,			// Muzzle Velocity (mps)
		AAADLT: AAADLT,			// Max Bullet Time in Flight
		AAASpc: AAASpc,			// Bullet Spacing
		AAASp2: [AAASpc,AAASpc], // Bullet spacing time remaining
		// Bullet Colors and Opacity
		AAACol: 0,				// Green-Blue (Vector2)
		AAAOpa: 0.5,			// Opacity
		// Bullets for each gun
		AAAPtr: [[],[]],		// Bullet Objects
		AAAMpS: [[0],[0]],		// Bullet Map Speed (V3)
		AAAMpP: [[0],[0]],		// Bullet Map Position (V3)	
		AAATim: [[],[]],		// Bullet Time in flight
		// Smoke
		SmkFlg: [0,0],			// 1 = Start Smoke ### new
		SmkMap: 2,				// Shared Texture Reference Number
		SmkMat: [0,0],			// Smoke Material
		SmkPtr: [0,0],			// Smoke Sprite
		SmkRot: [0,165],		// Z-rotation of smoke
		SmkMpP: [0,0],			 // Map Position (Vector3)
		SmkDMx: [12,11],		// Delay between Smoke events (secs)
		SmkDTm: [0,6],			// Delay Counter
		SmkOpR:	SmkOpR,			// Opacity Reduction
		// Smoke Sounds
		SndFlg: [1,1],			// 1 = Start Explosion Sound
		SndSrc: "https://PhilCrowther.github.io/Aviation/sounds/fx/aaa.mp3",
		SndPtr: [0,0],
		SndVol: 15,				// Volume
		SndMsh: [0,0],			// makMsh()
		SndDTm: [0,0],
		// Explosion
		ExpPtr: [0,0],			// Pointer to Exploding Center
		ExpSiz: [0,0],			// Expanding Size
		ExpLif: [0,0],			// Life of Explosion (seconds)
	};

//- 6. SOUND VARIABLES =========//==============================================
//- My Sounds ------------------//----------------------------------------------
let mys_ = {
		AirMsh:	0,				// For Engine and Prop
		EngSrc: AirSrc + "sounds/fm2.wav",
		EngSnd: 0,				// Address
		EngVol: 0.1,			// Volume
		PrpSrc: AirSrc + "sounds/fm2_prop.wav",
		PrpSnd: 0,				// Address
		PrpVol: 0.5,			// Volume
	}
//- Radio Variables ------------//----------------------------------------------
let RadTim = 0;					// Start this timer for Linear Segment
let	rad_ = {
		// Sound Files (voice plus static)
		SndSrc: ["https://PhilCrowther.github.io/Aviation/sounds/radio/noise.mp3",
				 "https://PhilCrowther.github.io/Aviation/sounds/radio/radio.wav"],
		SndAdr: [0,0],			// Pointer to Radio and Static Sounds
		// All Segments
		SegIdx: 0,				// Index to Segment
		SegSrc: [1,1,1],		// Index to Radio Source
		SegSta: [1,1,1],		// Static Offset within Source (best)	
		SegOff: [0.0,1.0,3.5],	// Radio Offset within Source
		SegEnd: [1.0,2.5,2.0],	// Radio Offset within Source
		// Timed Segments
		SeqTim: 0,				// Sequence Timer
		SegNum: 2,				// Number of Events
		SegPtr: 0,				// Pointer to Next Segment 
		SegBeg: [10,30],		// When Segment Starts (in Seconds)
		SegSel: [0,1],			// Segment to Play
		SeqFlg: 0,				// 1 = Sequence Already Played
	}

//= 7. CAMERA VARIABLES ========//==============================================
//-	Start
let CamSel = 1;					// Camera Selection (0 = External; 1 = Internal)
//- Variables
let CamNum = 2;
let CamFlg = [0,1];				// 1 = Internal View
let CamLnk = [1,1];				// 1 = Linked to Airplane
//- Variables
let CamAdj = [180,0];
//- Shared Variables
let cam_ = {
		CamSel: CamSel,			// View Selector (0 = External, 1 = Internal)
		CamNum: CamNum,
		OrbFlg: 0,				// Orbit Flag (1 = Orbiting)
		// Camera
		CamLLD: 0, // cam_.MshRot Lat, Lon, Dst
		CamAdj: CamAdj[CamSel],	// Camera Adjustment (180 = look in)
		CamMMD: 0,				// In/Out - min,max,spd
		// Rotator
		MshRot: 0,				// Camera Rotator
		CamMMR: 0,				// Rotate - min/max Lat/Lon,rspd
		// Center of Rotation
		CamPar: 0,				// Center of Rotation	
		CamFlg: 0,				// View Flag (0 = External, 1 = Internal)
		// Linked Airplane
		CamLnk: 0,
		MshObj: 0,
		MshDeg: 0,
		//- Adjust Camera x.rotation
		CmAdjX: 0,				// Airborne Pitch Adjustment
		CmGrdF: 0,				// Camera Ground Flag (1 = On Ground)
		CmMulX: 35,				// Pitch Adjustment Multiplier
		CmLagX: 0,				// Transition Offset
		// Beginning Head Rotation
		VewRot: 0,
	}

//= 8. OUTPUTS VARIABLES =======//==============================================

//- HTML OVERLAY TEXT ----------//----------------------------------------------
let Air_PwrElement = document.getElementById("Air_Pwr"); // Power
let Air_PwrNode = document.createTextNode("");
	Air_PwrElement.appendChild(Air_PwrNode);
let Air_SpdElement = document.getElementById("Air_Spd"); // Speed
let Air_SpdNode = document.createTextNode("");
	Air_SpdElement.appendChild(Air_SpdNode);
let Air_AltElement = document.getElementById("Air_Alt"); // Altitude
let Air_AltNode = document.createTextNode("");
	Air_AltElement.appendChild(Air_AltNode);
let Air_HdgElement = document.getElementById("Air_Hdg"); // Heading
let Air_HdgNode = document.createTextNode("");
	Air_HdgElement.appendChild(Air_HdgNode);
let Air_CfLElement = document.getElementById("Air_CfL"); // CfLift
let Air_CfLNode = document.createTextNode("");
	Air_CfLElement.appendChild(Air_CfLNode);		
let Air_GFmElement = document.getElementById("Air_GFm"); // GFmult
let Air_GFmNode = document.createTextNode("");
	Air_GFmElement.appendChild(Air_GFmNode);
let On_PawsElement = document.getElementById("On_Paws"); // Pause
let On_PawsNode = document.createTextNode("");
	On_PawsElement.appendChild(On_PawsNode);
let Air_AtPElement = document.getElementById("Air_AtP"); // Autopilot
let Air_AtPNode = document.createTextNode("");
	Air_AtPElement.appendChild(Air_AtPNode);
let On_Inf0Element = document.getElementById("On_Inf0"); // Info
let On_Inf0Node = document.createTextNode("");
	On_Inf0Element.appendChild(On_Inf0Node);
let On_Inf1Element = document.getElementById("On_Inf1");
let On_Inf1Node = document.createTextNode("");
	On_Inf1Element.appendChild(On_Inf1Node);
let On_Inf2Element = document.getElementById("On_Inf2");
let On_Inf2Node = document.createTextNode("");
	On_Inf2Element.appendChild(On_Inf2Node);
let On_Inf3Element = document.getElementById("On_Inf3");
let On_Inf3Node = document.createTextNode("");
	On_Inf3Element.appendChild(On_Inf3Node);
let On_Inf4Element = document.getElementById("On_Inf4");
let On_Inf4Node = document.createTextNode("");
	On_Inf4Element.appendChild(On_Inf4Node);
let On_Inf5Element = document.getElementById("On_Inf5");
let On_Inf5Node = document.createTextNode("");
	On_Inf5Element.appendChild(On_Inf5Node);
let On_Inf6Element = document.getElementById("On_Inf6");
let On_Inf6Node = document.createTextNode("");
	On_Inf6Element.appendChild(On_Inf6Node);
let On_Inf7Element = document.getElementById("On_Inf7");
let On_Inf7Node = document.createTextNode("");
	On_Inf7Element.appendChild(On_Inf7Node);
let On_Inf8Element = document.getElementById("On_Inf8");
let On_Inf8Node = document.createTextNode("");
	On_Inf8Element.appendChild(On_Inf8Node);
let On_Inf9Element = document.getElementById("On_Inf9");
let On_Inf9Node = document.createTextNode("");
	On_Inf9Element.appendChild(On_Inf9Node);
//
let Air_Pwr,Air_Spd,Air_Hdg,Air_Alt,Air_CfL,Air_GFm;
let On_Paws,Air_AtP;
let On_Inf0,On_Inf1,On_Inf2,On_Inf3,On_Inf4,On_Inf5,On_Inf6,On_Inf7,On_Inf8,On_Inf9;

//- Info Text ------------------------------------------------------------------
let InfoData = [
		[
			"Info : Press I","","","","","","","","",""
		],
		[
			"",
			"CONTROLS",
			"Mouse changes Pitch/Bank and Yaw (bottons)",
			"AutoPilot: Arrow Key change Pitch and Bank",
			"Mouse Wheel or -/= Keys change Throttle",
			"G Key toggles landing gear",
			"F Key toggles flaps",
			"S Key toggles sound",
			"Spacebar fires guns"
		],
		[
			"",
			"VIEW KEYS",
			"V Key toggles views",
			"Shift Key and Mouse orbits around airplane",
			"With NumLock Set:",
			"* 7/9 Keys look left/right 45 degrees",
			"* 4/6 Keys look left/right 90 degrees",
			"* 8 Key looks up 45 degrees",
			"* 5 Key looks down/back 45 degrees",
			"* 4, 5 and 6 Keys look straight back"
		]
	];

//= 9. INPUTS VARIABLES ========//==============================================
		
//- DEFAULT KEY BINDINGS -------//----------------------------------------------
let key_ = {
		//	Basic
		K_PwLU:	87,				// Power Up (w) - keyboard left
		K_PwLD:	 81,			// Power Down (q) - keyboard left
		K_PwRU:	187,			// Power Up (=) - keyboard right
		K_PwRD:	189,			// Power Down (-) - keyboard right
		K_BnkL:	 37,			// Bank Left (left arrow) - autopilot only
		K_BnkR:	 39,			// Bank Right (right arrow) - autopilot only
		K_PitU:	 40,			// Pitch Up (down arrow) - autopilot only
		K_PitD:	 38,			// Pitch Down (up arrow) - autopilot only
		K_YwLL:	 90,			// Yaw Left (z) - keyboard left
		K_YwLR:	 88,			// Yaw Left (x) - keyboard left
		K_YwRL:	188,			// Yaw Left (,) - keyboard right
		K_YwRR:	190,			// Yaw Left (.) - keyboard right
		K_Brak:	 66,			// Brakes (b)
		K_Guns:	 32,			// Guns (spacebar)
		//	Additional
		K_Flap:	 70,			// Flaps (f)
		K_Gear:	 71,			// Landing Gear (g)
		K_Hook:	 72,			// Tailhook (h)
		K_Canp:	 67,			// Canopy (c)
		//	View
		K_Look:	 16,			// Orbit (shift)
		//	View Keys (Num Lock)
		K_VR45:	105,			// [9] Right 45 deg
		K_VU45:	104,			// [8] View Up 45 deg
		K_VL45:	103,			// [7] Left 45 deg (315 deg)
		K_VR90:	102,			// [6] Right 90 deg
		K_VD45:	101,			// [5] View Down or Back 45 deg
		K_VL90:	100,			// [4] Left 90 deg (270 deg)
		K_VRBk:	99,				// [3] Right Back (135 deg)
		K_VCBk:	98,				// [2] Center Back (180 deg)
		K_VLBk:	97,				// [1] Left Back (225 deg)
		//	Toggle
		K_View:	86,				// Toggle Visibility (v)
		K_Soun:	83,				// Toggle sound (s)
		K_Paws:	80,				// Pause (p)
		K_Auto:	65,				// Autopilot (a)
		K_Info:	73,				// Info (i)
		K_RSet:	82,				// Reset (r)
		//-	Camera View Keys -----------//----------------------------------------------
		U45flg:	0,					// Up 45 deg
		D45flg:	0,					// Down 45 deg
		L45flg:	0,					// Left 45 deg (315 deg)
		R45flg:	0,					// Right 45 deg
		L90flg:	0,					// Left 90 deg (270 deg)
		R90flg:	0,					// Right 90 deg
		LBkflg:	0,					// Left Back 45 deg (225 deg)
		RBkflg:	0,					// Right Back 45 deg (135 deg)
		CBkflg:	0,					// Center Back (180 degrees)
	}

//- POINTER LOCK CONTROL -------//----------------------------------------------
//	Variables
let InpMos = 0;					// Mouse Inputs
let _changeEvent = {type: "change"};
let _lockEvent = {type: "lock"};
let _unlockEvent = {type: "unlock"};
