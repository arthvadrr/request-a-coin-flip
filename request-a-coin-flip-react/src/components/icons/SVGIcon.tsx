import icons from './icons';
import type { FC, ReactElement, SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
	icon: string;
	className?: string;
}

/**
 * Icon component for rendering SVG icons by type.
 */
const Icon: FC<IconProps> = ({
	icon,
	className = 'w-4 h-4',
	...props
}): ReactElement => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		className={className}
		aria-hidden="true"
		{...props}
	>
		{icons[icon]}
	</svg>
);

export default Icon;
