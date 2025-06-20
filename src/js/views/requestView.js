import html from '../../html/requestView.html';

export function renderRequestView(container) {
	container.innerHTML = html;

	document.getElementById('requestFlip').addEventListener('click', () => {});
}
