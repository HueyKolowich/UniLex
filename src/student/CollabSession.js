export default class CollabSession {
    videoToken;
    socket;
    messageQueue;
    onMessageCallback;
    classRoomId;
    username;
    soughtUsername;

    constructor(classRoomId, videoToken, username, soughtUsername, onMessageCallback) {
        this.classRoomId = classRoomId;
        this.videoToken = videoToken;
        this.username = username;
        this.soughtUsername = soughtUsername;
        this.onMessageCallback = onMessageCallback;
        this.configureWebSocket();
    }

    configureWebSocket() {
        const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
        this.socket = new WebSocket(`${protocol}://${window.location.host}/ws?classRoomId=${this.classRoomId}&videoToken=${this.videoToken}&username=${this.username}&soughtUsername=${this.soughtUsername}`);

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
    }

    send(webSocketRequest) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(webSocketRequest));
        } else {
            this.messageQueue.push(webSocketRequest);
        }
    }
}