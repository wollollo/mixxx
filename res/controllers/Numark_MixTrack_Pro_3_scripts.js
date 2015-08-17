// Mixtrack Pro 3 Script
// Based on scripts for Pro 1

// Based on Numark Mixtrack Mapping Script Functions
// 1/11/2010 - v0.1 - Matteo <matteo@magm3.com>
//
// 5/18/2011 - Changed by James Ralston
//
// Known Bugs:
//	Mixxx complains about an undefined variable on 1st load of the mapping (ignore it, then restart Mixxx)
//	Each slide/knob needs to be moved on Mixxx startup to match levels with the Mixxx UI
//
// 05/26/2012 to 06/27/2012 - Changed by Darío José Freije <dario2004@gmail.com>
//
//	Almost all work like expected. Resume and Particularities:
//
// ************* Script now is Only for 1.11.0 and above *************
//
//	Delete + Effect: Brake Effect (maintain pressed).
//			 Flanger Delay (2nd knob of effect section): Adjust the speed of Brake.
//
//	Delete + Hotcues: Clear Hotcues (First press Delete, then Hotcue).
//	Delete + Reloop:  Clear Loop.
//	Delete + Manual:  Set Quantize ON (for best manual loop) or OFF.
//	Delete + Sync: 	  Set Pitch to Zero.
//
// 	Load track: 	Only if the track is paused. Put the pitch in 0 at load.
//
//  	Gain: 	The 3rd knob of the "effect" section is "Gain" (up to clip).
//
//	Effect:	Flanger. 1st and 2nd knob modify Depth and Delay.
//
//	Cue: 	Don't set Cue accidentaly at the end of the song (return to the lastest cue).
//		LED ON when stopped. LED OFF when playing.
//		LED Blink at Beat time in the ultimates 30 seconds of song.
//
// 	Stutter: Adjust BeatGrid in the correct place (usefull to sync well).
//		 LED Blink at each Beat of the grid.
//
//	Sync:	If the other deck is stopped, only sync tempo (not fase).
//		LED Blink at Clip Gain (Peak indicator).
//
// 	Pitch: 	Up, Up; Down, Down. Pitch slide are inverted, to match with the screen (otherwise is very confusing).
//		Soft-takeover to prevent sudden wide parameter changes when the on-screen control diverges from a hardware control.
//		The control will have no effect until the position is close to that of the software,
//		at which point it will take over and operate as usual.
//
// 	Auto Loop (LED ON): 	Active at program Start.
//				"1 Bar" button: Active an Instant 4 beat Loop. Press again to exit loop.
//
//	Scratch:
//	In Stop mode, with Scratch OFF or ON: 	Scratch at touch, and Stop moving when the wheel stop moving.
//	In Play mode, with Scratch OFF: 	Only Pitch bend.
// 	In Play mode, with Scratch ON: 		Scratch at touch and, in Backwards Stop Scratch when the wheel stop moving for 20ms -> BACKSPIN EFFECT!!!!.
//						In Fordward Stop Scratch when the touch is released > Play Inmediatly (without breaks for well mix).
//						Border of the wheels: Pitch Bend.
//


function NumarkMixTrackPro3() {}

