import type { ImageMetadata } from 'astro'
export type ThemeConfig = {
    name: string,
    id: string,
    logo?: ImageMetadata | null,
    seo: {
        title: string
        subtitle?: string
        description?: string
        author?: string
        image?: ImageMetadata | null
    },
    colors: {
        primary: string
        secondary: string
        neutral: string
    },

    navigation: {
        darkmode?: boolean,
        items: {
            label: string
            href: string,
            external?: boolean
            highlight?: boolean
            icon?: string
            items?: {
                label: string
                href: string
                external?: boolean
            }[]
        }[]
    }
}

export function defineThemeConfig(themeConfig: ThemeConfig) {
    //  Todo: provide default values for the theme config

    return themeConfig
}