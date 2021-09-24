(function () {
	'use strict';

	let rxFrequency;
	let socket;
	/*
		WebSocket.readyState:
		0 ... connecting
		1 ... open
		2 ... closing
		3 ... closed
	*/

	function connect() {
		try {
			const host = location.host.length > 0 ? location.host : "localhost";
			socket = new WebSocket("ws://" + host + ":82");
			debugLog('Socket Status: ' + socket.readyState);
			socket.onopen = onWebsocketOpen;
			socket.onmessage = onMessageReceived;
			socket.onclose = onWebsocketClose;

		} catch (exception) {
			alert('Error' + exception);
		}
	}
	
	function getMessageArguments(message, index) {
		return message.arguments === undefined ? "" : message.arguments[index];
	}
	
	function onMessageReceived(message) {
		//debugLog(message.data);
		let data = JSON.parse(message.data);
		if (data === null || data.name === undefined) {
			return;
		}
		
		if (data.name === "squelchStatus") {
			setBadgeStatus("squelchStatus", getMessageArguments(data, 0));
		} else if (data.name === "txStatus") {
			setBadgeStatus("txStatus", getMessageArguments(data, 0))
		} else if (data.name === "ovfStatus") {
			setBadgeStatus("overflowStatus", getMessageArguments(data, 0));
		} else if (data.name === "sMeter") {
			setSignalStrength(getMessageArguments(data, 0), getMessageArguments(data, 1));
		} else if (data.name === "rxFreq") {
			rxFrequency = parseInt(getMessageArguments(data, 0));
			$("#rxFreq").text(rxFrequency.toLocaleString("de-AT"));
		} else if (data.name === "txFreq") {
			$("#txFreq").text(getMessageArguments(data, 0).toLocaleString("de-AT"));
		} else if (data.name === "error") {
			$("#errorModalBody").text(getMessageArguments(data, 0));
			errorModal.show();
		}
	}
	
	function onWebsocketOpen() {
		debugLog('Socket Status: ' + socket.readyState + ' (open)');
		connectModal.hide();
	}
	
	function onWebsocketClose() {
		debugLog('Socket Status: ' + socket.readyState + ' (closed)');
		connectModal._isShown ? connect() : connectModal.show();
	}
	
	function createCommand(commandName, commandArguments) {
		return { command : commandName, arguments : commandArguments };
	}
	
	function sendCommand(commandObject) {
		sendMessage(JSON.stringify(commandObject));
	}
	
	function sendMessage(message) {
		if (socket === undefined || socket === null || socket.readyState !== 1) {
			return;
		}
		socket.send(message);
	}

	function debugLog(message) {
		console.log(message);
	}	
	
	function setBadgeStatus(badgeId, status) {
		const inactiveClass = "bg-secondary";
		let qBadge = $("#" + badgeId);
		let activeStyle = qBadge.attr("data-active-style");
		
		if (status === true) {
			qBadge.removeClass(inactiveClass);
			qBadge.addClass(activeStyle);
		} else if (status === false) {
			qBadge.addClass(inactiveClass);
			qBadge.removeClass(activeStyle);
		}
	}
	
	function byteToPercent(byteValue) {
		return Math.round(byteValue * 100 / 255);
	}
	
	function setSignalStrength(value, text) {
		let intValue = parseInt(value);
		let qSignalStrength = $("#signalStrength");
		let percent = byteToPercent(intValue).toString();
		
		qSignalStrength.attr("class", "progress-bar");
		qSignalStrength.attr("aria-valuenow", percent);
		qSignalStrength.attr("style", "width: " + percent + "%");
		qSignalStrength.text(text);
		
		if (text === "S9+") {
			qSignalStrength.addClass("bg-danger");
		}
		else {
			qSignalStrength.addClass("bg-success");
		}
	}
	
	let connectModal = new bootstrap.Modal($("#websocketConnectModal"));
	$("#websocketConnectModal").on("shown.bs.modal", function() {
		connect();
	});
	connectModal.show();
	
	let errorModal = new bootstrap.Modal($("#errorModal"));
	
	let oldVfoWheelValue = 0.0;
	let vfoStepSize = parseInt($("#vfoStepSize option:selected").val());
	
	$("#vfoWheelknob").on("input", function(e){
		if (e.target.value > oldVfoWheelValue) {
			rxFrequency += vfoStepSize;
		} else if (e.target.value < oldVfoWheelValue) {
			rxFrequency -= vfoStepSize;
		}
		console.log(rxFrequency);
		if (e.target.value != oldVfoWheelValue) {
			sendCommand(createCommand("setRxFreq", { value: rxFrequency }));
			oldVfoWheelValue = e.target.value;
		}
	});
	
	$("#vfoStepSize").on("change", function(e){
		vfoStepSize = parseInt($("#vfoStepSize option:selected").val());
	});
}());