NumarkMixTrackPro3.init = function(id) {	// called when the MIDI device is opened & set up
	NumarkMixTrackPro3.id = id;	// Store the ID of this device for later use

	NumarkMixTrackPro3.directoryMode = false;
	NumarkMixTrackPro3.scratchMode = [false, false];
	NumarkMixTrackPro3.manualLoop = [true, true];
	//NumarkMixTrackPro3.deleteKey = [false, false];
	NumarkMixTrackPro3.shiftKey = [false, false];
	NumarkMixTrackPro3.isKeyLocked = [0, 0];
	NumarkMixTrackPro3.touch = [false, false];
	NumarkMixTrackPro3.scratchTimer = [-1, -1];

//NumarkMixTrackPro3.leds = [
		//// Common
		//{ "directory": 0x73, "file": 0x72 },
		//// Deck 1
		//{ "rate": 0x70, "scratchMode": 0x48, "manualLoop": 0x61,
		//"loop_start_position": 0x53, "loop_end_position": 0x54, "reloop_exit": 0x55,
		//"deleteKey" : 0x59, "hotCue1" : 0x5a,"hotCue2" : 0x5b,"hotCue3" :  0x5c,
		//"stutter" : 0x4a, "Cue" : 0x33, "sync" : 0x40
		//},
		//// Deck 2
		//{ "rate": 0x71, "scratchMode": 0x50, "manualLoop": 0x62,
		//"loop_start_position": 0x56, "loop_end_position": 0x57, "reloop_exit": 0x58,
		//"deleteKey" : 0x5d, "hotCue1" : 0x5e, "hotCue2" : 0x5f, "hotCue3" :  0x60,
		//"stutter" : 0x4c, "Cue" : 0x3c, "sync" : 0x47
		//}
	//];

NumarkMixTrackPro3.ledCategories = { "master": 0, "channel1": 1, "channe2": 2, "meters": 3};
NumarkMixTrackPro3.leds = [
        // Master: all are first byte 0x90
        { "headphones1": 0x0e, "headphones2": 0x0f, "all": 0x75},
		// Deck 1: first byte 0x91
		{ "scratchMode": 0x06, "manualLoop": 0x17,
		"loop_start_position": 0x17, "loop_end_position": 0x18, "reloop_exit": 0x19, "loop_halve": 0x1a,
		"hotCue1" : 0x1b,"hotCue2" : 0x1c,"hotCue3" :  0x1d, "hotcue4": 0x1e,
		"Cue" : 0x03, "sync" : 0x02, "play": 0x01,
        "fx1": 0x07, "fx2": 0x08, "fx3": 0x09, "tap": 0x0a
		},
		// Deck 2: first byte 0x92
		{ "scratchMode": 0x06, "manualLoop": 0x17,
		"loop_start_position": 0x17, "loop_end_position": 0x18, "reloop_exit": 0x19, "loop_halve": 0x1a,
		"hotCue1" : 0x1b,"hotCue2" : 0x1c,"hotCue3" :  0x1d, "hotcue4": 0x1e,
		"Cue" : 0x03, "sync" : 0x02, "play": 0x01,
        "fx1": 0x07, "fx2": 0x08, "fx3": 0x09, "tap": 0x0a
		},
        // Meters: first byte 0xb0
        { "meter1": 0x02, "meter2": 0x03}
	];

	NumarkMixTrackPro3.ledTimers = {};

	NumarkMixTrackPro3.LedTimer = function(id, category, led, count, state){
		this.id = id;
        this.category = category;
		this.led = led;
		this.count = count;
		this.state = state;
	}

	//for (i=0x30; i<=0x73; i++) midi.sendShortMsg(0x90, i, 0x00); 	// Turn off all the lights
    midi.sendShortMsg(0x90, NumarkMixTrackPro3.leds[0]["all"], 0x00) // Turn off all the lights

	//NumarkMixTrackPro3.hotCue = { // not used for Pro 3
			////Deck 1
			//0x5a:"1", 0x5b:"2", 0x5c:"3",
			////Deck 2
			//0x5e: "1", 0x5f:"2", 0x60:"3"
			//};

	//Add event listeners
	for (var i=1; i<3; i++){
		for (var x=1; x<4; x++){
			engine.connectControl("[Channel" + i +"]", "hotcue_"+ x +"_enabled", "NumarkMixTrackPro3.onHotCueChange");
		}
		NumarkMixTrackPro3.setLoopMode(i, false);
	}

	//NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[0]["file"], true); // not used for Pro 3


// Enable soft-takeover for Pitch slider

	engine.softTakeover("[Channel1]", "rate", true);
	engine.softTakeover("[Channel2]", "rate", true);


// Clipping LED -- uses top light of meter
    engine.connectControl("[Master]","PeakIndicator","NumarkMixTrackPro3.meter");
    engine.connectControl("[Channel1]","PeakIndicator","NumarkMixTrackPro3.meter");
    engine.connectControl("[Channel2]","PeakIndicator","NumarkMixTrackPro3.meter");
	//engine.connectControl("[Channel1]","PeakIndicator","NumarkMixTrackPro3.Channel1Clip");
	//engine.connectControl("[Channel2]","PeakIndicator","NumarkMixTrackPro3.Channel2Clip");

// Stutter beat light // not used for Pro 3
	//engine.connectControl("[Channel1]","beat_active","NumarkMixTrackPro3.Stutter1Beat");
	//engine.connectControl("[Channel2]","beat_active","NumarkMixTrackPro3.Stutter2Beat");

// VU Meters
    engine.connectControl("[Master]","VuMeter","NumarkMixTrackPro3.meters");
    engine.connectControl("[Channel1]","VuMeter","NumarkMixTrackPro3.meters");
    engine.connectControl("[Channel2]","VuMeter","NumarkMixTrackPro3.meters");
}

