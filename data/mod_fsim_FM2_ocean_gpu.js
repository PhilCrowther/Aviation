//= DATA MODULE ================================================================

//	Updated: Sep 26 2024

import {Color,Vector2,Vector3} from 'three';

//=	SUNFLARE ===================================================================
let SnF_ = {
		//- Sprites
		num: 2,				// Number of Sprites
		spr: [],			// Sprite Address
		mlt: 0,				// Offset Multiplier
		//- Rotators
		msh: [],			// Rotators
		par: 0,				// Parent (Camera Clone) [OrbCon Only]
		//- Heading Offset
		cam: new Vector3(), // Camera Direction
		sun: new Vector2(0,0),	// Sun Position (fixed)
		off: new Vector2(), // Sun Offset (lat/lon) [shared]
		asp: 0,				// Camera Aspect
	}

//= GRDWTR MODULE ==============================================================
//	This ocean map has 3 nested grids of squares.
//	Grid0 has 16x16 squares, each of size GrdSiz (e.g. 1 mile, range = 8 miles)
//	Grid1 has 16x16 squares, each of size GrdSi*4z (e.g. 4 miles, range = 32 miles)
//	Grid2 has 16x16 squares, each of size GrdSiz*16 (e.g. 16 miles, range = 128 miles))
let grd_ = {
		MSP: new Vector3().copy(BegPos), // MSX, MPY, MSZ (meters) (from Flight)
		RCs: 16,			// Squares in each of first 2 grids
		Siz: GrdSiz,		// Size of smallest square
		Stp: 4,				// Squares in each of first 2 grids
		Seg: GrdSeg,		// Segments for smallest square
		Grx: [],			// Index of Grids (0-2)
		Geo: [],			// Master Index of Basic Geometries
		Col: new Color(WtrCol), // Color
		Dsp: 0,				// Grid 0 Displacement Map (from Ocean)
		Nrm: 0,				// Grid 0-1 Normal Map (from Ocean)
		NMS: new Vector2(),	// Grid 0-1 Normal Map Scale (from Ocean)
		Df0: [],			// Grid 0-1 Diffuse Maps
		Rf0: [],			// Grid 0-1 Roughness Maps
		Mt0: [],			// Grid 0 Materials
		Mt1: [],			// Grid 1 Materials
		Dif: 0,				// Grid 2 Diffuse Map
		Ruf: 0,				// Grid 2 Roughness Maps
		Gr2: 0,				// Grid 2 Normal Map
		Mat: [],			// Grid 2 Materials
		WMx: WavMax,		// Max wave height, used to lower outer squares
	};
//	Since textures must be loaded in the Main Program and since design of materials 
//	and goemetry can vary, some of the Grid initialization is handled in the Main Program
//  by the LoadGeoMat and InitGeoMat routines

//= EXPORT =====================================================================

export {SnF_, grd_};

