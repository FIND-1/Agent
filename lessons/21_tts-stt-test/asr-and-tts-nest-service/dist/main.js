"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const ws_1 = require("ws");
const app_module_1 = require("./app.module");
const tts_relay_service_1 = require("./speech/tts-relay.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const ttsRelayService = app.get(tts_relay_service_1.TtsRelayService);
    const ttsServer = new ws_1.WebSocketServer({
        server: app.getHttpServer(),
        path: '/tts',
    });
    ttsServer.on('connection', (clientWs, request) => {
        const requestUrl = new URL(request.url ?? '/tts', 'http://localhost');
        const sessionId = ttsRelayService.registerClient(clientWs, requestUrl.searchParams.get('sessionId') ?? undefined);
        clientWs.on('close', () => ttsRelayService.unregisterClient(sessionId));
    });
    app.enableShutdownHooks();
    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
//# sourceMappingURL=main.js.map