NumarkMixTrackPro3.Channel1Clip = function (value) {
	NumarkMixTrackPro3.clipLED(value,NumarkMixTrackPro3.leds[1]["sync"]);

}

NumarkMixTrackPro3.Channel2Clip = function (value) {
	NumarkMixTrackPro3.clipLED(value,NumarkMixTrackPro3.leds[2]["sync"]);

}

NumarkMixTrackPro3.Stutter1Beat = function (value) {

	var secondsBlink = 30;
    	var secondsToEnd = engine.getValue("[Channel1]", "duration") * (1-engine.getValue("[Channel1]", "playposition"));

	if (secondsToEnd < secondsBlink && secondsToEnd > 1 && engine.getValue("[Channel1]", "play")) { // The song is going to end

		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[1]["Cue"], value);
	}
	NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[1]["stutter"], value);

}

NumarkMixTrackPro3.Stutter2Beat = function (value) {

	var secondsBlink = 30;
    	var secondsToEnd = engine.getValue("[Channel2]", "duration") * (1-engine.getValue("[Channel2]", "playposition"));

	if (secondsToEnd < secondsBlink && secondsToEnd > 1 && engine.getValue("[Channel2]", "play")) { // The song is going to end

		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[2]["Cue"], value);
	}

	NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[2]["stutter"], value);

}

NumarkMixTrackPro3.clipLED = function (value, note) {

	if (value>0) NumarkMixTrackPro3.flashLED(note, 1);

}

NumarkMixTrackPro3.shutdown = function(id) {	// called when the MIDI device is closed

	// First Remove event listeners
	for (var i=1; i<2; i++){
		for (var x=1; x<4; x++){
			engine.connectControl("[Channel" + i +"]", "hotcue_"+ x +"_enabled", "NumarkMixTrackPro3.onHotCueChange", true);
		}
		NumarkMixTrackPro3.setLoopMode(i, false);
	}

	//var lowestLED = 0x30;
	//var highestLED = 0x73;
	//for (var i=lowestLED; i<=highestLED; i++) {
		//NumarkMixTrackPro3.setLED(i, false);	// Turn off all the lights
	//}
    midi.sendShortMsg(0x90, NumarkMixTrackPro3.leds[0]["all"], 0x00);

}

NumarkMixTrackPro3.samplesPerBeat = function(group) {
	// FIXME: Get correct samplerate and channels for current deck
	var sampleRate = 44100;
	var channels = 2;
	var bpm = engine.getValue(group, "file_bpm");
	return channels * sampleRate * 60 / bpm;
}

NumarkMixTrackPro3.groupToDeck = function(group) {

	var matches = group.match(/^\[Channel(\d+)\]$/);

	if (matches == null) {
		return -1;
	} else {
		return matches[1];
	}

}

// category needs to be 0x90, 0x91, 0x92 or 0xb0 as appropriate,
// should be enumerated somehow, to also fit with led enum
NumarkMixTrackPro3.setLED = function(category, led, value) {
    var status = 0x00;
    if(category == 0)
        status = 0x90;
    if(category == 1)
        status = 0x91;
    if(category == 2)
        status = 0x92;
    if(category == 3)
        status = 0xb0;

	midi.sendShortMsg(status, led, value);
}

NumarkMixTrackPro3.flashLED = function (category, led, veces){
	var ndx = Math.random();
	var func = "NumarkMixTrackPro3.doFlash(" + ndx + ", " + veces + ")";
	var id = engine.beginTimer(120, func);
	NumarkMixTrackPro3.ledTimers[ndx] =  new NumarkMixTrackPro3.LedTimer(id, category, led, 0, false);
}

