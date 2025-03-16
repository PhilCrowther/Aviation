/*
 * Sounds.js (vers 25.03.16)
 * Copyright 2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/* NOTES:
	Sounds for fsim_FM2_ocean_gpu air
*/

/*
 * @fileoverview
 * Subroutines to create an air combat simulation
 * See http://philcrowther.com/Aviation for more details.
 */

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	Audio,
	PositionalAudio,
} from 'three';

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

//= CONSTANTS ==================//==============================================



/*******************************************************************************
*
*	SOUNDS
*
*******************************************************************************/

//- Load and Initialize Sounds -------------------------------------------------
function loadSounds(audoLoader,listener,air_,mys_,myg_,xac_,xag_,xsg_,aaf_) {
	// Load MYP Sounds .........................................................
	let RefDst = 25;			// Reference distance for Positional Audio
	// My Engine
	let fname = mys_.EngSrc;
	audoLoader.load(fname, function(buffer) {
		mys_.EngSnd.setBuffer(buffer);
		mys_.EngSnd.setRefDistance(RefDst);
		mys_.EngSnd.setVolume(0);
		mys_.EngSnd.setLoop(true);
	});
	// My Prop
	fname = mys_.PrpSrc;
	audoLoader.load(fname, function(buffer) {
		mys_.PrpSnd.setBuffer(buffer);
		mys_.PrpSnd.setRefDistance(RefDst);
		mys_.PrpSnd.setVolume(0);
		mys_.PrpSnd.setLoop(true);
	});
	// My Guns (Left and Rite)
	fname = myg_.SndSrc;
	for (let n = 0; n < myg_.ObjNum; n ++) {
		audoLoader.load(fname, function(buffer) {
			myg_.SndPtr[n].setBuffer(buffer);
			myg_.SndPtr[n].setRefDistance(RefDst);
			myg_.SndPtr[n].setVolume(0);
			myg_.SndPtr[n].setLoop(true);
		});
	}
	// Load XAC Sounds .........................................................
	// XP Engines
	for (let n = 0; n < xac_.ObjNum; n ++) {
		fname = xac_.EngSrc[n];	
		audoLoader.load(fname, function(buffer) {
			xac_.EngPtr[n].setBuffer(buffer);
			xac_.EngPtr[n].setRefDistance(RefDst); // Distance at which sound is full volume
			xac_.EngPtr[n].setVolume(0);
			xac_.EngPtr[n].setLoop(true);
			xac_.EngPtr[n].playbackRate = 1.3;
		});
	}
	// XP Guns
	for (let n = 0; n < xag_.ObjNum; n ++) {
		fname = xag_.SndSrc[n];	
		audoLoader.load(fname, function(buffer) {
			xag_.SndPtr[n].setBuffer(buffer);
			xag_.SndPtr[n].setRefDistance(RefDst); // Distance at which sound is full volume
			xag_.SndPtr[n].setVolume(0);
			xag_.SndPtr[n].setLoop(true);
			xag_.SndPtr[n].playbackRate = 1.3;
		});	
	}
	// The Next 3 Sounds Are All the Same (for now)
	//
	// XP End Explosion
	fname = xac_.SndSrc;
	for (let n = 0; n < aaf_.ObjNum; n ++) {
		audoLoader.load(fname, function(buffer) {
			xac_.SndPtr[n].setBuffer(buffer);
			xac_.SndPtr[n].setRefDistance(RefDst);
			xac_.SndPtr[n].setVolume(0);
		});	
	}
	// Load AAA Sounds .........................................................
	// XS Guns - End Explosion
	fname = xsg_.SndSrc;
	for (let n = 0; n < xsg_.ObjNum; n ++) {
		audoLoader.load(fname, function(buffer) {
			xsg_.SndPtr[n].setBuffer(buffer);
			xsg_.SndPtr[n].setRefDistance(RefDst);
			xsg_.SndPtr[n].setVolume(0);
		});	
	}
	// AA Guns - End Explosion
	fname = aaf_.SndSrc;
	for (let n = 0; n < aaf_.ObjNum; n ++) {
		audoLoader.load(fname, function(buffer) {
			aaf_.SndPtr[n].setBuffer(buffer);
			aaf_.SndPtr[n].setRefDistance(RefDst);
			aaf_.SndPtr[n].setVolume(0);
		});	
	}
	// Init Sounds .............................................................
	//- My Engine and Prop
	mys_.EngSnd = new THREE.PositionalAudio(listener);
	mys_.PrpSnd = new THREE.PositionalAudio(listener);
	mys_.AirMsh.add(mys_.EngSnd);			// Engine
	mys_.AirMsh.add(mys_.PrpSnd);			// Prop
	mys_.AirMsh.position.z = -5;
	air_.AirObj.add(mys_.AirMsh);
	//- My Guns (Left and Rite)
	for (let n = 0; n < myg_.ObjNum; n ++) {
		myg_.SndPtr[n] = new THREE.PositionalAudio(listener);
		myg_.SndMsh[n].add(myg_.SndPtr[n]);
		myg_.SndMsh[n].position.x = -5;
		air_.AirObj.add(myg_.SndMsh[n]);
	}
	//- Moving Airplane Sounds (centered at ObjAdr)
	for (let n = 0; n < xac_.ObjNum; n ++) {
		// Engine
		xac_.EngPtr[n] = new THREE.PositionalAudio(listener);
		xac_.EngMsh[n].add(xac_.EngPtr[n]);
		xac_.ObjAdr[n].add(xac_.EngMsh[n]);
		// Guns
		xag_.SndPtr[n] = new THREE.PositionalAudio(listener);
		xag_.SndMsh[n].add(xag_.SndPtr[n]);
		xac_.ObjAdr[n].add(xag_.SndMsh[n]);
		// End Explosion
		xac_.SndPtr[n] = new THREE.PositionalAudio(listener);
		xac_.SndMsh[n].add(xac_.SndPtr[n]);
		xac_.ObjAdr[n].add(xac_.SndMsh[n]);	
	}
	// Moving Ship AAA - End Explosions
	for (let n = 0; n < xsg_.ObjNum; n ++) {
		xsg_.SndPtr[n] = new THREE.PositionalAudio(listener);
		xsg_.SndMsh[n].add(xsg_.SndPtr[n]);
		xsg_.SmkPtr[n].add(xsg_.SndMsh[n]);
	}
	// Fixed Ground AAA - End Explosions
	for (let n = 0; n < aaf_.ObjNum; n ++) {
		aaf_.SndPtr[n] = new THREE.PositionalAudio(listener);
		aaf_.SndMsh[n].add(aaf_.SndPtr[n]);
		aaf_.SmkPtr[n].add(aaf_.SndMsh[n]);
	}
	//- Set Flag
	LodSnd = 1;
}

