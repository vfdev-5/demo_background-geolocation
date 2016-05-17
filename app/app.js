import {App, Platform, Events} from 'ionic-angular';
import {StatusBar, BackgroundGeolocation} from 'ionic-native';
import {MainPage} from './pages/main_page/page';

@App({
  template: '<ion-nav [root]="rootPage"></ion-nav>',
  config: {} // http://ionicframework.com/docs/v2/api/config/Config/
})
export class MyApp {
  static get parameters() {
    return [[Platform], [Events]];
  }

  constructor(platform, events) {
    this.rootPage = MainPage;
    this.events = events;
    this.is_ios = platform.is('ios');
    platform.ready().then(() => {this.onDeviceReady();});
  }

  onDeviceReady() {
    // Okay, so the platform is ready and our plugins are available.
    // Here you can do any higher level native things you might need.
    StatusBar.styleDefault();

    console.log("BackgroundGeolocation : " + BackgroundGeolocation);

    let config = {
      desiredAccuracy: 10,
      stationaryRadius: 50,
      distanceFilter: 50,
      locationTimeout: 30,
      notificationIcon: 'mappointer',
      notificationIconColor: '#FEDD1E',
      notificationTitle: 'Background tracking', // <-- android only, customize the title of the notification
      notificationText: 'ENV.settings.locationService', // <-- android only, customize the text of the notification
      activityType: 'AutomotiveNavigation',
      debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
      stopOnTerminate: false, // <-- enable this to clear background location settings when the app terminates
      locationService: 0, // ANDROID_DISTANCE_FILTER
      fastestInterval: 5000,
      activitiesInterval: 10000
    };

    console.log("onDeviceReady : this=" + this);

    BackgroundGeolocation.configure(config)
     .then((location) => {this.onBGeoCallback(location);})
     .catch((err)=>{this.onBGeoError(err);});
  }


  onBGeoCallback(location) {
    console.log('!!!DEMO : BackgroundGeolocation callback:  ' + location.latitude + ',' + location.longitude);
    this.events.publish('bgeo_callback:location', location);
    // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
    // and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
    // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
    if (this.is_ios) {
      BackgroundGeolocation.finish();
    }
  }

  onBGeoError(error) {
    console.error('!!!DEMO : BackgroundGeolocation error: ' + error);
  }

}