NumarkMixTrackPro3.doFlash = function(ndx, veces){
	var ledTimer = NumarkMixTrackPro3.ledTimers[ndx];

	if (!ledTimer) return;

	if (ledTimer.count > veces){ // how many times blink the button
		engine.stopTimer(ledTimer.id);
		delete NumarkMixTrackPro3.ledTimers[ndx];
	} else{
		ledTimer.count++;
		ledTimer.state = !ledTimer.state;
		NumarkMixTrackPro3.setLED(ledTimer.category, ledTimer.led, ledTimer.state);
	}
}

NumarkMixTrackPro3.selectKnob = function(channel, control, value, status, group) {
	if (value > 63) {
		value = value - 128;
	}
	if (NumarkMixTrackPro3.directoryMode) {
		if (value > 0) {
			for (var i = 0; i < value; i++) {
				engine.setValue(group, "SelectNextPlaylist", 1);
			}
		} else {
			for (var i = 0; i < -value; i++) {
				engine.setValue(group, "SelectPrevPlaylist", 1);
			}
		}
	} else {
		engine.setValue(group, "SelectTrackKnob", value);

	}
}

// Unnecessary: Mixxx already stops us loading in a playing channel,
// I prefer not having the pitch reset
NumarkMixTrackPro3.LoadTrack = function(channel, control, value, status, group) {

	// Load the selected track in the corresponding deck only if the track is paused

	if(value && engine.getValue(group, "play") != 1)
	{
		engine.setValue(group, "LoadSelectedTrack", 1);

		// cargar el tema con el pitch en 0
        // (I don't want this, commented out) - wollollo
		//engine.softTakeover(group, "rate", false);
		//engine.setValue(group, "rate", 0);
		//engine.softTakeover(group, "rate", true);
	}
	else engine.setValue(group, "LoadSelectedTrack", 0);

}

NumarkMixTrackPro3.flanger = function(channel, control, value, status, group) {

// 	if (!value) return;

	var deck = NumarkMixTrackPro3.groupToDeck(group);

	var speed = 1;

	if(NumarkMixTrackPro3.deleteKey[deck-1]){

	// Delete + Effect = Brake

//	print ("Delay: " + engine.getValue("[Flanger]","lfoDelay"));

		if (engine.getValue("[Flanger]","lfoDelay") < 5026) {

			speed = engine.getValue("[Flanger]","lfoDelay") / 5025;

			if (speed < 0) speed = 0;

		} else {

			speed = (engine.getValue("[Flanger]","lfoDelay") - 5009)/ 16,586666667

			if (speed > 300) speed = 300;
		}

//	print ("Speed: " + speed);

		engine.brake(deck, value, speed);

		if (!value) NumarkMixTrackPro3.toggleDeleteKey(channel, control, 1, status, group);

	} else {
		if (!value) return;
		if (engine.getValue(group, "flanger")) {
			engine.setValue(group, "flanger", 0);
		}else{
			engine.setValue(group, "flanger", 1);
		}
	}

}


NumarkMixTrackPro3.cuebutton = function(channel, control, value, status, group) {


	// Don't set Cue accidentaly at the end of the song
	if (engine.getValue(group, "playposition") <= 0.97) {
			engine.setValue(group, "cue_default", value ? 1 : 0);
	} else {
		engine.setValue(group, "cue_preview", value ? 1 : 0);
	}

}

NumarkMixTrackPro3.beatsync = function(channel, control, value, status, group) {

	var deck = NumarkMixTrackPro3.groupToDeck(group);

	if(NumarkMixTrackPro3.deleteKey[deck-1]){

		// Delete + SYNC = vuelve pitch a 0
		engine.softTakeover(group, "rate", false);
		engine.setValue(group, "rate", 0);
		engine.softTakeover(group, "rate", true);

		NumarkMixTrackPro3.toggleDeleteKey(channel, control, value, status, group);

	} else {

			if (deck == 1) {
				// si la otra deck esta en stop, sincronizo sólo el tempo (no el golpe)
				if(!engine.getValue("[Channel2]", "play")) {
					engine.setValue(group, "beatsync_tempo", value ? 1 : 0);
				} else {
						engine.setValue(group, "beatsync", value ? 1 : 0);
					}
			}

			if (deck == 2) {
				// si la otra deck esta en stop, sincronizo sólo el tempo (no el golpe)
				if(!engine.getValue("[Channel1]", "play")) {
					engine.setValue(group, "beatsync_tempo", value ? 1 : 0);
				} else {
						engine.setValue(group, "beatsync", value ? 1 : 0);
					}
			}
		}
}


