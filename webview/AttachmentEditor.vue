<template>
    <div
        class="fixed left-0 top-1/2 ml-8 flex h-auto max-h-[95vh] w-[400px] -translate-y-1/2 select-none flex-col rounded-xl bg-[#1a1e24] p-4 text-gray-300 shadow-lg"
        @mouseenter="isHoveringMenu = true"
        @mouseleave="isHoveringMenu = false"
    >
        <h1 class="mb-3 text-2xl font-bold text-white">Attachment Editor</h1>

        <div class="mb-3 flex space-x-2">
            <select v-model="selectedConfig" class="flex-1 rounded bg-[#272c35] px-3 py-2 text-base text-white">
                <option value="">Select a configuration</option>
                <option v-for="config in savedConfigs" :key="config" :value="config">{{ config }}</option>
            </select>
            <button
                @click="loadConfig"
                class="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 focus:outline-none"
                :disabled="!selectedConfig"
            >
                Load
            </button>
            <button
                @click="openDeleteDialog"
                class="rounded bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600 focus:outline-none"
                :disabled="!selectedConfig"
            >
                Delete
            </button>
        </div>

        <div class="flex-1 space-y-4 overflow-y-auto pr-2">
            <div v-for="key in editorObjectKeys" :key="key" class="space-y-2">
                <label class="text-sm font-medium text-gray-400">{{ getCustomLabel(key) }}</label>
                <input
                    :type="key === 'boneId' || key === 'animationFlag' ? 'number' : 'text'"
                    v-model="editorObject[key]"
                    class="w-full rounded bg-[#272c35] px-3 py-2 text-base text-white placeholder-gray-600 focus:outline-none"
                    :placeholder="key"
                />
            </div>

            <div class="space-y-3">
                <h2 class="text-lg font-semibold text-white">Position and Rotation</h2>
                <div v-for="type in ['pos', 'rot']" :key="type" class="space-y-2">
                    <h3 class="text-base font-medium text-gray-400">{{ type === 'pos' ? 'Position' : 'Rotation' }}</h3>
                    <div class="grid grid-cols-3 gap-3">
                        <div v-for="axis in ['x', 'y', 'z']" :key="axis" class="space-y-2">
                            <label class="text-sm font-medium text-gray-500">{{ axis.toUpperCase() }}</label>
                            <input
                                type="range"
                                :min="type === 'pos' ? -5 : -360"
                                :max="type === 'pos' ? 5 : 360"
                                :step="type === 'pos' ? 0.01 : 1"
                                v-model.number="posData[type][axis]"
                                @input="handlePosSwitch"
                                class="slider w-full"
                            />
                            <span class="text-sm text-gray-400">{{ posData[type][axis].toFixed(2) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-3 flex justify-between space-x-2">
            <button
                @click="attachObject"
                class="flex-1 rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 focus:outline-none"
            >
                Attach
            </button>
            <button
                @click="detachObject"
                class="flex-1 rounded bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600 focus:outline-none"
            >
                Detach
            </button>
            <button
                @click="playAnimation"
                class="flex-1 rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600 focus:outline-none"
            >
                Play
            </button>
            <button
                @click="openSaveDialog"
                class="flex-1 rounded bg-yellow-500 px-3 py-2 text-sm text-white hover:bg-yellow-600 focus:outline-none"
            >
                Save
            </button>
        </div>
    </div>

    <!-- Save Configuration Dialog -->
    <div v-if="showSaveDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="w-80 rounded-lg bg-[#1a1e24] p-5 shadow-lg">
            <h3 class="mb-4 text-xl font-bold text-white">Save Configuration</h3>
            <input
                v-model="newConfigName"
                class="mb-4 w-full rounded bg-[#272c35] px-3 py-2 text-base text-white placeholder-gray-600 focus:outline-none"
                placeholder="Enter configuration name"
                @keyup.enter="saveConfig"
            />
            <div class="flex justify-end space-x-2">
                <button
                    @click="closeSaveDialog"
                    class="rounded bg-gray-500 px-4 py-2 text-sm text-white hover:bg-gray-600 focus:outline-none"
                >
                    Cancel
                </button>
                <button
                    @click="saveConfig"
                    class="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 focus:outline-none"
                >
                    Save
                </button>
            </div>
        </div>
    </div>

    <!-- Delete Configuration Dialog -->
    <div v-if="showDeleteDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="w-80 rounded-lg bg-[#1a1e24] p-5 shadow-lg">
            <h3 class="mb-4 text-xl font-bold text-white">Delete Configuration</h3>
            <p class="mb-4 text-base text-gray-300">
                Are you sure you want to delete the configuration "{{ selectedConfig }}"?
            </p>
            <div class="flex justify-end space-x-2">
                <button
                    @click="closeDeleteDialog"
                    class="rounded bg-gray-500 px-4 py-2 text-sm text-white hover:bg-gray-600 focus:outline-none"
                >
                    Cancel
                </button>
                <button
                    @click="deleteConfig"
                    class="rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 focus:outline-none"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useEvents } from '@Composables/useEvents';
import { ref, onMounted, computed } from 'vue';
import { AttachmentEditorEvents } from '../shared/events';

const isHoveringMenu = ref(false);
const isPlayingAnim = ref(false);
const selectedConfig = ref('');
const savedConfigs = ref([]);
const showSaveDialog = ref(false);
const showDeleteDialog = ref(false);
const newConfigName = ref('');

const events = useEvents();
const editorObject = ref({
    prop: 'prop_tool_blowtorch',
    boneId: 57005,
    animationDictionary: '',
    animationName: '',
    animationFlag: 2,
});

const editorObjectKeys = computed(() => ['prop', 'boneId', 'animationDictionary', 'animationName', 'animationFlag']);

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
    events.emitServer(AttachmentEditorEvents.PLAY_ANIMATION, editorObject.value, isPlayingAnim.value);
}

function openSaveDialog() {
    showSaveDialog.value = true;
    newConfigName.value = '';
}

function closeSaveDialog() {
    showSaveDialog.value = false;
    newConfigName.value = '';
}

function openDeleteDialog() {
    if (selectedConfig.value) {
        showDeleteDialog.value = true;
    }
}

function closeDeleteDialog() {
    showDeleteDialog.value = false;
}

async function saveConfig() {
    if (newConfigName.value.trim()) {
        const config = {
            editorObject: {
                prop: editorObject.value.prop,
                boneId: editorObject.value.boneId,
                animationDictionary: editorObject.value.animationDictionary,
                animationName: editorObject.value.animationName,
                animationFlag: editorObject.value.animationFlag,
            },
            posData: posData.value,
        };
        const success = await events.emitServerRpc(AttachmentEditorEvents.SAVE_CONFIG, {
            name: newConfigName.value.trim(),
            data: config,
        });
        if (success) {
            await loadSavedConfigs();
            closeSaveDialog();
        } else {
            console.error('Failed to save configuration');
        }
    }
}

async function loadConfig() {
    if (selectedConfig.value) {
        const config = await events.emitServerRpc(AttachmentEditorEvents.LOAD_CONFIG, selectedConfig.value);
        if (config) {
            editorObject.value = {
                prop: config.editorObject.prop,
                boneId: config.editorObject.boneId,
                animationDictionary: config.editorObject.animationDictionary,
                animationName: config.editorObject.animationName,
                animationFlag: config.editorObject.animationFlag,
            };
            posData.value = { ...config.posData };
        } else {
            console.error('Failed to load configuration');
        }
    }
}

async function deleteConfig() {
    if (selectedConfig.value) {
        const success = await events.emitServerRpc(AttachmentEditorEvents.DELETE_CONFIG, selectedConfig.value);
        if (success) {
            await loadSavedConfigs();
            selectedConfig.value = '';
            closeDeleteDialog();
        } else {
            console.error('Failed to delete configuration');
        }
    }
}

async function loadSavedConfigs() {
    savedConfigs.value = await events.emitServerRpc(AttachmentEditorEvents.LOAD_CONFIGS);
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
    height: 10px;
    border-radius: 5px;
    background: #2d3748;
    outline: none;
}

input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4299e1;
    cursor: pointer;
}

input[type='range']::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4299e1;
    cursor: pointer;
}
</style>
