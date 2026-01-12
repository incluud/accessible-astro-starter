import { defineThemeConfig } from '@utils/defineThemeConfig'
import previewImage from '@public/social-preview-image.png'
import logoImage from '@assets/img/logo.svg'

export default defineThemeConfig({
    name: 'Accessible Astro Starter',
    id: 'accessible-astro-starter',
    logo: logoImage,
    seo: {
        title: 'Accessible Astro Starter',
        description: 'An Accessible Starter Theme for Astro including several accessibility features and tools to help you build faster.',
        author: 'Mark Teekman',
        image: previewImage,
    },
    colors: {
        primary: '#d648ff',
        secondary: '#00d1b7',
        neutral: '#b9bec4',
    },

    navigation: {
        darkmode: true,
        items: [
            {
                label: 'Home',
                href: '/',
            },
            {
                label: 'Blog',
                href: '/blog',
                external: false, // False is the default value
            },
            {
                label: 'Portfolio',
                href: '/portfolio',
            },
            {
                label: 'Theme features',
                href: '/theme-features',
                items: [
                    {
                        label: 'Accessibility statement',
                        href: '/accessibility-statement',
                    },
                ]
            },
            {
                label: 'Contact',
                href: '/contact',
            },
            {
                label: 'Docs',
                href: 'https://accessible-astro.incluud.dev/',
                highlight: true,
                external: true,
            },
            {
                label: 'Go to the GitHub page',
                href: 'https://github.com/incluud/accessible-astro-starter',
                icon: 'lucide:github',
                external: true,
            }
        ]
    }
})