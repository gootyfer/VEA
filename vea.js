var v = {};
var eventIndex = 0;
var currentEvents = [];
//TODO: params need a label!
var config = {
	    "types" : [

	               {
	                   "type": "internet-search",
	                   "label": "Busqueda en internet",
	                   "params": [ "searchEngine", "query", "url" ]
	               },

	               {
	                   "type": "create-prezi-element",
	                   "label": "Crear nuevo elemento en prezi",
	                   "params": [ "type", "value" ]
	               }

	           ]
	       };

//Initialize values: init current time, saved events, init keyboard events
function init(){
	v = document.getElementById("video");

	//Init current time
	var savedTime = window.localStorage.getItem("savedTime");
	if(savedTime){
		v.currentTime = savedTime;
	}
	//Init events in #eventSection
	var stringEvent;
	while(stringEvent = window.localStorage.getItem("event"+(eventIndex))){
		currentEvents[eventIndex] = eval("("+stringEvent+")");
		showHTMLEvent(currentEvents[eventIndex]);
		eventIndex++;
	}
	
	//Listen keyboard events: space(start/stop), (F)inalize, (N)ew Event, (S)ave Current Time
	//TODO: bug when writing title because of keyboard events; listen events when title written and pushed a button
	//TODO: same bug when writting params; use ctrl + key for events?
	window.addEventListener("keydown", keydown, false);
}

function keydown(ev){
	//alert("keydown: "+ev.keyCode);
	switch(ev.keyCode){
	case 32: //space (start/stop)
		if(v.paused){
			v.play();
		}else{
			//Save current time on every pause event
			saveCurrentTime();
			v.pause();
		}
		break;
	case 70: //f Finalize
		finalizeEvent();
		break;
	case 78: //n New
		newEvent();
		break;
	case 83: //s Save
		saveCurrentTime();
		break;
	}
}

//Save current time to local storage
function saveCurrentTime(){
	window.localStorage.setItem("savedTime", v.currentTime);
	//alert("Saved");
}

//Creates a new event in the current time
function newEvent(){
	//alert("New");
	//Save to memory
	currentEvents[eventIndex] = showHTMLEvent();
	document.getElementById("type"+eventIndex).focus();
	eventIndex++;
	//Create new event div, append it to #eventSection, time=v.currentTime, focusToSelectType
}

//Generates the HTML for a event OR creates a new one
//@return JSON event
function showHTMLEvent(savedEvent){
	var event = document.createElement("div");
	event.className = "event";
	
	var seq = document.createElement("span");
	seq.className = "seq";
	seq.innerHTML = savedEvent?savedEvent.id:eventIndex;
	
	var initTime = document.createElement("span");
	initTime.className = "initTime";
	initTime.innerHTML = savedEvent?savedEvent.start:getCurrentTime();
	
	var eventType = document.createElement("span");
	eventType.className = "eventType";
	//TODO: bug when changing option after saving endTime -> onchange: save to storage
	//TODO: same with params
	var combo = document.createElement("select");
	combo.id = "type"+(savedEvent?savedEvent.id:eventIndex);
	combo.onchange = function(){loadParams(this)};
	
	var option = document.createElement("option");
	option.value = "";
	option.innerHTML = "-- Select Event Type --";
	combo.appendChild(option);
	
	//Load combo from config
	for(var i=0; i<config.types.length;i++){
		option = document.createElement("option");
		option.value = config.types[i].type;
		if(savedEvent && savedEvent.type == config.types[i].type){
			option.selected = "selected";
		}
		option.innerHTML = config.types[i].label;
		combo.appendChild(option);
	}
	eventType.appendChild(combo);
	
	var endTime = document.createElement("span");
	endTime.className = "endTime";
	endTime.id = "endTime"+(savedEvent?savedEvent.id:eventIndex);
	if(savedEvent){
		endTime.innerHTML = savedEvent.end;
	}else{
		endTime.innerHTML = "<input type='button' value='(F)inalize event' onclick='finalizeEvent("+eventIndex+")' />";
	}
	
	event.appendChild(seq);
	event.appendChild(initTime);
	event.appendChild(eventType);
	event.appendChild(endTime);
	
	var events = document.getElementById("eventSection");
	events.appendChild(event);
	
	//Load params
	if(savedEvent){
		loadParams(combo, savedEvent.params[0]);
	}
	
	return {
		"id" : seq.innerHTML,
		"type" : "",
		"start" : initTime.innerHTML,
		"end" : 0,
		"params" : []
	};
}

