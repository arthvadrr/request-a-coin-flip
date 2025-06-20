import { renderRequestView } from './views/requestView.js';
import { renderFlipView } from './views/flipView.js';
import '../styles/main.scss';

const params = new URLSearchParams(window.location.search);
const flipId = params.get('flip');

const app = document.getElementById('app');

if (flipId) {
	renderFlipView(app, flipId);
} else {
	renderRequestView(app);
}
