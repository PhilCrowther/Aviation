//= DATA MODULE ================================================================

//	Updated: Sep 26 2024

import {Vector2,Vector3} from 'three';

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

//= EXPORT =====================================================================

export {SnF_};