//- Change All Sounds ----------//----------------------------------------------
function moveSounds(air_,mys_,myg_,xac_,xag_,xsg_,aaf_) {
	//- My Airplane ............................................................
	//-	Engine Running
	mys_.EngSnd.setVolume(mys_.EngVol + air_.PwrPct * 0.05); // Range = .1 to .2
	mys_.EngSnd.setPlaybackRate(1 + air_.PwrPct * 0.5); // Range = 1 to 1.5
	//-	Prop Spinning
	mys_.PrpSnd.setVolume(mys_.PrpVol + air_.PwrPct * 0.15); // Range = .1 to .4
	mys_.PrpSnd.setPlaybackRate(1 + air_.PwrPct * 0.5); // Range = 1 to 1.5
	//-	Guns Firing (Left and Rite)
	for (let n = 0; n < myg_.ObjNum; n ++) {
		myg_.SndPtr[n].setVolume(myg_.SndVol);
	}
	//- XAC ....................................................................
	//-	Engine Running
	for (let n = 0; n < xac_.ObjNum; n ++) {
		xac_.EngPtr[n].setVolume(xac_.EngVol[n]);
	}
	//-	Gun Firing
	for (let n = 0; n < xag_.ObjNum; n ++) {
		xag_.SndPtr[n].setVolume(xag_.SndVol[n]);
	}
	//-	Ending Explosion
	for (let n = 0; n < xac_.ObjNum; n ++) {
		xac_.SndPtr[n].setVolume(xac_.SndVol);
	}
	//- XAS ....................................................................
	//-	Ending Explosion
	for (let n = 0; n < xsg_.ObjNum; n ++) {
		xsg_.SndPtr[n].setVolume(xsg_.SndVol);
	}
	//- AAA ....................................................................	
	//-	Ending Explosion
	for (let n = 0; n < aaf_.ObjNum; n ++) {
		aaf_.SndPtr[n].setVolume(aaf_.SndVol);
	}
}

//- Play All Sounds ------------//----------------------------------------------
function playSounds(mys_,myg_,xac_,xag_,xsg_,aaf_,MYGFlg,) {
	// This leaves SndFlg = 1 and MYGFlg unchanged.
	//- My Airplane ............................................................
	//-	Engine Running
	if (!mys_.EngSnd.isPlaying) mys_.EngSnd.play();
	//-	Prop Spinning
	if (!mys_.PrpSnd.isPlaying) mys_.PrpSnd.play();
	//-	Guns Firing (Left and Rite)
	for (let n = 0; n < myg_.ObjNum; n ++) {
		if (MYGFlg && !myg_.SndPtr[n].isPlaying) myg_.SndPtr[n].play();
	}
	//- XAC ....................................................................
	// Engine Running
	for (let n = 0; n < xac_.ObjNum; n ++) {
		if (!xac_.EngPtr[n].isPlaying) xac_.EngPtr[n].play();
	}
	//-	Guns Firing
	for (let n = 0; n < xag_.ObjNum; n ++) {
//		if (!xag_.SndPtr[n].isPlaying) xag_.SndPtr[n].play(); // ### FIX THIS - only when firing
	}
	//- Ending Explosion
	//	Activated in EndSeq
	//- XAS ....................................................................
	//	Ending Explosion
	//	Activated in PlayXS
	//- AAA ....................................................................
	//	Ending Explosion
	//	Activated in PlayAA
}

