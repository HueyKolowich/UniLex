export default class CollabSession {
    videoToken;
    socket;
    messageQueue;
    onMessageCallback;

    constructor(videoToken, onMessageCallback) {
        this.videoToken = videoToken;
        this.onMessageCallback = onMessageCallback;
        this.configureWebSocket();
    }

    configureWebSocket() {
        const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
        this.socket = new WebSocket(`${protocol}://${window.location.host}/ws?token=${this.videoToken}`);

        this.messageQueue = [];

        this.socket.addEventListener('open', () => {
            this.messageQueue.forEach((message) => {
                this.socket.send(JSON.stringify(message));
            });
            this.messageQueue = [];
        });

        this.socket.addEventListener('message', (webSocketResponse) => {
            const data = webSocketResponse.data;

            if (this.onMessageCallback) {
                this.onMessageCallback(data);
            }
        });

        this.socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
        });

        this.socket.addEventListener('close', () => {
            console.warn('WebSocket connection closed. Attempting to reconnect...');
            setTimeout(() => this.configureWebSocket(), 5000); // Reconnect after 5 seconds
        });
    }

    send(webSocketRequest) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(webSocketRequest));
        } else {
            this.messageQueue.push(webSocketRequest);
        }
    }
}