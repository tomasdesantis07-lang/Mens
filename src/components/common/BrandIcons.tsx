import React from 'react';
import Svg, { Circle, Path, SvgProps } from 'react-native-svg';
import { COLORS } from '../../theme/theme';

/**
 * BrandIcons.tsx
 * 
 * Use esta base para integrar sus propios vectores de marca.
 * 1. Copie los paths de su SVG (desde Figma/Illustrator).
 * 2. Cámbielos por componentes aquí.
 * 3. Use 'currentColor' o las props de color para mantener la consistencia dinámica.
 */

export interface IconProps extends SvgProps {
    size?: number;
    color?: string;
}

/**
 * Logotipo de Marca MENS (Símbolo decorativo)
 */
export const MensBrandSymbol = ({
    size = 24,
    color = COLORS.primary,
    ...props
}: IconProps) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 375 375"
        fill="none"
        {...props}
    >
        <Path
            d="M 219.367188 366.730469 C 217.796875 366.769531 189.75 262.882812 180.824219 233.582031 C 165.78125 184.226562 145.890625 126.246094 128.503906 101.523438 C 123.539062 94.464844 112.351562 81.183594 110.761719 81.328125 C 109.128906 81.472656 94.539062 97.011719 87.0625 121.210938 C 78.28125 149.644531 75.4375 163.125 85.734375 203.457031 C 88.1875 213.070312 97.761719 240.589844 99.148438 242.027344 C 99.402344 242.355469 99.265625 242.722656 98.644531 242.835938 C 96.742188 243.253906 77.105469 220.859375 70.527344 210.785156 C 40.476562 164.773438 36.792969 113.816406 61.320312 60.335938 C 83.292969 12.441406 115.089844 6.953125 115.089844 6.953125 C 116.875 6.304688 143.960938 24.5 167.5 55.523438 C 188.707031 83.472656 192.039062 91.710938 192.125 91.617188 C 192.222656 91.523438 201.457031 76.40625 214.265625 61.328125 C 238.632812 32.636719 261.515625 27.507812 262.613281 27.582031 C 262.613281 27.582031 307.183594 63.359375 315.066406 128.1875 C 320.621094 173.859375 309.945312 218.597656 308.742188 221.058594 C 307.953125 222.671875 298.691406 180.875 291.695312 160.3125 C 271.441406 100.785156 260.03125 90.96875 259.28125 90.894531 C 234.25 103.960938 210.304688 131.972656 208.902344 160.628906 C 228.253906 248.136719 233.65625 277.625 219.375 366.726562 Z M 219.367188 366.730469"
            fill={color}
            fill-opacity="1"
            fill-rule="nonzero"
        />
    </Svg>
);

/**
 * Logotipo Completo MENS para Pantallas de Inicio/Auth
 */
export const MensLogo = ({
    size = 120,
    color = COLORS.textPrimary,
    ...props
}: IconProps) => (
    <MensBrandSymbol size={size} color={color} {...props} />
);


/**
 * EJEMPLO: Icono de Corona Premium (Custom)
 */
export const MensEliteCrown = ({
    size = 24,
    color = "#FFD700", // Gold default
    ...props
}: IconProps) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        {...props}
    >
        <Path
            d="M2 4L5 12L12 4L19 12L22 4V20H2V4Z"
            fill={color}
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
    </Svg>
);

/**
 * EJEMPLO: Isotipo Circular (Para perfiles o badges)
 */
export const MensBadgeIcon = ({
    size = 24,
    color = COLORS.primary,
    ...props
}: IconProps) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        {...props}
    >
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <Path
            d="M8 12L11 15L16 9"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);