//- Stop All Sounds ------------//----------------------------------------------
function stopSounds(mys_,myg_,xac_,xag_,xsg_,aaf_) {
	// This leaves SndFlg = 0 and MYGFlg unchanged.
	//- My Airplane ............................................................
	//-	Engine Running
	if (mys_.EngSnd.isPlaying) mys_.EngSnd.stop();
	//-	Prop Spinning
	if (mys_.PrpSnd.isPlaying) mys_.PrpSnd.stop();
	//-	Guns Firing (Left and Rite)
	for (let n = 0; n < myg_.ObjNum; n ++) {
		if (myg_.SndPtr[n].isPlaying) myg_.SndPtr[n].stop();
	}
	//- XAC ....................................................................
	//-	Engine Running
	for (let n = 0; n < xac_.ObjNum; n ++) {
		if (xac_.EngPtr[n].isPlaying) xac_.EngPtr[n].stop();
	}
	//	Guns Firing
	for (let n = 0; n < xag_.ObjNum; n ++) {
		if (xag_.SndPtr[n].isPlaying) xag_.SndPtr[n].stop();
	}
	//-	End Explosion
	for (let n = 0; n < xac_.ObjNum; n ++) {
		if (xac_.SndPtr[n].isPlaying) xac_.SndPtr[n].stop();
	}	
	//- XAS ....................................................................
	// Ending Explosion
	for (let n = 0; n < xsg_.ObjNum; n ++) {
		if (xsg_.SndPtr[n].isPlaying) xsg_.SndPtr[n].stop();
	}
	//- AAA ....................................................................
	// Ending Explosion
	for (let n = 0; n < aaf_.ObjNum; n ++) {
		if (aaf_.SndPtr[n].isPlaying) aaf_.SndPtr[n].stop();
	}
}

/*******************************************************************************
*
*	RADIO SOUNDS
*
*******************************************************************************/

//=	Load Radio Sounds ==========//=============================================
function loadRadios(audoloader,listener,rad_) {	
	//-	Static
	rad_.SndAdr[0] = new Audio(listener);	
	audoLoader.load(rad_.SndSrc[0],function(buffer) {
		rad_.SndAdr[0].setBuffer(buffer);
		rad_.SndAdr[0].setVolume(1.0);
	});
	//-	Radio
	rad_.SndAdr[1] = new Audio(listener);	
	audoLoader.load(rad_.SndSrc[1],function(buffer) {
		rad_.SndAdr[1].setBuffer(buffer);
		rad_.SndAdr[1].setVolume(0.7);
		rad_.SndAdr[0].setPlaybackRate(1.05);
	});
}

//= Start Radio Sequence =======//==============================================
function strtRadSeq(rad_) {
	rad_.SeqTim = 1;			// Start timer when leave ground
	rad_.SegPtr = 0;			// Restart Event Pointer
}

//= Continue Radio Sequence ====//==============================================
function contRadSeq(rad_) {
	rad_.SeqTim = rad_.SeqTim + difTim; // Once started, keep updating
	if (rad_.SeqTim > rad_.SegBeg[rad_.SegPtr]) { // If Arrived at Target Time
		playRadSeg(rad_.SegSel[rad_.SegPtr]); // Play This Segment
		rad_.SegPtr++;			// Go to next segment in list
		if (rad_.SegPtr == rad_.SegNum) rad_.SeqDun = 1; // If Done with Sequence
	}
}

//=	Play Radio Segment =========//==============================================
function playRadSeg(rad_,n) {
	// SegIdx 0 = "Over Island"; SegIdx 1 = "Help"; SegIdx 2 = "Thanks"
	rad_.SegIdx = n;
	if (SndFlg) {
		// Static
		if (!rad_.SndAdr[0].isPlaying) {
			rad_.SndAdr[0].offset = rad_.SegSta[rad_.SegIdx];
			rad_.SndAdr[0].play();
			rad_.SndAdr[0].stop(rad_.SegEnd[rad_.SegIdx]);
		}
		// Radio
		if (!rad_.SndAdr[1].isPlaying) {
			rad_.SndAdr[1].offset = rad_.SegOff[rad_.SegIdx];
			rad_.SndAdr[1].play();
			rad_.SndAdr[1].stop(rad_.SegEnd[rad_.SegIdx]);
		}
	}
}

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {loadSounds,moveSounds,stopSounds,loadRadios,strtRadSeq,contRadSeq,playRadSeg};

/*******************************************************************************
*
*	REVISIONS
*
*******************************************************************************/

// * 250316:	Created
