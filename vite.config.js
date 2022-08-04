import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			strategies: "injectManifest",
			srcDir: "src",
			filename: "sw.js",
			manifest: {
				$schema:
					"https://json.schemastore.org/web-manifest-combined.json",
				name: "WhatUpp",
				short_name: "WhatUpp",
				start_url: "/",
				display: "standalone",
				background_color: "#2C2F3A",
				theme_color: "#343A40",
				description: "A simple chat app",
				icons: [
					{
						src: "/favicon.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any"
					},
					{
						src: "/icons/manifest-icon-192.maskable.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "maskable"
					},
					{
						src: "/icons/manifest-icon-512.maskable.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable"
					}
				]
			}
		})
	]
});