NumarkMixTrackPro3.playbutton = function(channel, control, value, status, group) {

	if (!value) return;

	var deck = NumarkMixTrackPro3.groupToDeck(group);

	if (engine.getValue(group, "play")) {
		engine.setValue(group, "play", 0);
	}else{
		engine.setValue(group, "play", 1);
	}

}


NumarkMixTrackPro3.loopIn = function(channel, control, value, status, group) {
	var deck = NumarkMixTrackPro3.groupToDeck(group);

	if (NumarkMixTrackPro3.manualLoop[deck-1]){
		if (!value) return;
		// Act like the Mixxx UI
		engine.setValue(group, "loop_in", status?1:0);
		return;
	}

	// Auto Loop: 1/2 loop size
	var start = engine.getValue(group, "loop_start_position");
	var end = engine.getValue(group, "loop_end_position");
	if (start<0 || end<0) {
		NumarkMixTrackPro3.flashLED(NumarkMixTrackPro3.leds[deck]["loop_start_position"], 4);
		return;
	}

	if (value){
		var start = engine.getValue(group, "loop_start_position");
		var end = engine.getValue(group, "loop_end_position");
		var len = (end - start) / 2;
		engine.setValue(group, "loop_end_position", start + len);
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["loop_start_position"], true); //TODO: fix setLED
	} else {
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["loop_start_position"], false); //TODO: fix setLED
	}
}

NumarkMixTrackPro3.loopOut = function(channel, control, value, status, group) {
	var deck = NumarkMixTrackPro3.groupToDeck(group);

	if (!value) return;

	if (NumarkMixTrackPro3.manualLoop[deck-1]){
		// Act like the Mixxx UI
		engine.setValue(group, "loop_out", status?1:0);
		return;
	}

	var isLoopActive = engine.getValue(group, "loop_enabled");

	// Set a 4 beat auto loop or exit the loop

	if(!isLoopActive){
		engine.setValue(group,"beatloop_4",1);
	}else{
		engine.setValue(group,"beatloop_4",0);
	}

}

NumarkMixTrackPro3.repositionHack = function(group, oldPosition){
	// see if the value has been updated
	if (engine.getValue(group, "loop_start_position")==oldPosition){
		if (NumarkMixTrackPro3.hackCount[group]++ < 9){
			engine.beginTimer(20, "NumarkMixTrackPro3.repositionHack('" + group + "', " + oldPosition + ")", true);
		} else {
			var deck = NumarkMixTrackPro3.groupToDeck(group);
			NumarkMixTrackPro3.flashLED(NumarkMixTrackPro3.leds[deck]["loop_start_position"], 4);
		}
		return;
	}
	var bar = NumarkMixTrackPro3.samplesPerBeat(group);
	var start = engine.getValue(group, "loop_start_position");
	engine.setValue(group,"loop_end_position", start + bar);
}

NumarkMixTrackPro3.reLoop = function(channel, control, value, status, group) {
	var deck = NumarkMixTrackPro3.groupToDeck(group);

	if (NumarkMixTrackPro3.manualLoop[deck-1]){
		// Act like the Mixxx UI (except for working delete)
		if (!value) return;
		if (NumarkMixTrackPro3.deleteKey[deck-1]){
			engine.setValue(group, "reloop_exit", 0);
			engine.setValue(group, "loop_start_position", -1);
			engine.setValue(group, "loop_end_position", -1);
			NumarkMixTrackPro3.toggleDeleteKey(channel, control, value, status, group);
		} else {
			engine.setValue(group, "reloop_exit", status?1:0);
		}
		return;
	}

	// Auto Loop: Double Loop Size
	var start = engine.getValue(group, "loop_start_position");
	var end = engine.getValue(group, "loop_end_position");
	if (start<0 || end<0) {
		NumarkMixTrackPro3.flashLED(NumarkMixTrackPro3.leds[deck]["reloop_exit"], 4);
		return;
	}

	if (value){
		var len = (end - start) * 2;
		engine.setValue(group, "loop_end_position", start + len);
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["reloop_exit"], true); //TODO: fix setLED
	} else {
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["reloop_exit"], false); //TODO: fix setLED
	}
}

