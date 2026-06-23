<template>
    <!-- Teleport our content into the Dashboard app bar.
         #app-bar-title  => left, next to the page title
         #app-bar-actions => right side of the app bar
         These targets exist on every page (rendered by the Baseline layout),
         and this widget is ui-base scoped, so it mounts globally. -->
    <Teleport v-if="mounted && visibleOnPage" :to="target">
        <div class="nrdb-ui-header" data-el="ui-header">
            <template v-for="(item, idx) in items" :key="idx">
                <span
                    v-if="item.type === 'text'"
                    class="nrdb-ui-header__text"
                    :style="textStyle(item)"
                >{{ textValue(item) }}</span>

                <!-- eslint-disable-next-line vue/no-v-html -->
                <div
                    v-else-if="item.type === 'template'"
                    class="nrdb-ui-header__template"
                    :style="textStyle(item)"
                    v-html="renderHtml(item)"
                />

                <v-btn
                    v-else-if="item.type === 'button'"
                    class="nrdb-ui-header__btn"
                    size="small"
                    variant="tonal"
                    :color="itemColor(item) || undefined"
                    :style="buttonStyle(item)"
                    @click="onButton(item)"
                >
                    <v-icon
                        v-if="itemIcon(item) && iconLeft(item)"
                        :start="!!item.label"
                    >{{ itemIcon(item) }}</v-icon>
                    <span v-if="item.label" :style="buttonTextStyle(item)">{{ item.label }}</span>
                    <v-icon
                        v-if="itemIcon(item) && !iconLeft(item)"
                        :end="!!item.label"
                    >{{ itemIcon(item) }}</v-icon>
                </v-btn>

                <v-select
                    v-else-if="item.type === 'dropdown'"
                    class="nrdb-ui-header__dropdown"
                    :items="optionList(item)"
                    :label="item.label"
                    :model-value="selectionMap[dropdownKey(item, idx)]"
                    :color="itemColor(item) || undefined"
                    :base-color="itemColor(item) || undefined"
                    :style="sizeStyle(item)"
                    item-title="title"
                    item-value="value"
                    hide-details
                    density="compact"
                    variant="outlined"
                    @update:model-value="onDropdown(item, idx, $event)"
                />
            </template>
        </div>
    </Teleport>
</template>

