//= PRE-LOAD DATA ==============================================================
//	No three.js routines allowed since three.js has not been loaded yet.

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
const GrvMPS = 9.80665; 		// Gravity (mps)
// These values could also be used by modules, but that would require that all 
// module users also create a data file - which complicates the use of modules.
//	Time
let	DLTime = 1/60;				// Delta Time (1/60 seconds)
let DLTim2 = DLTime**2;
let GrvDLT = GrvMPS*DLTim2;

//- INPUT VALUES ---------------//----------------------------------------------
//- Display
let PawsOn = 0;					// Pause
let InfoOn = 0;					// Info
let SndFlg = 0;					// Sound (0 = off; 1 = on)
let StatOn = 1;					// Stats (0 = off, 1 = on)
let LnFFlg = 1;					// Lensflare
//	Program Flags
let LodFlg = 0;					// Set at end of initialization
let LodSnd = 0;					// Set when sound initialized
let MYGFlg = 0;					// My Guns (1 = firing)
//	Altitude Adjustment
let AltAdj = 0.99;				// Raises objects above map as altitude increases
let AltDif = 0;

//- SUN VALUES -----------------//----------------------------------------------
const SunCol = "white";			// Sun
let SunInt = 3;					// Default intensity of light/sun
//- Rotation and Position (fixed)
let SunDst = 50;				// Distance (for shadows)
let SunLat = 23;				// Direction - Vert (+/- 90) deg
let SunLon = 312;				// Direction - Horz (0->360) deg
//	Shadows
let ShdBox = 15;				// Size of shadow box
let ShdBLR = 12;
let ShdBTB = 4;
let ShdDst = 1500;				// Shadow Distance (meters)

//= FADE2BLACK PLANE ===========//==============================================
//	If FadBeg > 0, Prop Invisible.
//	Therefore, limit use to where Prop would be invisible.
let FadFlr = 0.25;				// Floor (Fade Not Visible)
let FadBeg = 0.99;				// Beg Opacity
let FadEnd = FadFlr;			// Beg Target
let FadSpd = 0.005;				// Fade Speed
let FadMat = 0;					// Allows change of color
let FadCol = "black";			// Beg Color

//= 2. SKYBOX VARIABLES ========//==============================================
const FogCol = 0xbab4a6;		// Sky (for Fog only)
//- SkyBox
const SBxSrc = "https://PhilCrowther.github.io/Aviation/textures/cube/skyboxsun25deg/";
//-	LensFlare
const LF0Src = "https://threejs.org/examples/textures/lensflare/lensflare1.png";
const LF1Src = "https://threejs.org/examples/textures/lensflare/lensflare3.png";
let LF0Txt, LF1Txt = 0;
let envMap = 0;

//= 3. OCEAN GRID VARIABLES ====//==============================================

//- GRDWTR TEXTURES ------------//----------------------------------------------
//const WtrCol = 0x1060ff;		// Water (Nodes) - this color was showing up purple
const WtrCol = 0x0066cc;		// Water (Nodes)
//- Textures
const DifSrc = "https://PhilCrowther.github.io/Aviation/textures/ocean/transition1F.png";
const RufSrc = "https://PhilCrowther.github.io/Aviation/textures/ocean/transition5.png";
const NrmSrc = "https://threejs.org/examples/textures/waternormals.jpg"; // Size = 1024x1024

//- GRDWTR MODULE --------------//----------------------------------------------
//	This ocean map has 3 nested grids of squares.
//	Grid0 has 16x16 squares, each of size GrdSiz (e.g. 1 mile, range = 8 miles)
//	Grid1 has 16x16 squares, each of size GrdSi*4z (e.g. 4 miles, range = 32 miles)
//	Grid2 has 16x16 squares, each of size GrdSiz*16 (e.g. 16 miles, range = 128 miles))
const GrdSiz = 1600;			// 1600 = 1 mile
const GrdRes = 512;
const GrdSeg = 256;				// Segments per Plane (256 = OK, 512 = too much)
const WavMax = 5;				// Maximum wave height (set height of outer waves)
let grids = 0;
let grd_ = {
		MSP: 0, 				// MSX, MPY, MSZ (meters) (from Flight)
		RCs: 16,				// Squares in each of first 2 grids
		Siz: GrdSiz,			// Size of smallest square
		Stp: 4,					// Squares in each of first 2 grids
		Seg: GrdSeg,			// Segments for smallest square
		Grx: [],				// Index of Grids (0-2)
		Geo: [],				// Master Index of Basic Geometries
		Col: 0, 				// Color
		Dsp: 0,					// Grid 0 Displacement Map (from Ocean)
		Nrm: 0,					// Grid 0-1 Normal Map (from Ocean)
		NMS: 0,					// Grid 0-1 Normal Map Scale (from Ocean)
		Df0: [],				// Grid 0-1 Diffuse Maps
		Rf0: [],				// Grid 0-1 Roughness Maps
		Mt0: [],				// Grid 0 Materials
		Mt1: [],				// Grid 1 Materials
		Dif: 0,					// Grid 2 Diffuse Map
		Ruf: 0,					// Grid 2 Roughness Maps
		Gr2: 0,					// Grid 2 Normal Map
		Mat: [],				// Grid 2 Materials
		WMx: WavMax,			// Max wave height, used to lower outer squares
		EMI: [0.5,0.42,0.42],	// EnvMap Intensity Multiplier
	};