NumarkMixTrackPro3.setLoopMode = function(deck, manual) {

	NumarkMixTrackPro3.manualLoop[deck-1] = manual;
	NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["manualLoop"], !manual); //TODO: fix setLED
	engine.connectControl("[Channel" + deck + "]", "loop_start_position", "NumarkMixTrackPro3.onLoopChange", !manual);
	engine.connectControl("[Channel" + deck + "]", "loop_end_position", "NumarkMixTrackPro3.onLoopChange", !manual);
	engine.connectControl("[Channel" + deck + "]", "loop_enabled", "NumarkMixTrackPro3.onReloopExitChange", !manual);
	engine.connectControl("[Channel" + deck + "]", "loop_enabled", "NumarkMixTrackPro3.onReloopExitChangeAuto", manual);

	var group = "[Channel" + deck + "]"
	if (manual){
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["loop_start_position"], engine.getValue(group, "loop_start_position")>-1); //TODO: fix setLED
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["loop_end_position"], engine.getValue(group, "loop_end_position")>-1); //TODO: fix setLED
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["reloop_exit"], engine.getValue(group, "loop_enabled")); //TODO: fix setLED
	}else{
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["loop_start_position"], false); //TODO: fix setLED
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["loop_end_position"], engine.getValue(group, "loop_enabled")); //TODO: fix setLED
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["reloop_exit"], false); //TODO: fix setLED
	}
}

NumarkMixTrackPro3.toggleManualLooping = function(channel, control, value, status, group) {
	if (!value) return;

	var deck = NumarkMixTrackPro3.groupToDeck(group);

	if(NumarkMixTrackPro3.deleteKey[deck-1]){
		// activar o desactivar quantize

		if (engine.getValue(group, "quantize")) {
			engine.setValue(group, "quantize", 0);
		}else{
			engine.setValue(group, "quantize", 1);
		}

		NumarkMixTrackPro3.toggleDeleteKey(channel, control, value, status, group);
	} else {

		NumarkMixTrackPro3.setLoopMode(deck, !NumarkMixTrackPro3.manualLoop[deck-1]);
	}
}

NumarkMixTrackPro3.onLoopChange = function(value, group, key){
	var deck = NumarkMixTrackPro3.groupToDeck(group);
	NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck][key], value>-1? true : false); //TODO: fix setLED
}

NumarkMixTrackPro3.onReloopExitChange = function(value, group, key){
	var deck = NumarkMixTrackPro3.groupToDeck(group);
	NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]['reloop_exit'], value); //TODO: fix setLED
}

NumarkMixTrackPro3.onReloopExitChangeAuto = function(value, group, key){
	var deck = NumarkMixTrackPro3.groupToDeck(group);
	NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]['loop_end_position'], value); //TODO: fix setLED
}

// Stutters adjust BeatGrid // TODO: needed? fix setLED
NumarkMixTrackPro3.playFromCue = function(channel, control, value, status, group) {

	var deck = NumarkMixTrackPro3.groupToDeck(group);

	if (engine.getValue(group, "beats_translate_curpos")){

		engine.setValue(group, "beats_translate_curpos", 0);
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["stutter"], 0);
	}else{
		engine.setValue(group, "beats_translate_curpos", 1);
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["stutter"], 1);
	}

}

NumarkMixTrackPro3.pitch = function(channel, control, value, status, group) {
	var deck = NumarkMixTrackPro3.groupToDeck(group);

	var pitch_value = 0;

	if (value < 64) pitch_value = (value-64) /64;
	if (value > 64) pitch_value = (value-64) /63;

	engine.setValue("[Channel"+deck+"]","rate",pitch_value);
}


