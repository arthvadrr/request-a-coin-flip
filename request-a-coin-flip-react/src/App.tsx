import Button from './components/Button';
import type { FC, ReactElement } from 'react';
import './index.css';

const App: FC = (): ReactElement => (
	<>
		<h1>Request a Coin Flip</h1>
		<div>
			Use the button below to create a new coin flip and send it to someone. The
			recipient has an hour to flip their coin. The result will be available at
			the generated URL for a day.
		</div>
		<Button>Flip Coin</Button>
	</>
);

export default App;
