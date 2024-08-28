import * as alt from 'alt-server';
import { AttachmentEditorEvents } from '../../shared/events.js';
import { saveConfig, loadConfig, getSavedConfigs, deleteConfig } from './filesystem.js';
import { useRebar } from '@Server/index.js';

const Rebar = useRebar();

alt.onRpc(AttachmentEditorEvents.SAVE_CONFIG, (player: alt.Player, { name, data }) => {
    return saveConfig(name, data);
});

alt.onRpc(AttachmentEditorEvents.LOAD_CONFIG, (player: alt.Player, configName: string) => {
    return loadConfig(configName);
});

alt.onRpc(AttachmentEditorEvents.LOAD_CONFIGS, (player: alt.Player) => {
    return getSavedConfigs();
});

alt.onRpc(AttachmentEditorEvents.DELETE_CONFIG, (player: alt.Player, configName: string) => {
    return deleteConfig(configName);
});

alt.onClient(
    AttachmentEditorEvents.PLAY_ANIMATION,
    (
        player: alt.Player,
        data: {
            prop: string;
            boneId: number;
            animationDictionary: string;
            animationName: string;
            animationFlag: number;
        },
        animPlaying: boolean,
    ) => {
        if (!animPlaying) {
            Rebar.usePlayer(player).animation.playInfinite(
                data.animationDictionary,
                data.animationName,
                data.animationFlag,
            );
        } else {
            Rebar.usePlayer(player).animation.clear();
        }
    },
);