<script>
export default {
    name: 'UIHeader',
    inject: ['$socket', '$dataTracker'],
    props: {
        /* Dashboard's Layout Manager passes these into every widget */
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({ enabled: false, visible: false }) }
    },
    data () {
        return {
            mounted: false,
            // reactive, key-based state maintained on the client.
            // These are kept up-to-date from live msg-input events AND restored
            // from the server datastore on (re)load, so the header survives a refresh.
            valueMap: {}, // key -> latest payload (for dynamic text / template items)
            styleMap: {}, // key -> { color, font, fontSize, fontWeight, width, icon }
            selectionMap: {} // dropdown key -> selected value
        }
    },
    computed: {
        items () {
            return Array.isArray(this.props.items) ? this.props.items : []
        },
        target () {
            return this.props.align === 'right' ? '#app-bar-actions' : '#app-bar-title'
        },
        // id of the page currently shown (vue-router meta, set by the Dashboard)
        currentPageId () {
            return this.$route && this.$route.meta ? this.$route.meta.id : undefined
        },
        // whether this header should render on the current page.
        // pages empty/undefined => all pages; otherwise only the listed page ids.
        visibleOnPage () {
            const pages = this.props.pages
            if (!Array.isArray(pages) || pages.length === 0) {
                return true
            }
            return pages.includes(this.currentPageId)
        }
    },
    created () {
        // register with Dashboard's data tracker (input + load events)
        this.$dataTracker(this.id, this.onInput, this.onLoad)
    },
    mounted () {
        // Teleport must wait until the component is fully mounted
        this.mounted = true
    },
    methods: {
        // resolve a Vuetify theme colour name to a CSS value, else pass through
        resolveColor (c) {
            if (!c) {
                return undefined
            }
            const themeColors = [
                'primary', 'secondary', 'surface', 'background',
                'error', 'info', 'success', 'warning',
                'on-primary', 'on-secondary', 'on-surface', 'on-background'
            ]
            return themeColors.includes(c) ? `rgb(var(--v-theme-${c}))` : c
        },
        // the storage key for an item. Text/Template use their configured Key;
        // Buttons/Dropdowns fall back to their Topic so they can be targeted via
        // msg.topic for dynamic updates (e.g. ui_update.icon / colour).
        itemKey (item) {
            if (item.key && item.key.length) {
                return item.key
            }
            if (item.topic && item.topic.length) {
                return item.topic
            }
            return '__default__'
        },
        // storage key for a dropdown (configured key, else stable per-index key)
        dropdownKey (item, idx) {
            return item.key && item.key.length ? item.key : `__dd_${idx}`
        },
        // resolved dynamic style overrides for an item (keyed by its key)
        itemStyle (item) {
            return this.styleMap[this.itemKey(item)] || {}
        },
        // CSS style object for text / template items
        textStyle (item) {
            const dyn = this.itemStyle(item)
            const style = {}
            const font = dyn.font != null ? dyn.font : item.font
            const fontSize = dyn.fontSize != null ? dyn.fontSize : item.fontSize
            const fontWeight = dyn.fontWeight != null ? dyn.fontWeight : item.fontWeight
            const width = dyn.width != null ? dyn.width : item.width
            const color = this.resolveColor(dyn.color != null ? dyn.color : item.color)
            if (font) {
                style['font-family'] = font
            }
            if (fontSize) {
                style['font-size'] = this.withUnit(fontSize)
            }
            if (fontWeight) {
                style['font-weight'] = fontWeight
            }
            if (width) {
                style.width = this.withUnit(width)
            }
            if (color) {
                style.color = color
            }
            if (item.align) {
                style['text-align'] = item.align
                style['justify-content'] = this.flexAlign(item.align)
                style.display = item.type === 'template' ? 'flex' : 'inline-block'
            }
            return style
        },
        // map a left/center/right value to a flexbox justify value
        flexAlign (align) {
            if (align === 'right') {
                return 'flex-end'
            }
            if (align === 'center') {
                return 'center'
            }
            return 'flex-start'
        },
        // CSS style object for buttons / dropdowns (width only)
        sizeStyle (item) {
            const dyn = this.itemStyle(item)
            const width = dyn.width != null ? dyn.width : item.width
            if (width) {
                const w = this.withUnit(width)
                return { width: w, 'min-width': w }
            }
            return {}
        },
        // button style = width + content justification (for left/center/right)
        buttonStyle (item) {
            const style = this.sizeStyle(item)
            if (item.align) {
                style['justify-content'] = this.flexAlign(item.align)
            }
            return style
        },
        // bare numbers are treated as px, otherwise pass the CSS value through
        withUnit (v) {
            return /^\d+(\.\d+)?$/.test(String(v)) ? `${v}px` : v
        },
        // raw colour for Vuetify components (theme names like "primary" are valid as-is)
        itemColor (item) {
            const dyn = this.itemStyle(item)
            return dyn.color != null ? dyn.color : item.color
        },
        // mdi icon for a button (config or dynamic), normalised to "mdi-*"
        itemIcon (item) {
            const dyn = this.itemStyle(item)
            const icon = dyn.icon != null ? dyn.icon : item.icon
            if (!icon) {
                return undefined
            }
            return /^mdi-/.test(icon) ? icon : `mdi-${icon}`
        },
        // whether the button icon sits left of the label (default) or right
        iconLeft (item) {
            return item.iconPos !== 'right'
        },
        // font styling for a button's label text
        buttonTextStyle (item) {
            const style = {}
            if (item.font) {
                style['font-family'] = item.font
            }
            if (item.fontSize) {
                style['font-size'] = this.withUnit(item.fontSize)
            }
            if (item.fontWeight) {
                style['font-weight'] = item.fontWeight
            }
            return style
        },
        // look up the current dynamic value for an item by its key (msg.topic)
        currentValue (item) {
            return this.valueMap[this.itemKey(item)]
        },
        textValue (item) {
            if (item.dynamic) {
                const v = this.currentValue(item)
                if (typeof v !== 'undefined' && v !== null) {
                    return v
                }
            }
            return item.label || ''
        },
        // render a custom HTML item, replacing {{value}} with the current dynamic value.
        // Content is authored in the Node-RED editor (trusted flow author), like ui-template.
        renderHtml (item) {
            const v = this.currentValue(item)
            const value = (typeof v !== 'undefined' && v !== null) ? String(v) : ''
            return (item.html || '').replace(/\{\{\s*value\s*\}\}/g, value)
        },
        optionList (item) {
            return (item.options || '')
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length)
                .map((line) => {
                    const idx = line.indexOf('=')
                    if (idx === -1) {
                        return { value: line, title: line }
                    }
                    return {
                        value: line.slice(0, idx).trim(),
                        title: line.slice(idx + 1).trim()
                    }
                })
        },
        onButton (item) {
            this.$socket.emit('widget-action', this.id, {
                payload: item.payload,
                topic: item.topic || ''
            })
        },
        onDropdown (item, idx, value) {
            const key = this.dropdownKey(item, idx)
            this.selectionMap = { ...this.selectionMap, [key]: value }
            // persist server-side + send onward (server custom onChange handles this)
            this.$socket.emit('widget-change', this.id, { payload: value, key })
        },
        // merge a single live update (raw msg) into our reactive maps
        applyUpdate (msg) {
            if (!msg) {
                return
            }
            const key = (msg.topic !== undefined && msg.topic !== null && msg.topic !== '')
                ? String(msg.topic)
                : '__default__'
            if (typeof msg.payload !== 'undefined') {
                this.valueMap = { ...this.valueMap, [key]: msg.payload }
            }
            const upd = msg.ui_update
            if (upd && typeof upd === 'object') {
                const next = { ...(this.styleMap[key] || {}) }
                const styleProps = ['color', 'font', 'fontSize', 'fontWeight', 'width', 'icon']
                styleProps.forEach((p) => {
                    if (typeof upd[p] !== 'undefined') {
                        next[p] = upd[p]
                    }
                })
                this.styleMap = { ...this.styleMap, [key]: next }
            }
        },
        // live message from Node-RED (msg-input) - carries a single raw msg
        onInput (msg) {
            this.applyUpdate(msg)
        },
        // (re)load from the server datastore - carries the full composite state
        onLoad (msg) {
            if (!msg || !msg.payload || typeof msg.payload !== 'object') {
                return
            }
            const p = msg.payload
            if (p.values && typeof p.values === 'object') {
                this.valueMap = { ...p.values }
            }
            if (p.styles && typeof p.styles === 'object') {
                this.styleMap = { ...p.styles }
            }
            if (p.selections && typeof p.selections === 'object') {
                this.selectionMap = { ...p.selections }
            }
        }
    }
}
</script>

