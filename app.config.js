export const settings = {
    app: {
        name: "vitarwebapp",
        version: "1.0.0",
        description: "Vitar Web App",
        apiVersion: "v1",
        supportEmail: "ask@pixelcareconsulting.com"
    },
    theme: {
        skin: "dark",
        primaryColor: "#0061f2",
        secondaryColor: "#6900f2",
        fontFamily: "Inter, sans-serif"
    },
    api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        timeout: 30000, // 30 seconds
    },
    features: {
        darkMode: true,
        notifications: true,
        analytics: process.env.NODE_ENV === 'production'
    },
    defaults: {
        language: "en",
        currency: "USD",
        dateFormat: "DD/MM/YYYY"
    }
};
export default { settings };