NumarkMixTrackPro3.jogWheel = function(channel, control, value, status, group) {
	var deck = NumarkMixTrackPro3.groupToDeck(group);

// 	if (!NumarkMixTrackPro3.touch[deck-1] && !engine.getValue(group, "play")) return;

	var adjustedJog = parseFloat(value);
	var posNeg = 1;
	if (adjustedJog > 63) {	// Counter-clockwise
		posNeg = -1;
		adjustedJog = value - 128;
	}

	if (engine.getValue(group, "play")) {

		if (NumarkMixTrackPro3.scratchMode[deck-1] && posNeg == -1 && !NumarkMixTrackPro3.touch[deck-1]) {

			if (NumarkMixTrackPro3.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackPro3.scratchTimer[deck-1]);
			NumarkMixTrackPro3.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackPro3.jogWheelStopScratch(" + deck + ")", true);
		}

	} else { // en stop hace scratch siempre

		if (!NumarkMixTrackPro3.touch[deck-1]){

			if (NumarkMixTrackPro3.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackPro3.scratchTimer[deck-1]);
			NumarkMixTrackPro3.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackPro3.jogWheelStopScratch(" + deck + ")", true);
		}

	}

	engine.scratchTick(deck, adjustedJog);

	if (engine.getValue(group,"play")) {
		var gammaInputRange = 13;	// Max jog speed
		var maxOutFraction = 0.8;	// Where on the curve it should peak; 0.5 is half-way
		var sensitivity = 0.5;		// Adjustment gamma
		var gammaOutputRange = 2;	// Max rate change

		adjustedJog = posNeg * gammaOutputRange * Math.pow(Math.abs(adjustedJog) / (gammaInputRange * maxOutFraction), sensitivity);
		engine.setValue(group, "jog", adjustedJog);
	}

}


NumarkMixTrackPro3.jogWheelStopScratch = function(deck) {
	NumarkMixTrackPro3.scratchTimer[deck-1] = -1;
	engine.scratchDisable(deck);
}

NumarkMixTrackPro3.wheelTouch = function(channel, control, value, status, group){

	var deck = NumarkMixTrackPro3.groupToDeck(group);

	if(!value){

		NumarkMixTrackPro3.touch[deck-1]= false;

// 	paro el timer (si no existe da error mmmm) y arranco un nuevo timer.
// 	Si en 20 milisegundos no se mueve el plato, desactiva el scratch

		if (NumarkMixTrackPro3.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackPro3.scratchTimer[deck-1]);

		NumarkMixTrackPro3.scratchTimer[deck-1] = engine.beginTimer(20, "NumarkMixTrackPro3.jogWheelStopScratch(" + deck + ")", true);

	} else {

		// si esta en play y el modo scratch desactivado, al presionar el touch no hace nada
		if (!NumarkMixTrackPro3.scratchMode[deck-1] && engine.getValue(group, "play")) return;

		if (NumarkMixTrackPro3.scratchTimer[deck-1] != -1) engine.stopTimer(NumarkMixTrackPro3.scratchTimer[deck-1]);

		// change the 600 value for sensibility
		engine.scratchEnable(deck, 600, 33+1/3, 1.0/8, (1.0/8)/32);

		NumarkMixTrackPro3.touch[deck-1]= true;
	}
}

NumarkMixTrackPro3.toggleDirectoryMode = function(channel, control, value, status, group) {
	// Toggle setting and light
	if (value) {
		NumarkMixTrackPro3.directoryMode = !NumarkMixTrackPro3.directoryMode;

		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[0]["directory"], NumarkMixTrackPro3.directoryMode);
		NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[0]["file"], !NumarkMixTrackPro3.directoryMode);
	}
}

NumarkMixTrackPro3.toggleScratchMode = function(channel, control, value, status, group) {
	if (!value) return;

	var deck = NumarkMixTrackPro3.groupToDeck(group);
	// Toggle setting and light
	NumarkMixTrackPro3.scratchMode[deck-1] = !NumarkMixTrackPro3.scratchMode[deck-1];
	NumarkMixTrackPro3.setLED(deck,NumarkMixTrackPro3.leds[deck]["scratchMode"], NumarkMixTrackPro3.scratchMode[deck-1] ? 0x10 : 0x00);
}


NumarkMixTrackPro3.onHotCueChange = function(value, group, key){
	var deck = NumarkMixTrackPro3.groupToDeck(group);
	var hotCueNum = key[7];
	NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["hotCue" + hotCueNum], value ? true : false); //TODO: fix setLED
}

