import StreamValues from 'stream-json/streamers/StreamValues.js';
import { EventEmitter } from "events";
import { Socket } from "net";
import { JsonRpcMessage, } from "./json_rpc_message.mjs";
import { InternalErrorException, JsonRpcException, MethodNotFoundException, ServerErrorException, } from "./json_rpc_exception.mjs";


/**
* The JsonRpcClient class is a two-way connection that implements the JSON-RPC protocol in its most basic form. It
* interprets every message it receives as a part of a json message. This means no leading metadata, no
* message-separation characters.
*/
export class JsonRpcClient extends EventEmitter {
    private socket: Socket;
    private idCounter = 0;
    private listening = false;
    private closed = false;
    private methods = new Map<string, (...args: any[]) => any>();
    private buffer = Buffer.alloc(0);
    private jsonStream = StreamValues.withParser();
    private pendingRequests = new Map<number, {
        resolve: (value: any) => void,
        reject: (error: any) => void
    }>();

    constructor() {
        super();
        this.socket = new Socket();
        this.socket.pipe(this.jsonStream);

        this.jsonStream.on("data", ({ key, value }: any) => this.handleMessage(value));
        this.jsonStream.on("error", (err: any) => this.emit("error", err));
        this.jsonStream.on("close", () => this.emit("close"));
    }

    /**
    * closes this socket and stopping all listeners.
    */
    close(): void {
        if (this.closed) return;
        this.closed = true;
        this.listening = false;

        this.socket.end(() => {
            this.socket.destroy();
        })

        this.emit("close");
        this.socket.removeAllListeners("data");
        this.socket.removeAllListeners("error");
        this.socket.removeAllListeners("close");
    }

    [Symbol.dispose](): void {
        this.close();
    }

    private nextId(): number {
        return this.idCounter++;
    }

    /**
    * Connects to the server and begins listening for requests. Also enables sending requests.
    * @param address The address to connect to.
    * @param port The port to connect to.
    */
    async connect(address: string, port: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket.connect(port, address, () => {
                this.listening = true;
                resolve();
            });
            this.socket.once("error", reject);
        });
    }

    /**
    * Sends a notification over JSON-RPC.
    * @param method The name of the method.
    * @param params The parameters to send.
    */
    notify(method: string, params: any = []): void {
        if (!this.listening) {
            throw new ServerErrorException("method invoked before 'connect' called.");
        }

        this.send({ jsonrpc: "2.0", method, params });
    }

    /**
    * Calls a method over JSON-RPC.
    * @param method The name of the method.
    * @param params The parameters to send. Default is an empty array.
    * @typeparam T The expected type of the result.
    */
    async call<T>(method: string, params: any = []): Promise<T> {
        if (!this.listening) {
            throw new ServerErrorException("method invoked before 'connect' called.");
        }

        const id = this.nextId();

        return new Promise<T>((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.send({ jsonrpc: "2.0", id, method, params });
        })
    }

    /**
    * Adds a method to this connection. When a notification or call with the specified method name is received,
    * the provided function will be invoked.
    *
    * @param methodName The name of the method to register.
    * @param method A callable function that will be executed when the method is invoked. The result
    * of this function will be serialized and sent back to the caller, unless the call is a notification
    * (which does not expect a response).
    * @throws {InternalErrorException} if the method already exists on the connection.
    */
    addMethod(methodName: string, method: (...args: any[]) => any): void {
        if (this.methods.has(methodName)) {
            throw new InternalErrorException(`Method '${methodName}' is already registered`);
        }
        this.methods.set(methodName, method);
    }

    /**
    * Removes a method from this connection.
    * @param methodName The name of the method to remove.
    * @returns true if the method was removed, false if the method was not found.
    */
    removeMethod(methodName: string): boolean {
        return this.methods.delete(methodName);
    }

    private send(message: JsonRpcMessage): void {
        this.socket.write(JSON.stringify(message));
    }

    private handleMessage(message: any): void {
        if (message.method) {
            this.handleIncomingRequest(message);
        } else {
            this.handleIncomingResponse(message);
        }
    }

    private handleIncomingResponse(message: JsonRpcMessage): void {
        if (message.id !== undefined) {
            const entry = this.pendingRequests.get(message.id);
            if (entry) {
                this.pendingRequests.delete(message.id);
                if (message.error) {
                    entry.reject(JsonRpcException.fromJsonRpcError(message.error));
                } else {
                    entry.resolve(message.result);
                }
            }
        }
    }

    private handleIncomingRequest(message: JsonRpcMessage): void {
        const method = this.methods.get(message.method!);
        if (!method) {
            if (message.id !== undefined) {
                this.send({
                    jsonrpc: "2.0",
                    id: message.id,
                    error: new MethodNotFoundException(message.method!).toJsonRpcError(),
                });
            }
            return;
        }

        try {
            const result = method(message.params);
            if (message.id !== undefined) {
                this.send({ jsonrpc: "2.0", id: message.id, result });
            }
        } catch (err) {
            if (message.id !== undefined) {
                let error = err instanceof JsonRpcException
                    ? err.toJsonRpcError()
                    : new ServerErrorException(
                        (err as { message?: string }).message ?? "unknown internal server error."
                    ).toJsonRpcError();
                this.send({ jsonrpc: "2.0", id: message.id, error });
            }
        }
    }
}
