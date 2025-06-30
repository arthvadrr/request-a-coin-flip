import Header from '../sections/Header';
import Footer from '../sections/Footer';
import type { FC, ReactElement, ReactNode } from 'react';

const scaffoldClass =
	'grid grid-cols-1 min-h-screen grid-rows-[auto_1fr_auto] place-items-stretch w-full';
const mainClass = 'w-full flex justify-center items-center p-8';

/**
 * Scaffold provides a 3-row grid layout with optional header and footer.
 */
const Scaffold: FC<{ children: ReactNode }> = ({ children }): ReactElement => (
	<div className={scaffoldClass}>
		{/**
		 * Header content
		 */}
		<Header />

		{/**
		 * Main content
		 */}
		<main className={mainClass}>{children}</main>

		{/**
		 * Footer content
		 */}
		<Footer />
	</div>
);

export default Scaffold;