//Load params from config
function loadParams(combo, initParams){
	var eventType = combo.options[combo.selectedIndex].value;
	var params = [];
	for(var i=0; i<config.types.length;i++){
		if(eventType == config.types[i].type){
			params = config.types[i].params;
			break;
		}
	}
	
	//Remove previous params
	var prevParams = document.getElementById("params_"+combo.id);
	if(prevParams) combo.parentNode.removeChild(prevParams);
	
	var paramSpan = document.createElement("span");
	paramSpan.id = "params_"+combo.id;
	paramSpan.className = "params";
	
	combo.parentNode.appendChild(paramSpan);
	
	for(var i=0; i<params.length;i++){
		var label = document.createElement("label");
		label.innerHTML=params[i]+":";
		var input = document.createElement("input");
		input.name=params[i];
		if(initParams){
			input.value = initParams[input.name];
		}
		paramSpan.appendChild(label);
		paramSpan.appendChild(input);
	}
}

function loadConfig(newConfig){
	//TODO: Called in a script element using JSONP
	config = newConfig;
	//TODO: remove current events in local storage + memory?
}

function getCurrentTime(){
	//Format time
	var sec = v.currentTime;
	var secint = Math.floor(sec);
	var millis = Math.floor((sec-secint)*100);
	millis = (millis>9)?millis:"0"+millis;
	
	var min = Math.floor(secint/60);
	secint = secint % 60;
	secint = (secint>9)?secint:"0"+secint;
	
	var hr = Math.floor(min/60);
	min = min % 60;
	min = (min>9)?min:"0"+min;
	
	hr = (hr>9)?hr:"0"+hr;

	return hr+":"+min+":"+secint+"."+millis;
}

//Finalizes the current event and saves it to local storage
function finalizeEvent(numEvent){
	var eventToFinalize = numEvent?numEvent:(currentEvents.length-1);
	//alert("Finalize");
	var endTime = document.getElementById("endTime"+eventToFinalize);
	endTime.innerHTML = getCurrentTime();
	
	var selectedIndex = document.getElementById("type"+eventToFinalize).selectedIndex;
	currentEvents[eventToFinalize]["type"] = document.getElementById("type"+eventToFinalize).options[selectedIndex].value;
	currentEvents[eventToFinalize]["end"] = endTime.innerHTML;
	
	var spanParams = document.getElementById("params_type"+eventToFinalize);
	var inputs = spanParams.getElementsByTagName("input");
	var params = [{}];
	
	for(var i=0; i<inputs.length;i++){
		var name = inputs[i].name;
		params[0][name] = inputs[i].value; 
	}
	
	currentEvents[eventToFinalize]["params"] = params;
	
	//Save event to local storage
	window.localStorage.setItem("event"+eventToFinalize, JSON.stringify(currentEvents[eventToFinalize]));
	//time=v.currentTime, saveToLocalStorage
}

//Exports all the info to XML
function exportToXML(){
	var vea = {
			"vea":{
				"videoFile": v.src,
				"recordingTitle": document.getElementById("title").value,
				"timestamp": ""+(new Date()),
				"events" : currentEvents
			}
	};
	if(confirm("Remove all the current events?\n"+JSON.stringify(vea))){
		window.localStorage.removeItem("savedTime");
		for(var i=0;i<currentEvents.length;i++){
			window.localStorage.removeItem("event"+i);
		}
	}
}
