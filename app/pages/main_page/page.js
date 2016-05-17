import {Page, NavController, Toast, Events, Platform} from 'ionic-angular';
import {BackgroundGeolocation, Geolocation} from 'ionic-native';
import {Dialogs} from 'ionic-native';

let PERMISSION_DENIED = 1;
let POSITION_UNAVAILABLE = 2;
let TIMEOUT = 3;

@Page({
  templateUrl: 'build/pages/main_page/page.html'
})
export class MainPage {
  static get parameters() {
    return [[NavController], [Events], [Platform]];
  }
  constructor(nav, events, platform) {
    this.map = null;
    this.nav = nav;
    this.events = events;
    this.options = {
      timeout: 10000,
      enableHighAccuracy: true,
      maximumAge: 30000
    }

    this.is_not_android = !platform.is('android');

    this.location = undefined;
    this.path = undefined;
    this.locations = [];
    this.isTracking = false;
    this.postingEnabled = false;
    this.online = false;

    this.toggle = {
      text: "Start",
      isStarted: false,
      color: 'secondary'
    }

    this.pace = {
      text: "Aggressive",
      isAgressive: false,
      color: 'secondary'
    }

    this.bindEvents();

  }

  bindEvents() {

    this.events.subscribe('bgeo_callback:location',
      (location) => {
        try {
          this.setCurrentLocation(location);
        } catch (e) {
          console.error('!!!DEMO : ERROR: setting location', e.message);
        }
      }
    );
  }


  showToast(msg) {
    let toast = Toast.create({
      message: msg,
      duration: 2000
    });
    this.nav.present(toast);
  }

  onPageLoaded() {
    console.log("!!!DEMO : On Page Loaded");

    let myLatlng = new google.maps.LatLng(43.07493,-89.381388);
    let mapOptions = {
      center: myLatlng,
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    let map = new google.maps.Map(document.getElementById("map"),
        mapOptions);

    this.map = map;

  }

  onClickToogleEnabled() {
    if (!this.toggle.isStarted) {
      this.toggle.text = "Stop";
      this.toggle.color = 'danger';
      this.startTracking();
    } else {
      this.toggle.text = "Start";
      this.toggle.color = 'secondary';
      this.stopTracking();
    }
    this.toggle.isStarted = !this.toggle.isStarted;
  }

  onClickChangePace() {
    console.log("!!!DEMO : onClickChangePace");
    if (!this.pace.isAgressive) {
      this.pace.color = 'danger';
      BackgroundGeolocation.changePace(true);
    } else {
      this.pace.color = 'secondary';
      BackgroundGeolocation.changePace(false);
    }
    this.pace.isAgressive = !this.pace.isAgressive;
  }

  startTracking() {
    console.log("!!!DEMO : Start tracking");
    BackgroundGeolocation.start();
    this.isTracking = true;
    BackgroundGeolocation.isLocationEnabled().then(
      this.onLocationCheck
    );
  }

  stopTracking() {
    console.log("!!!DEMO : Stop tracking");
    BackgroundGeolocation.stop();
    this.isTracking = false;
  }

  onLocationCheck(enabled) {
    console.log("!!!DEMO : onLocationCheck : enabled="+enabled);
    if (!enabled) {
      console.log("!!!DEMO : Execute a dialog");
      Dialogs.confirm("No location provider enabled. Should I open location setting?")
        .then(
          (number) => {
            // number == 1 <=> OK
            // number == 2 <=> Cancel
            BackgroundGeolocation.showLocationSettings();
          })
        .catch(
          (error) => {
            console.log("!!!DEMO : Failed to execute the dialog");
          });
    }
  }


  onClickHome() {
    console.log("!!!DEMO : onClickHome");
    Geolocation.getCurrentPosition(this.options)
      .then((resp) => {
        console.log("!!!DEMO : Geolocation : " + resp.coords.latitude + ", " + resp.coords.longitude);
        // center on the location
        this.map.setCenter({lat: resp.coords.latitude, lng: resp.coords.longitude});
        this.showToast("Your location is : "+ resp.coords.longitude + ", " + resp.coords.latitude);
        this.setCurrentLocation(resp.coords);
      })
      .catch((error) => {
        console.log("!!!DEMO : Failed to get Geolocation, errors :" + error);
        if (error.code == PERMISSION_DENIED) {
          console.log("!!!DEMO : On permission denied -> REPORT TO DEV");
          this.showToast("On permission denied -> REPORT TO DEV");
        } else if ( error.code == POSITION_UNAVAILABLE ) {
          console.log("!!!DEMO : On position unavailable -> switch on location, activate gps, wifi network");
          this.showToast("On position unavailable -> switch on location, activate gps, wifi network");
        } else if ( error.code == TIMEOUT ) {
          console.log("!!!DEMO : On timeout -> switch on location, activate gps, wifi network -> wait");
          this.showToast("On timeout -> switch on location, activate gps, wifi network -> wait");
        }
      });
  }

  onClickReset() {
    console.log("!!!DEMO : onClickReset");
    // Clear prev location markers.
    let locations = this.locations;
    for (let n=0, len=locations.length;n<len;n++) {
      locations[n].setMap(null);
    }
    this.locations = [];

    // Clear Polyline.
    if (this.path) {
        this.path.setMap(null);
        this.path = null;
    }
  }

  setCurrentLocation(location) {
    console.log("!!!DEMO : setCurrentLocation, location=" + location);

    if (!this.location) {
      this.location = new google.maps.Marker({
                map: this.map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 3,
                    fillColor: 'blue',
                    strokeColor: 'blue',
                    strokeWeight: 5
                }
            });
      this.locationAccuracy = new google.maps.Circle({
          fillColor: '#3366cc',
          fillOpacity: 0.4,
          strokeOpacity: 0,
          map: this.map
      });
    }

    if (!this.path) {
      this.path = new google.maps.Polyline({
        map: this.map,
        strokeColor: '#3366cc',
        fillOpacity: 0.4
      });
    }

    let latlng = new google.maps.LatLng(Number(location.latitude), Number(location.longitude));

    if (this.previousLocation) {
        let prevLocation = this.previousLocation;
        // Drop a breadcrumb of where we've been.
        this.locations.push(new google.maps.Marker({
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 3,
                fillColor: 'green',
                strokeColor: 'green',
                strokeWeight: 5
            },
            map: this.map,
            position: new google.maps.LatLng(prevLocation.latitude, prevLocation.longitude)
        }));
    } else {
        this.map.setCenter(latlng);
        if (this.map.getZoom() < 15) {
            this.map.setZoom(15);
        }
    }

    // Update our current position marker and accuracy bubble.
    this.location.setPosition(latlng);
    this.locationAccuracy.setCenter(latlng);
    this.locationAccuracy.setRadius(location.accuracy);

    // Add breadcrumb to current Polyline path.
    this.path.getPath().push(latlng);
    this.previousLocation = location;
  }

  onGetLocations() {

    BackgroundGeolocation.getLocations()
      .then(
        (res) => {
          console.log("On Get Locations : " + res);

        }
      )
      .catch(
        (err) => {
          console.error("On Get Locations : error = " + error);
        }
      );
  }




}
