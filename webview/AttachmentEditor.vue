<template>
    <div
        class="fixed left-0 top-1/2 ml-8 flex h-auto max-h-[90vh] w-[300px] -translate-y-1/2 select-none flex-col rounded-xl bg-[#1a1e24] p-3 text-gray-300 shadow-lg"
        @mouseenter="isHoveringMenu = true"
        @mouseleave="isHoveringMenu = false"
    >
        <h1 class="mb-2 text-xl font-bold text-white">Attachment Editor</h1>

        <div class="mb-2 flex space-x-2">
            <select v-model="selectedConfig" class="flex-1 rounded bg-[#272c35] px-2 py-1 text-sm text-white">
                <option value="">Select a configuration</option>
                <option v-for="config in savedConfigs" :key="config" :value="config">{{ config }}</option>
            </select>
            <button
                @click="loadConfig"
                class="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 focus:outline-none"
            >
                Load
            </button>
        </div>

        <div class="flex-1 space-y-3 overflow-y-auto pr-2">
            <div v-for="(value, key) in editorObject" :key="key" class="space-y-1">
                <label class="text-xs font-medium text-gray-500">{{ getCustomLabel(key) }}</label>
                <input
                    :type="key === 'boneId' || key === 'animationFlag' ? 'number' : 'text'"
                    v-model="editorObject[key]"
                    class="w-full rounded bg-[#272c35] px-2 py-1 text-sm text-white placeholder-gray-600 focus:outline-none"
                    :placeholder="key"
                />
            </div>

            <div class="space-y-2">
                <h2 class="text-sm font-semibold text-white">Position and Rotation</h2>
                <div v-for="type in ['pos', 'rot']" :key="type" class="space-y-1">
                    <h3 class="text-xs font-medium text-gray-400">{{ type === 'pos' ? 'Position' : 'Rotation' }}</h3>
                    <div class="grid grid-cols-3 gap-2">
                        <div v-for="axis in ['x', 'y', 'z']" :key="axis" class="space-y-1">
                            <label class="text-xs font-medium text-gray-500">{{ axis.toUpperCase() }}</label>
                            <input
                                type="range"
                                :min="type === 'pos' ? -5 : -360"
                                :max="type === 'pos' ? 5 : 360"
                                :step="type === 'pos' ? 0.01 : 1"
                                v-model.number="posData[type][axis]"
                                @input="handlePosSwitch"
                                class="slider w-full"
                            />
                            <span class="text-xs text-gray-400">{{ posData[type][axis].toFixed(2) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-2 flex justify-between space-x-1">
            <button
                @click="attachObject"
                class="flex-1 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 focus:outline-none"
            >
                Attach
            </button>
            <button
                @click="detachObject"
                class="flex-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600 focus:outline-none"
            >
                Detach
            </button>
            <button
                @click="playAnimation"
                class="flex-1 rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600 focus:outline-none"
            >
                Play
            </button>
            <button
                @click="saveConfig"
                class="flex-1 rounded bg-yellow-500 px-2 py-1 text-xs text-white hover:bg-yellow-600 focus:outline-none"
            >
                Save
            </button>
        </div>
    </div>
</template>

<script setup>
import { useEvents } from '@Composables/useEvents';
import { ref, onMounted } from 'vue';
import { AttachmentEditorEvents } from '../shared/events';

const isHoveringMenu = ref(false);
const isPlayingAnim = ref(false);
const selectedConfig = ref('');
const savedConfigs = ref([]);

const events = useEvents();
const editorObject = ref({
    prop: 'prop_tool_blowtorch',
    boneId: 57005,
    animationDictionary: '',
    animationName: '',
    animationFlag: 2,
});

const posData = ref({
    pos: { x: 0, y: 0, z: 0 },
    rot: { x: 0, y: 0, z: 0 },
});

const customLabels = {
    prop: 'Name of Object / Prop',
    boneId: 'Bone ID which Object should be attached to',
    animationDictionary: 'Animation Dictionary',
    animationName: 'Name of Animation',
    animationFlag: 'Number of Animationflag',
};

function getCustomLabel(key) {
    return customLabels[key] || key;
}

function attachObject() {
    if (editorObject.value.prop !== '' && 'alt' in window) {
        events.emitClient(AttachmentEditorEvents.EMIT_DATA, editorObject.value, posData.value);
    }
}

function detachObject() {
    if ('alt' in window) {
        events.emitClient(AttachmentEditorEvents.DETACH_OBJECT);
    }
}

function handlePosSwitch() {
    events.emitClient(AttachmentEditorEvents.INPUT_CHANGED, editorObject.value, posData.value);
}

function playAnimation() {
    isPlayingAnim.value = !isPlayingAnim.value;
    events.emitClient(AttachmentEditorEvents.PLAY_ANIMATION, editorObject.value, isPlayingAnim.value);
}

async function saveConfig() {
    const configName = prompt('Enter a name for this configuration:');
    if (configName) {
        const config = {
            editorObject: editorObject.value,
            posData: posData.value,
        };
        await events.emitServerRpc('SAVE_ATTACHMENT_CONFIG', { name: configName, data: config });
        loadSavedConfigs();
    }
}

async function loadConfig() {
    if (selectedConfig.value) {
        const config = await events.emitServerRpc('LOAD_ATTACHMENT_CONFIG', selectedConfig.value);
        if (config) {
            editorObject.value = config.editorObject;
            posData.value = config.posData;
        }
    }
}

async function loadSavedConfigs() {
    savedConfigs.value = await events.emitClientRpc('GET_SAVED_ATTACHMENT_CONFIGS');
}

onMounted(() => {
    loadSavedConfigs();

    document.addEventListener('mousedown', (e) => {
        if (isHoveringMenu.value) return;
        events.emitClient('CAMERA_MOVE_START');
    });

    document.addEventListener('mouseup', (e) => {
        events.emitClient('CAMERA_MOVE_END');
    });

    document.addEventListener('wheel', (e) => {
        if (isHoveringMenu.value) return;
        if (e.deltaY < 0) {
            events.emitClient('CAMERA_SCROLL_UP');
        } else if (e.deltaY > 0) {
            events.emitClient('CAMERA_SCROLL_DOWN');
        }
    });
});
</script>

<style scoped>
.select-none {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.select-text {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
}

input[type='range'] {
    appearance: none;
    -webkit-appearance: none;
    height: 8px;
    border-radius: 5px;
    background: #2d3748;
    outline: none;
}

input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4299e1;
    cursor: pointer;
}

input[type='range']::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4299e1;
    cursor: pointer;
}
</style>
