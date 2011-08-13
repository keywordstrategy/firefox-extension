function cookiem(url, action) {
	var perm_manager = Components.classes["@mozilla.org/permissionmanager;1"].getService().QueryInterface(Components.interfaces.nsIPermissionManager);
	var domain = url.match(/https?:\/\/[^\/]+\//)[0];
	var uri = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(domain, null, null);
	action = action == 'disable'? perm_manager.DENY_ACTION : perm_manager.ALLOW_ACTION;
	perm_manager.add(uri, 'cookie', action);
}

function get_page(url, callback, headers) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if (request.readyState == 4) {
			callback(request.responseText);
		}
	};
	request.open("GET", url, true);
	if (headers){
		for (var header in headers)
		{
			request.setRequestHeader(header, headers[header]);
		}
	}
	cookiem(url, 'disable');
	request.send(null);
	cookiem(url, 'enable');
}

function request_handler(result, doc, url) {
	firePageEvent(doc, {result:result, url:url});
}

function firePageEvent(doc, attributes, event_name) {
	if (event_name === undefined) {
		event_name = 'keywordstrategy_page';
	}
	var element = doc.createElement("PageDataElement");
	for(var attr_name in attributes) {
		var attr_value = attributes[attr_name];
		if (typeof attr_value != 'string') {
			continue;
		}
		element.setAttribute(attr_name, attr_value);
	}
	doc.documentElement.appendChild(element);
	var event = doc.createEvent("Events");
	event.initEvent(event_name, true, false);
	element.dispatchEvent(event);
}


function extListener(e, doc) {
	var type = e.target.getAttribute("type");
	var headers = e.target.getAttribute('headers');
	if (headers) {
		headers = JSON.parse(headers);
	}
	if (type == 'request') {
		var url = e.target.getAttribute("url");
		get_page(url, function(r){request_handler(r, doc, url);}, headers);
	}
	e.target.parentNode.removeChild(e.target);
}

function on_page_load(event) {
 	if (event.originalTarget instanceof HTMLDocument && (event.originalTarget.location.href.indexOf("http://www.keywordstrategy.org/manage") === 0 || event.originalTarget.location.href.indexOf("https://www.keywordstrategy.org/manage") === 0)) {
		var doc=event.originalTarget;
		doc.body.setAttribute('keyword_extension', '1.3.6');
		doc.addEventListener("kewyrodstrategy_extenstion", function(e){extListener(e, doc);}, false, true);
	}
}
gBrowser.addEventListener("DOMContentLoaded",on_page_load,false);