NumarkMixTrackPro3.changeHotCue = function(channel, control, value, status, group){

	var deck = NumarkMixTrackPro3.groupToDeck(group);
	var hotCue = NumarkMixTrackPro3.hotCue[control];

	// onHotCueChange called automatically
	if(NumarkMixTrackPro3.deleteKey[deck-1]){
		if (engine.getValue(group, "hotcue_" + hotCue + "_enabled")){
			engine.setValue(group, "hotcue_" + hotCue + "_clear", 1);
		}
		NumarkMixTrackPro3.toggleDeleteKey(channel, control, value, status, group);
	} else {
		if (value) {
			engine.setValue(group, "hotcue_" + hotCue + "_activate", 1);

		}else{

			engine.setValue(group, "hotcue_" + hotCue + "_activate", 0);
		}
	}
}


NumarkMixTrackPro3.toggleDeleteKey = function(channel, control, value, status, group){
	if (!value) return;

	var deck = NumarkMixTrackPro3.groupToDeck(group);
	NumarkMixTrackPro3.deleteKey[deck-1] = !NumarkMixTrackPro3.deleteKey[deck-1];
	NumarkMixTrackPro3.setLED(NumarkMixTrackPro3.leds[deck]["deleteKey"], NumarkMixTrackPro3.deleteKey[deck-1]);
}

// Own code entirely from here

// filterCutoff: do lp for low values, hp for high.
// Assumes Unit[deck]slot2 is a filter with lp q hp as params
NumarkMixTrackPro3.filterCutoff = function(channel, control, value, status, group){

	var deck = NumarkMixTrackPro3.groupToDeck(group);

    var effectUnit = deck == 1 ? "[EffectRack1_EffectUnit1_Effect2]" : "[EffectRack1_EffectUnit2_Effect2]";

    if(value < 64) {
        engine.setValue(effectUnit, "parameter1", script.absoluteNonLin(value,0.0003,0.04,0.5,0,63));
    }
    if(value == 64) {
        engine.setValue(effectUnit, "parameter1", 0.5);
        engine.setValue(effectUnit, "parameter3", 0.0003);
    }
    if(value > 64) {
        engine.setValue(effectUnit, "parameter3", script.absoluteNonLin(value - 64,0.0003,0.04,0.5,0,63));
    }
}

NumarkMixTrackPro3.toggleShiftKey = function(channel, control, value, status, group){
	//if (!value) return; //don't return, want to toggle on note off

	var deck = NumarkMixTrackPro3.groupToDeck(group);
	NumarkMixTrackPro3.shiftKey[deck-1] = !NumarkMixTrackPro3.shiftKey[deck-1];
    print("shift toggled, now " + NumarkMixTrackPro3.shiftKey[deck - 1]);
}

NumarkMixTrackPro3.touchStrip = function(channel, control, value, status, group){ //Unnecessary, strip sends different cc when shifted
    var deck = NumarkMixTrackPro3.groupToDeck(group);

    if(NumarkMixTrackPro3.shiftKey[deck - 1]) {
        engine.setValue(group, "playposition", value / 100);
    } else {
        if(deck == 1) {
            engine.setValue("[EffectRack1_EffectUnit1]", "super1", value/100);
        }
        if(deck == 2) {
            engine.setValue("[EffectRack1_EffectUnit2]", "super1", value/100);
        }
    }
}

NumarkMixTrackPro3.meters = function(value, group, control) {
    var leftClip = false;
    var rightClip = false;

    var leftPfl = engine.getValue("[Channel1]","pfl");
    var rightPfl = engine.getValue("[Channel2]","pfl");

    if(group == "[Master]")
        if(value) {
            leftClip = true;
            rightClip = true;
        }
    if(group == "[Channel1]" && leftPfl)
        if(value) {
            leftClip = true;
        }
    if(group == "[Channel2]" && rightPfl)
        if(value) {
            rightClip = true;
        }

    var leftLevel = leftPfl ? engine.getValue("[Channel1]","VuMeter") : engine.getValue("[Master]","VuMeterL");
    var rightLevel = rightPfl ? engine.getValue("[Channel2]","VuMeter") : engine.getValue("[Master]","VuMeterR");

    NumarkMixTrackPro3.setLED(0, NumarkMixTrackPro3.leds[0]["meter1"],
            leftLevel ? 81 : leftLevel * 80); //TODO: calibrate 81/80
    NumarkMixTrackPro3.setLED(0, NumarkMixTrackPro3.leds[0]["meter2"],
            rightLevel ? 81 : rightLevel * 80); //TODO: calibrate 81/80
}
