import type { ImageMetadata } from 'astro'

export type NavigationItem = {
    label: string
    href: string
    external?: boolean
    highlight?: boolean
    icon?: string
    items?: {
        label: string
        href: string
        external?: boolean
    }[]
}

export type ThemeConfig = {
    name: string
    id: string
    logo?: ImageMetadata | null
    seo: {
        title: string
        subtitle?: string
        description?: string
        author?: string
        image?: ImageMetadata | null
    }
    colors: {
        primary: string
        secondary: string
        neutral: string
    }
    navigation: {
        darkmode?: boolean
        items: NavigationItem[]
    }
}

const defaultConfig: Omit<ThemeConfig, 'name' | 'id'> = {
    seo: {
        title: 'My Astro Site',
        subtitle: '',
        description: 'A website built with Accessible Astro Starter',
        author: '',
        image: null,
    },
    colors: {
        primary: '#d648ff',
        secondary: '#00d1b7',
        neutral: '#b9bec4',
    },
    navigation: {
        darkmode: true,
        items: [],
    },
}

export function defineThemeConfig(config: ThemeConfig): ThemeConfig {
    return {
        ...config,
        seo: {
            ...defaultConfig.seo,
            ...config.seo,
        },
        colors: {
            ...defaultConfig.colors,
            ...config.colors,
        },
        navigation: {
            ...defaultConfig.navigation,
            ...config.navigation,
        },
    }
}