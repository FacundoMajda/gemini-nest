# Gemini 2.5 Pro con NestJS

Este proyecto es un servicio backend basado en NestJS que se integra con la IA Gemini de Google

El servicio está estructurado para ser extensible y fácil de usar, permitiendo a los desarrolladores construir rápidamente aplicaciones impulsadas por IA generativa. Utiliza los paquetes `@ai-sdk/google` y `ai` para una interacción fluida con los modelos Gemini.

1. Instala las dependencias:

   ```bash
   yarn install
   ```

2. Configura las variables de entorno. Crea un archivo `.env` en el directorio raíz y añade tu clave API de Google Gemini:

   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=TU_CLAVE_API
   ```

3. Inicia el servidor de desarrollo:

   ```bash
    yarn start:dev
   ```

La aplicación se iniciará en modo de observación en `http://localhost:3000`.

Para ejecutar pruebas de extremo a extremo:

```bash
npm run test:e2e
```