//- OCEAN MODULE ---------------//----------------------------------------------
let WndSpd = 10.0;
let WndHdg = 90;
let Choppy = 1.5;
let AnmSpd = 0.5;				// Can vary with GrdSiz
let waves = 0;
let wav_ = {
		// Sources
		Res: GrdRes,			// Resolution - segments per square (default = 512)
		Siz: GrdSiz,			// Size of Smallest Square = default = 3200m = 2 miles
		WSp: WndSpd,			// Wind Speed
		WHd: WndHdg,			// Wind Heading (0=0,Spd; 90=Spd,0; 180=0,-Spd; 270=-Spd,0)
		Chp: Choppy,			// default = 1
		// Animated Maps
		Dsp: 0,					// The Displacement Map
		Nrm: 0,					// The Normal Map
		NMS: 0, 				// Normal Map Scale (flip Y for left-handed maps)
		Spd: AnmSpd
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

//= SHARED TEXTURES ============//===============================================
let txt_ = {
		ObjNum: 3,
		ObjSrc: ["https://PhilCrowther.github.io/Aviation/textures/fx/smoke1.png",
				 "https://PhilCrowther.github.io/Aviation/textures/fx/smoke1r.png",
				 "https://PhilCrowther.github.io/Aviation/textures/fx/aaa.png"],
		ObjTxt: [],
	};

//. Moving Airplanes ...........//..............................................
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

//. Moving Ships ...............//..............................................
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

//= 5. MY AIRPLANE VARIABLES ===//==============================================

//- Flight Module --------------//----------------------------------------------
let	flight = 0;
let air_ = {
		// General Variables
		DLTime: DLTime,			// Seconds per frame (can vary)
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
		BegTmp: 0,			// Beginning Sea Level Temperature (K)
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
		HitTgt: 1,				// Hit Target (1 = enemy airplane_
		HitDst: 10,				// Hit Radius
	}

//- Moving Airplanes -----------//----------------------------------------------
let XPGMax = 120;				// Guns Firing (2 secs)
let XPGFlg = XPGMax;
let XPGMin = -600;				// Guns Not Firing (10 secs)
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
	};

//- Moving Ships ---------------//----------------------------------------------
let XSGMax = 1200;				// Guns Firing (20 secs)
let XSGFlg = XSGMax;
let XSGMin = -1200;				// Guns Not Firing (20 secs)
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
			"END Key looks down",
			"DELETE or PAGE DOWN Keys look left/right",
			"HOME Key and above Keys look up",
			"END Key and DELETE or PAGE DOWN Keys look back",
			"All 3 Keys look back"
		]
	];


//= 9. INPUTS VARIABLES ========//==============================================

//- DEFAULT KEY BINDINGS -------//----------------------------------------------
//	Basic
const K_PwLU =  87;				// Power Up (w) - keyboard left
const K_PwLD =  81;				// Power Down (q) - keyboard left
const K_PwRU = 187;				// Power Up (=) - keyboard right
const K_PwRD = 189;				// Power Down (-) - keyboard right
const K_BnkL =  37;				// Bank Left (left arrow) - autopilot only
const K_BnkR =  39;				// Bank Right (right arrow) - autopilot only
const K_PitU =  40;				// Pitch Up (down arrow) - autopilot only
const K_PitD =  38;				// Pitch Down (up arrow) - autopilot only
const K_YwLL =  90;				// Yaw Left (z) - keyboard left
const K_YwLR =  88;				// Yaw Left (x) - keyboard left
const K_YwRL = 188;				// Yaw Left (,) - keyboard right
const K_YwRR = 190;				// Yaw Left (.) - keyboard right
const K_Brak =  66;				// Brakes (b)
const K_Guns =  32;				// Guns (spacebar)
//	Additional
const K_Flap =  70;				// Flaps (f)
const K_Gear =  71;				// Landing Gear (g)
const K_Hook =  72;				// Tailhook (h)
const K_Canp =  67;				// Canopy (c)
//	Views
const K_Look =  16;				// Orbit (shift)
const K_VU45 =  36;				// View Up (alone or modifier)
const K_VD45 =  35;				// View Down (alone or modifier)
const K_VL45 =  33;				// Left 45 degrees
const K_VR45 =  45;				// Right 45 degrees
const K_VL90 =  34;				// Left 90 degrees
const K_VR90 =  46;				// Right 90 degrees
//	Toggle
const K_View =  86;				// Toggle Visibility (v)
const K_Soun =  83;				// Toggle sound (s)
const K_Paws =  80;				// Pause (p)
const K_Auto =  65;				// Autopilot (a)
const K_Info =  73;				// Info (i)
const K_RSet =  82;				// Reset (r)
