(() => {
	const mapElement = document.querySelector(".map");
	if (!mapElement) return;

	const apiKey = "AIzaSyD2iysmi5G6GtjbNtmjZoFGYocOR3f-_CE";
	const location = { lat: 51.5203121847596, lng: -0.07874600846277312 };
	const pinUrl = "https://cdn.prod.website-files.com/6a68dfaeda21c862740b9dd3/6a7c90d35d74f26a5cefe5e1_exclusive-pin.svg";

	function initializeMap() {
		const map = new google.maps.Map(mapElement, {
			center: location,
			zoom: 13,
			disableDefaultUI: true,
			zoomControl: true,
			mapTypeControl: false,
			streetViewControl: false,
			fullscreenControl: false,
			styles: [
				{
					elementType: "all",
					stylers: [{ saturation: -100 }],
				},
			],
		});

		new google.maps.Marker({
			map,
			position: location,
			icon: {
				url: pinUrl,
				scaledSize: new google.maps.Size(84, 84),
			},
		});

		const directionsLink = document.createElement("a");
		directionsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
		directionsLink.target = "_blank";
		directionsLink.rel = "noopener noreferrer";
		directionsLink.textContent = "Get directions";
		directionsLink.style.cssText = [
			"display:block",
			"margin:10px",
			"padding:10px 14px",
			"background:#fff",
			"color:#000",
			"font:600 14px/1 sans-serif",
			"text-decoration:none",
			"box-shadow:0 1px 4px rgba(0,0,0,.3)",
		].join(";");

		map.controls[google.maps.ControlPosition.TOP_RIGHT].push(directionsLink);
	}

	function loadGoogleMaps() {
		if (window.google?.maps) {
			initializeMap();
			return;
		}

		window.initializeExclusiveMap = initializeMap;
		const script = document.createElement("script");
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initializeExclusiveMap`;
		script.async = true;
		script.defer = true;
		script.onerror = () => console.error("Google Maps failed to load.");
		document.head.appendChild(script);
	}

	loadGoogleMaps();
})();