<style scoped>
.nrdb-ui-header {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 8px;
    /* always keep items on a single row; if they don't fit, scroll sideways.
       never wrap and never scroll vertically. */
    flex: 1 1 0;
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    /* thin, auto-hiding horizontal scrollbar */
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
}
.nrdb-ui-header > * {
    flex-shrink: 0;
}
.nrdb-ui-header:hover {
    scrollbar-color: rgba(var(--v-theme-on-surface), 0.4) transparent;
}
.nrdb-ui-header::-webkit-scrollbar {
    height: 6px;
}
.nrdb-ui-header::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 3px;
}
.nrdb-ui-header:hover::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-on-surface), 0.4);
}
.nrdb-ui-header__text {
    font-size: 1rem;
    white-space: nowrap;
    /* inherit the dashboard theme's app-bar text colour by default */
    color: rgb(var(--v-theme-on-surface));
}
.nrdb-ui-header__template {
    display: flex;
    align-items: center;
    color: rgb(var(--v-theme-on-surface));
}
.nrdb-ui-header__dropdown {
    /* don't let Vuetify's v-input (flex:1 1 auto) stretch across the bar;
       keep a sensible default with a min width, overridable via the width setting. */
    flex: 0 0 auto;
    min-width: 100px;
    width: 140px;
}
</style>

<!-- global (non-scoped): allow the app bar teleport targets to shrink below
     their content width so our horizontal scroll can kick in. -->
<style>
#app-bar-title,
#app-bar-actions {
    min-width: 0;
    overflow: hidden;
}
</style>
