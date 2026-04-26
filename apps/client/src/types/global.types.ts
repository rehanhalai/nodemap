import { FabricObject } from "fabric";

export interface ExtendedFabricObject extends FabricObject {
	id: string;
	__skipEmit?: boolean;
}

export interface SocketDetails {
	clientId: string;
}
export interface SerializedObjectData {
	id: string;
	type: string;
	[key: string]: unknown;
}
