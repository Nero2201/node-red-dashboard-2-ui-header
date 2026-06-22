module.exports = function (RED) {
    function UIHeaderNode (config) {
        RED.nodes.createNode(this, config)

        const node = this

        // The ui-header is "ui-base scoped" (no group / no page).
        // That makes Dashboard render it globally, on EVERY page (handled by
        // the Baseline layout's uiWidgets), which is what we want for a header.
        const ui = RED.nodes.getNode(config.ui)

        // make sure items is always an array
        config.items = Array.isArray(config.items) ? config.items : []

        // style/update properties that can be set dynamically per item via msg.ui_update
        const STYLE_PROPS = ['color', 'font', 'fontSize', 'fontWeight', 'width', 'icon']

        // read the composite state object we persist in the datastore
        function getState () {
            const stored = (ui && ui.stores.data.get(node.id)) || {}
            const p = (stored.payload && typeof stored.payload === 'object') ? stored.payload : {}
            return {
                values: { ...(p.values || {}) },
                styles: { ...(p.styles || {}) },
                selections: { ...(p.selections || {}) }
            }
        }

        const evts = {
            // allow this node to emit messages when a header button is clicked
            onAction: true,
            // dropdown changes arrive via widget-change - persist them per key
            onChange: function (msg, value) {
                if (!ui) {
                    return
                }
                const state = getState()
                let key = '__default__'
                let payload = value
                if (value && typeof value === 'object') {
                    if (value.key !== undefined && value.key !== null && value.key !== '') {
                        key = String(value.key)
                    }
                    payload = value.payload
                }
                state.selections[key] = payload
                ui.stores.data.save(ui, node, { payload: state })
                // forward a clean message into the flow
                node.send({ payload, topic: key.startsWith('__') ? '' : key })
            },
            // Maintain key -> payload (by msg.topic) so individual text/template items
            // can be targeted, plus a parallel per-key style map for dynamic styling via
            // msg.ui_update.{color,font,fontSize,fontWeight,width,icon}. Everything is kept
            // in a single composite payload object so it survives a client refresh.
            onInput: function (msg, send, done) {
                if (ui) {
                    const state = getState()
                    const key = (msg.topic !== undefined && msg.topic !== null && msg.topic !== '')
                        ? String(msg.topic)
                        : '__default__'

                    if (msg.payload !== undefined) {
                        state.values[key] = msg.payload
                    }

                    const update = msg.ui_update
                    if (update && typeof update === 'object') {
                        const next = { ...(state.styles[key] || {}) }
                        STYLE_PROPS.forEach((p) => {
                            if (typeof update[p] !== 'undefined') {
                                next[p] = update[p]
                            }
                        })
                        state.styles[key] = next
                    }

                    // persist composite state; the raw msg is still emitted live to clients
                    ui.stores.data.save(ui, node, { payload: state })
                }
                send(msg)
                done && done()
            }
        }

        if (ui) {
            // register against the ui-base (page = null, group = null)
            ui.register(null, null, node, config, evts)
        } else {
            node.error('ui-header: no ui-base (Dashboard) configured')
        }
    }

    RED.nodes.registerType('ui-header', UIHeaderNode)
}
