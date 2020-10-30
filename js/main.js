var currMusicId;
var currentTree;

var userLat;
var userLon;

var userLayer;
var userMarker;

var treeLayer;
var treeMarker;

var parkOutlinelayer;
var parkOutlineMarker;

var GPS_OPTIONS_HA = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};
var GPS_OPTIONS_LA = {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 60000
};

var dist;

// Basic map configuration.
var map = new maptalks.Map('Map', {
    center: maptalksConfig.centerCoords,
    zoom: 17,
    // minZoom: 16, // set map's min zoom to 14
    maxZoom: 20,
    pitch: 50,
    bearing: 25,
    centerCross: false,
    baseLayer: new maptalks.TileLayer('base', {
        urlTemplate: maptalksConfig.urlTemplate,
        subdomains: maptalksConfig.subdomains,
        attribution: maptalksConfig.attribution
    })
});

// parkOutlinelayer = new maptalks.VectorLayer('ParkOutlineLayer', { enableAltitude: true }).addTo(map);
treeLayer = new maptalks.VectorLayer('TreeLayer').addTo(map);
userLayer = new maptalks.VectorLayer('UserLayer').addTo(map);

// var parkOutlineMarker = new maptalks.Polygon(
//     [maptalksConfig.parkOutlineCoords], {
//         visible: true,
//         shadowBlur: 50,
//         shadowColor: 'black',
//         symbol: {
//             'lineColor': '#CC297B',
//             'lineWidth': 1,
//             'polygonFill': 'transparent',
//             'polygonOpacity': 1
//         },
//         properties: {
//             altitude: 0
//         }
//     });

// parkOutlineMarker.animate({
//     symbol: {
//         'lineWidth': 5
//     },
//     properties: {
//         altitude: 5
//     }
// }, {
//     repeat: true
// });

// parkOutlineMarker.addTo(parkOutlinelayer);

//Traversing each tree and rendering a marker for each tree
treeConfig.forEach((tree) => {
    treeMarker = new maptalks.Marker(
        tree.coords, {
            'symbol': {
                'markerFile': 'images/tree-icon.svg',
                'markerWidth': 55,
                'markerHeight': 75,
                'markerDx': 0,
                'markerDy': 0,
                'markerOpacity': 1
            }
        }
    ).addTo(treeLayer);

    // Listener to change the play icon when the music ends 
    document.getElementById(tree.musicId).addEventListener('ended', () => {
        document.getElementById('play-pause-icon').src = 'images/play-icon.svg';
    });
});

// Checking for user's location.
if (navigator.geolocation) {
    // To get the user's position in high accuracy mode
    navigator.geolocation.getCurrentPosition(checkIfUserIsNearThePark, error, GPS_OPTIONS_HA);
} else {
    alert("Location is not enabled. Please enalble location in your device and refresh the page.")
}

// To check whether the user is near the park and show the map or No Access message accordingly
function checkIfUserIsNearThePark(position) {
    userLat = position.coords.latitude;
    userLon = position.coords.longitude;
    dist = map.computeLength([userLon, userLat], maptalksConfig.centerCoords);
    if (dist <= maptalksConfig.maxDistanceFromPark) {
        document.getElementById("NoAccessLayer").style.display = 'none';
        document.getElementById("AccessLayer").style.display = 'contents';
        document.getElementById("Map").style.display = 'block';
        navigator.geolocation.watchPosition(updatePosition, error);
    } else {
        navigator.geolocation.getCurrentPosition(checkIfUserIsNearThePark, error, GPS_OPTIONS_HA);
        document.getElementById("AccessLayer").style.display = 'none';
        document.getElementById("NoAccessLayer").style.display = 'flex';
        document.getElementById("Map").style.display = 'none';
    }
}

// Common error handler for handling errors during fetching user's position
function error(err) {
    if (error.code == error.TIMEOUT) {
        // To get the user's position with low accuracy if high accuracy fails
        navigator.geolocation.getCurrentPosition(checkIfUserIsNearThePark, error_lowAccuracy, GPS_OPTIONS_LA);
    }
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

// Error handler for logging the error code recieved in low accuracy mode 
function error_lowAccuracy(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

function updatePosition(position) {
    userLat = position.coords.latitude;
    userLon = position.coords.longitude;

    // Marker to denote the user's position.
    userMarker = new maptalks.Marker(
        [userLon, userLat], {
            'id': 'UserMarker',
            'symbol': {
                'markerFile': 'images/human-icon.svg',
                'markerWidth': 30,
                'markerHeight': 60,
                'markerDx': 0,
                'markerDy': 0,
                'markerOpacity': 1
            }
        }
    );
    if (userLayer.getGeometryById('UserMarker') != null) {
        userLayer.removeGeometry('UserMarker');
    }
    userMarker.addTo(userLayer);

    // To check if the user is near any tree
    treeConfig.forEach((tree) => {
        checkIfUserIsNearTheTree([userLon, userLat], tree);
    });

    // To check if any music play back is allowed. if true play button is displayed, else play button stays hidden.
    if (treeConfig.filter(tree => tree.allowMusicPlayBack == true).length > 0) {
        document.getElementById('play_pause').style.display = 'block';
        document.getElementById('MusicTitleText').innerHTML = currentTree.musicTitle;
        document.getElementById('MusicTitle').style.display = 'flex';
    } else {
        document.getElementById('play_pause').style.display = 'none';
        document.getElementById('MusicTitleText').innerHTML = '';
        document.getElementById('MusicTitle').style.display = 'none';
    }
}

// To check if the user is near any tree. if yes then allow music playback for the particular tree.
function checkIfUserIsNearTheTree(userCoords, tree) {
    var userTreeDist = map.computeLength(userCoords, tree.coords);
    if (userTreeDist <= tree.musicPlaybackRadius) {
        tree.allowMusicPlayBack = true;
        currentTree = tree;
    } else {
        if (!document.getElementById(tree.musicId).paused) {
            document.getElementById(tree.musicId).pause();
            document.getElementById(tree.musicId).currentTime = 0;
        }
        tree.allowMusicPlayBack = false;
    }
}

// To play the music.
function playRegionMusic() {
    if (currentTree != undefined) {
        var audio = document.getElementById(currentTree.musicId);
        if (document.getElementById(currentTree.musicId).paused) {
            document.getElementById(currentTree.musicId).play();
        } else {
            document.getElementById(currentTree.musicId).pause();
        }
    }
}

// To maximize and minimize the screen.
function maximizeWindow() {
    var elem = document.getElementsByTagName("body")[0];
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
        document.getElementById('fullscreen-icon').src = 'images/minimize-icon.svg';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
        document.getElementById('fullscreen-icon').src = 'images/maximize-icon.svg';
    }
}

// Event listener for when the user enters or exits the fullscreen without clicking the button.
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        document.getElementById('fullscreen-icon').src = 'images/minimize-icon.svg';
    } else {
        document.getElementById('fullscreen-icon').src = 'images/maximize-icon.svg';
    }
});

// To re-center the map to user's position.
function recenter() {
    map.animateTo({
        center: [userLon, userLat],
        zoom: 20,
        pitch: 60,
        bearing: 25
    }, {
        duration: 1500
    });
}