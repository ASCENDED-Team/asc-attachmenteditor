import * as alt from 'alt-server';
import { useKeybinder } from '@Server/systems/serverKeybinds.js';
import { useWebview } from '@Server/player/webview.js';
import { useRebar } from '@Server/index.js';
import { PageNames } from '@Shared/webview/index.js';

const Keybinder = useKeybinder();
const Rebar = useRebar();

Keybinder.on(123, (player: alt.Player) => {
    const Webview = useWebview(player);

    Webview.show('AttachmentEditor', 'page', true);
    Webview.focus();

    alt.emitClient(player, 'CAMERA_MOVEMENT_CONTROL', false);
});

Rebar.events.useEvents().on('page-closed', (player: alt.Player, page: PageNames) => {
    if (typeof page !== 'undefined' && page === 'AttachmentEditor') {
        const Webview = useWebview(player);

        Webview.unfocus();
        alt.emitClient(player, 'CAMERA_MOVEMENT_CONTROL', true);
    }
});
