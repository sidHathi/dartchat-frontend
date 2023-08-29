/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { setBackgroundNotifications, setBackgroundHandler } from './firebase/pushNotifications';

AppRegistry.registerComponent(appName, () => App);

setBackgroundNotifications();
setBackgroundHandler();
