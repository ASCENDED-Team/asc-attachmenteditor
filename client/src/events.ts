import * as alt from 'alt-client';
import * as native from 'natives';

import { useClientApi } from '@Client/api/index.js';
import { useWebview } from '@Client/webview/index.js';
import { AttachmentEditorEvents } from '../../shared/events.js';
import { useRebarClient } from '@Client/index.js';

const CameraAPI = await useClientApi().getAsync('ascended-camera-api');
const Webview = useWebview();
const Rebar = useRebarClient();

let createdObject: number | undefined;
type currentAttachment = {
    prop: string;
    boneId: number;
    animationDictionary: string;
    animationName: string;
    animationFlag: string;
};

alt.onServer('CAMERA_MOVEMENT_CONTROL', (state: boolean) => {
    CameraAPI.onMovementControl(state);
});

Webview.on(
    AttachmentEditorEvents.EMIT_DATA,
    (current: currentAttachment, posData: { pos: alt.Vector3; rot: alt.Vector3 }) => {
        try {
            removeObject();
        } catch (e) {
            alt.log(`[AttachmentEditor] ${e}`);
        }

        native.requestModel(alt.hash(current.prop));
        if (native.hasModelLoaded(alt.hash(current.prop))) {
            createdObject = native.createObject(
                alt.hash(current.prop),
                +posData.pos.x,
                +posData.pos.y,
                +posData.pos.z,
                true,
                true,
                true,
            );

            native.attachEntityToEntity(
                createdObject,
                alt.Player.local.scriptID,
                native.getPedBoneIndex(alt.Player.local, current.boneId),
                +posData.pos.y,
                +posData.pos.x,
                +posData.pos.z,
                +posData.rot.x,
                +posData.rot.y,
                +posData.rot.z,
                false,
                true,
                false,
                false,
                1,
                true,
                false,
            );
        }
    },
);

Webview.on(
    AttachmentEditorEvents.INPUT_CHANGED,
    (current: currentAttachment, posData: { pos: alt.Vector3; rot: alt.Vector3 }) => {
        try {
            removeObject();
        } catch (e) {
            alt.log(`[AttachmentEditor] ${e}`);
        }

        native.requestModel(alt.hash(current.prop));
        if (native.hasModelLoaded(alt.hash(current.prop))) {
            createdObject = native.createObject(
                alt.hash(current.prop),
                +posData.pos.x,
                +posData.pos.y,
                +posData.pos.z,
                true,
                true,
                true,
            );

            native.attachEntityToEntity(
                createdObject,
                alt.Player.local.scriptID,
                native.getPedBoneIndex(alt.Player.local, current.boneId),
                +posData.pos.x,
                +posData.pos.y,
                +posData.pos.z,
                +posData.rot.x,
                +posData.rot.y,
                +posData.rot.z,
                false,
                true,
                true,
                false,
                1,
                true,
                false,
            );
        }
    },
);

Webview.on(AttachmentEditorEvents.DETACH_OBJECT, () => {
    try {
        removeObject();
    } catch (e) {
        alt.log(`[AttachmentEditor] ${e}`);
    }
});

function removeObject() {
    if (createdObject) {
        native.detachEntity(createdObject, true, true);
        native.deleteObject(createdObject);
        createdObject = undefined;
    }
}
