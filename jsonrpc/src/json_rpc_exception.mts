import { JsonRpcError } from "./json_rpc_message.mjs";

/**
 * Represents a JSON-RPC exception.
 */
export class JsonRpcException extends Error {
    readonly code: number;

    constructor(message: string, code: number) {
        super(message);
        this.code = code;
        this.name = "JsonRpcException";
    }

    toJsonRpcError(): JsonRpcError {
        return {
            code: this.code,
            message: this.message,
        };
    }

    static fromJsonRpcError(error: JsonRpcError): JsonRpcException {
        switch (error.code) {
            case -32700:
                return new ParseErrorException();
            case -32600:
                return new InvalidRequestException();
            case -32601:
                return new MethodNotFoundException(error.message ?? "");
            case -32602:
                return new InvalidParamsException();
            case -32603:
                return new InternalErrorException(error.message ?? "");
            case -32000:
                return new ServerErrorException(error.message ?? "");
            default:
                return new JsonRpcException(error.message ?? "", error.code);
        }
    }
}

/**
 * Exception for parsing errors in JSON-RPC messages.
 */
export class ParseErrorException extends JsonRpcException {
    constructor() {
        super("Error parsing JSON-RPC message", -32700);
    }
}

/**
 * Exception for invalid JSON-RPC messages.
 */
export class InvalidRequestException extends JsonRpcException {
    constructor() {
        super("Invalid JSON-RPC message", -32600);
    }
}

/**
 * Exception for when a method is not found in a JSON-RPC message.
 */
export class MethodNotFoundException extends JsonRpcException {
    constructor(method: string) {
        super(`Method not found: ${method}`, -32601);
    }
}

/**
 * Exception for invalid parameters in a JSON-RPC message.
 */
export class InvalidParamsException extends JsonRpcException {
    constructor() {
        super("Invalid params", -32602);
    }
}

/**
 * Exception for internal errors in JSON-RPC handling.
 */
export class InternalErrorException extends JsonRpcException {
    constructor(message: string) {
        super(message, -32603);
    }
}

/**
 * Exception for server errors in JSON-RPC handling.
 */
export class ServerErrorException extends JsonRpcException {
    constructor(message: string) {
        super(message, -32000);
    }
}
