import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: [
                    "/",
                    "/courses",
                    "/courses/*",
                    "/instructors",
                    "/articles",
                    "/articles/*",
                    "/muqtatafat",
                ],
                disallow: [
                    "/admin",
                    "/dashboard",
                    "/my-courses",
                    "/profile",
                    "/learn",
                    "/instructor",
                    "/api",
                    "/login",
                    "/register",
                    "/forgot-password",
                    "/reset-password",
                    "/courses/success",
                    "/courses/cancel",
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
