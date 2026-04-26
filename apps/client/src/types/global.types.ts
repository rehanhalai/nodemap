import { FabricObject } from "fabric";

export interface ExtendedFabricObject extends FabricObject {
	id: string;
	__skipEmit?: boolean;
	lockedBy?: string | null;
}

export interface SocketDetails {
	clientId: string;
}
export interface SerializedObjectData {
	id: string;
	type: string;
	lockedBy?: string | null;
	[key: string]: unknown;
}
