import type { FC, ReactElement } from 'react';

const Header: FC = (): ReactElement => (
	<header>
		<h1 className="text-center text-xl font-bold bg-primary">
			Request a Coin Flip
		</h1>
	</header>
);

export default Header;
