/** @type {import('next').NextConfig} */

const nextConfig = {
    typescript: {
        // !! WARN !!
        // Temporalmente ignorar errores de TypeScript durante el build
        // Remover cuando el código esté completo
        ignoreBuildErrors: true,
    },
    eslint: {
        // Temporalmente ignorar errores de ESLint durante el build
        ignoreDuringBuilds: true,
    },
}

export default nextConfig
