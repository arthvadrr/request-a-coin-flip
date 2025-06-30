import Scaffold from '../components/Scaffold';
import Button from '../components/Button';
import type { FC, ReactElement } from 'react';

/**
 * Home page
 */
const Home: FC = (): ReactElement => (
	<Scaffold>
		<section>
			<div>
				Use the button below to create a new coin flip and send it to someone.
				The recipient has an hour to flip their coin. The result will be
				available at the generated URL for a day.
			</div>
			<Button>Flip Coin</Button>
		</section>
	</Scaffold>
);

export default Home;
