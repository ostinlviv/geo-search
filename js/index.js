function initAutocomplete() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 50.450613, lng: 30.523227},
        zoom: 13,
        mapTypeId: 'roadmap'
    });

    map.addListener('click', function(e) {
        placeMarkerAndPanTo(e.latLng, map);
    });
    var marker;
    function placeMarkerAndPanTo(latLng, map) {
        if ( marker ) {
            marker.setPosition(latLng);
        } else {
            marker = new google.maps.Marker({
                position: latLng,
                map: map
            });
        }
        $("#location").val(location);
        map.panTo(latLng);
        google.maps.event.addListener(marker, "click", function (event) {
            var latitude = event.latLng.lat();
            var longitude = event.latLng.lng();
            console.log( latitude + ', ' + longitude );

        });
    }

    // Create a div to hold everything else
    var controlDiv = document.createElement('DIV');
    controlDiv.id = "controls";

    // Create an input field
    var dateFrom = document.createElement('input');
    dateFrom.id = "dateFrom";
    dateFrom.name = "dateFrom";
    dateFrom.type = "date";

    var dateTo = document.createElement('input');
    dateTo.id = "dateTo";
    dateTo.name = "dateTo";
    dateTo.type = "date";

    var radius = document.createElement('input');
    radius.id = "radius";
    radius.name = "radius";
    radius.type = "number";
    radius.value = 100;

    // Create a label
    var controlLabeldateFrom = document.createElement('label');
    controlLabeldateFrom.innerHTML = 'від';
    controlLabeldateFrom.setAttribute("for","dateFrom");

    var controlLabeldateTo = document.createElement('label');
    controlLabeldateTo.innerHTML = 'до';
    controlLabeldateTo.setAttribute("for","dateTo");

    var controlLabelRadius = document.createElement('label');
    controlLabelRadius.innerHTML = 'радіус пошуку в метрах';
    controlLabelRadius.setAttribute("for","radius");

    // Create a button to send the information
    var controlButton = document.createElement('a');
    controlButton.innerHTML = 'Пошук фото';
    controlButton.className = 'btn';

    // Append everything to the wrapper div
    controlDiv.appendChild(controlLabeldateFrom);
    controlDiv.appendChild(dateFrom);
    controlDiv.appendChild(controlLabeldateTo);
    controlDiv.appendChild(dateTo);
    controlDiv.appendChild(document.createElement("br"));
    controlDiv.appendChild(controlLabelRadius);
    controlDiv.appendChild(radius);
    controlDiv.appendChild(controlButton);

    var onClick = function() {

        var dateFromValue = ((new Date($("#dateFrom").val())).getTime())/1000;
        var dateToValue = ((new Date($("#dateTo").val())).getTime())/1000;
        var radiusValue = $("#radius").val();
        var mylat = map.getCenter().lat();
        var mylng = map.getCenter().lng();
        var vkObj = {lat: mylat, long: mylng, count: 100, radius: radiusValue, start_time: dateFromValue, end_time: dateToValue, v: 5.78};
        getPhotos(vkObj);
    };
    google.maps.event.addDomListener(controlButton, 'click', onClick);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);

    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    var markers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        // Clear out the old markers.
        markers.forEach(function(marker) {
            marker.setMap(null);
        });
        markers = [];

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }
            var icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
            };

            // Create a marker for each place.
            markers.push(new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location
            }));

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });
}
function getUrl(method, params) {
    if (!method) throw new Error('Ви не вказали метод!');
    params = params || {};
    params['access_token'] = 'ACCESS_TOKEN';
    return 'https://api.vk.com/method/' + method + '?' + $.param(params);
}

function sendRequest(method, params, func) {
    $.ajax({
        url: getUrl(method, params),
        method: 'GET',
        dataType: 'JSONP',
        success: func
    });
}

function getPhotos(object) {
    sendRequest('photos.search', object, function (data) {
        drawPhotos(data.response);
    });
}

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = ('0' + date).slice(-2) + ' ' + month + ' ' + year + ' ' + ('0' +  hour).slice(-2) + ':' + ('0' + min).slice(-2) + ':' + ('0' + sec).slice(-2);
    return time;
}

function getUser (id) {
    var userId;
    if (id < 0) {
        id *= -1;
        userId = 'https://vk.com/club' + id;
    } else {
        userId = 'https://vk.com/id' + id;
    }
    return userId;
}

function drawPhotos(photos) {
    document.querySelector('#map').style.display = 'none';
    var body = document.querySelector('body');
    var div = document.createElement('div');
    var back = document.createElement('a');
    back.className = 'btn back';
    back.innerHTML = 'Повернутися до пошуку';
    div.id = 'result';

    var ul = document.createElement('ul');
    div.appendChild(ul);
    div.appendChild(back);
    body.appendChild(div);


    back.addEventListener('click', function() {
        document.querySelector('#map').style.display = 'block';
        document.querySelector('#result').remove();
    });
    console.log(photos);
    console.log(photos.items[0].date);
    for (var i = 0; i < photos.count; i++) {

        ul.innerHTML +=
        '<li class="li">'
        +'<img src="'+photos.items[i].sizes[4].url+'" class="img" />'
        +'<div class="data">'
        +'<p><b>Координати:</b> ' + photos.items[i].lat + ', ' + photos.items[i].long + '</p>'
        +'<p><b>Власник:</b> <a href="' + getUser (photos.items[i].owner_id) + '" target="_blank">' + getUser (photos.items[i].owner_id) + '</a></p>'
        +'<p><b>Дата:</b> ' + timeConverter(photos.items[i].date)  + '</p>'
        +'</div>'
        +'</li>';
    }
}