import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: '#326273',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			surface: '#ffffff',
  			canvas: '#EFEFED',
  			soft: '#eeeeee',
  			'text-base': '#24323a',
  			'text-muted': '#64748b',
  			'border-base': '#d9e2e5',
  			status: {
  				draft: {
  					bg: '#F1F5F9',
  					text: '#475569'
  				},
  				submitted: {
  					bg: '#EFF6FF',
  					text: '#1D4ED8'
  				},
  				approved: {
  					bg: '#FEF3C7',
  					text: '#92400E'
  				},
  				confirmed: {
  					bg: '#FEF3C7',
  					text: '#92400E'
  				},
  				posted: {
  					bg: '#D1FAE5',
  					text: '#065F46'
  				},
  				partiallyPaid: {
  					bg: '#ECFDF5',
  					text: '#047857'
  				},
  				paid: {
  					bg: '#D1FAE5',
  					text: '#065F46'
  				},
  				void: {
  					bg: '#FEE2E2',
  					text: '#991B1B'
  				},
  				cancelled: {
  					bg: '#FEE2E2',
  					text: '#991B1B'
  				},
  				rejected: {
  					bg: '#FEE2E2',
  					text: '#991B1B'
  				},
  				delivered: {
  					bg: '#D1FAE5',
  					text: '#065F46'
  				},
  				received: {
  					bg: '#D1FAE5',
  					text: '#065F46'
  				},
  				converted: {
  					bg: '#F3E8FF',
  					text: '#6B21A8'
  				}
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			'2xs': [
  				'11px',
  				{
  					lineHeight: '1.2'
  				}
  			]
  		},
  		keyframes: {
  			'spin-slow': {
  				'0%': { transform: 'rotate(0deg)' },
  				'100%': { transform: 'rotate(360deg)' },
  			},
  		},
  		animation: {
  			'spin-slow': 'spin-slow 3s linear infinite',
  		},
  	}
  },
  plugins: [tailwindcssAnimate],
} satisfies Config
