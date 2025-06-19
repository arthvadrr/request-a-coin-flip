export function renderRequestView(container) {
	container.innerHTML = `
    <h1>Request a Coin Flip</h1>
    <button id="requestFlip">Request Flip</button>
  `;

	document.getElementById('requestFlip').addEventListener('click', () => {
		alert('Flip link copied (not implemented)');
	});
}
