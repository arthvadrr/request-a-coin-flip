import clsx from 'clsx';
import type { FC, MouseEventHandler, ReactNode, ReactElement } from 'react';

export type ButtonType = 'primary' | 'secondary' | 'outline';

interface ButtonProps {
	type?: ButtonType;
	onClick?: MouseEventHandler<HTMLButtonElement>;
	icon?: ReactNode;
	children: ReactNode;
	className?: string;
}

const baseStyles: string =
	'inline-flex items-center justify-center gap-2 px-4 py-2 rounded font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed';

const typeStyles: Record<ButtonType, string> = {
	primary: 'bg-primary text-darkbg hover:bg-accent/80',
	secondary: 'bg-muted text-darkbg hover:bg-muted/80',
	outline:
		'border-2 border-accent text-accent bg-transparent hover:bg-accent/10',
};

/**
 * Button component for consistent theming and usage.
 */
const Button: FC<ButtonProps> = ({
	type = 'primary',
	onClick,
	icon,
	children,
	className = '',
	...props
}): ReactElement => (
	<button
		type="button"
		onClick={onClick}
		className={clsx(baseStyles, typeStyles[type], className)}
		{...props}
	>
		{icon && <span className="flex items-center">{icon}</span>}
		<span className="flex items-center">{children}</span>
	</button>
);

export default Button;
