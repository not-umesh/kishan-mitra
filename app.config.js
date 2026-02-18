import 'dotenv/config';

export default {
    expo: {
        name: "kisan-mitra",
        slug: "kisan-mitra",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        assetBundlePatterns: [
            "**/*"
        ],
        ios: {
            supportsTablet: true
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            package: "com.kisanmitra.app"
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            eas: {
                projectId: "86266939-cd80-493a-be89-8805c3add7c2"
            },
            // Pass env vars to the app
            DATA_GOV_API_KEY: process.env.DATA_GOV_API_KEY,
            OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
            BACKEND_URL: process.env.BACKEND_URL,
        }
    }
};
