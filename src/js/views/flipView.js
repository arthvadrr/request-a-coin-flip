export function renderFlipView(container, id) {
	container.innerHTML = `
    <h1>Flip for Request ID: ${id}</h1>
    <button id="flipCoin">Flip Coin</button>
    <div id="result"></div>
  `;

	document.getElementById('flipCoin').addEventListener('click', () => {
		const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
		document.getElementById('result').textContent = `Result: ${result}`;
		// Future: Save result to backend
	});
}
