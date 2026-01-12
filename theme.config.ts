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
})