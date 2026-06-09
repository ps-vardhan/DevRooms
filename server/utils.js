const Y = require('yjs')
const syncProtocol = require('y-protocols/sync')
const awarenessProtocol = require('y-protocols/awareness')
const YjsDocument = require('./models/YjsDocument')

const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0'

const persistence = {

  bindState: async (docName, ydoc) => {
    try {
      const stored = await YjsDocument.findOne({ docName })

      if (stored && stored.state) {
        Y.applyUpdate(ydoc, new Uint8Array(stored.state))
        console.info(`[Yjs] Restored state for the doc:${docName} (${stored.state.length} bytes)`)
      } else {
        console.info(`[Yjs] No prior state found for doc: ${docName}- starting fresh`)
      }

      ydoc.on('update', async (update) => {
        try {
          const current = await YjsDocument.findOne({ docName })

          if (current) {
            const mergeDoc = new Y.Doc()
            Y.applyUpdate(mergeDoc, new Uint8Array(current.state))
            Y.applyUpdate(mergeDoc, update)
            const merged = Y.encodeStateAsUpdate(mergeDoc)
            mergeDoc.destroy()

            await YjsDocument.updateOne(
              { docName },
              { $set: { state: Buffer.from(merged) } }
            )
          } else {
            await YjsDocument.create({
              docName,
              state: Buffer.from(Y.encodeStateAsUpdate(ydoc)),
            })
          }
        } catch (err) {
          console.error(`[Yjs] Incremental update error [${docName}]:`, err.mesage)
        }
      })
    } catch (err) {
      console.error(`[Yjs] bindState error [${docName}]:`, err.message)
    }
  },

  writeState: async (docName, ydoc) => {
    try {
      const finalState = Buffer.from(Y.encodeStateAsUpdate(ydoc))
      await YjsDocument.findOneAndUpdate(
        { docName },
        { $set: { state: finalState } },
        { upsert: true }
      )
      console.info(`[Yjs] Final snapshot written for doc:${docName}(${finalState.length} bytes)`)
    } catch (err) {
      console.error(`[Yjs] writeState error [${docName}]:`, err.message)
    }
  },
}

/**
 * @type {Map<string,WSSharedDoc>}
 */
const docs = new Map()

const messageSync = 0
const messageAwareness = 1
const messageAuth = 2

/**
 * @param {Uint8Array} update
 * @param {any} origin
 * @param {WSSharedDoc} doc
 */
const updateHandler = (update, origin, doc) => {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeUpdate(encoder, update)
  const message = encoding.toUint8Array(encoder)
  doc.conns.forEach((_, conn) => send(doc, conn, message))
}

class WSSharedDoc extends Y.Doc {
  /**
   * @param {string} name
   */
  constructor(name) {
    super({ gc: gcEnabled })
    this.name = name
    /**
     * @type {Map<Object, Object>}
     */
    this.conns = new Map()
    /**
     * @type {awarenessProtocol.Awareness}
     */
    this.awareness = new awarenessProtocol.Awareness(this)
    this.awareness.setLocalState(null)
    /**
     * @param {any} _
     * @param {any} origin
     */
    const awarenessChangeHandler = ({ added, updated, removed }, origin) => {
      const changedClients = added.concat(updated, removed)
      if (origin !== null) {
        const conn = origin
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, messageAwareness)
        encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients))
        const buff = encoding.toUint8Array(encoder)
        this.conns.forEach((_, c) => {
          send(this, c, buff)
        })
      }
    }
    this.awareness.on('update', awarenessChangeHandler)
    this.on('update', updateHandler)
  }
}

const encoding = require('lib0/encoding')
const decoding = require('lib0/decoding')
const map = require('lib0/map')

const send = (doc, conn, m) => {
  if (conn.readyState !== 1 || !doc.conns.has(conn)) {
    closeConn(doc, conn)
  }
  try {
    conn.send(m, err => { if (err != null) closeConn(doc, conn) })
  } catch (e) {
    closeConn(doc, conn)
  }
}

const closeConn = (doc, conn) => {
  if (doc.conns.has(conn)) {
    /**
     * @type {Set<number>}
     */
    const controlledIds = doc.conns.get(conn)
    doc.conns.delete(conn)
    awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null)
    if (doc.conns.size === 0 && persistence !== null) {
      // if persisted, we deconstruct the doc
      persistence.writeState(doc.name, doc).then(() => {
        doc.destroy()
      })
      docs.delete(doc.name)
    }
  }
  conn.close()
}
/**
 * Gets a Y.Doc by name, creating it if it doesn't exist.
 * @param {string} docname
 * @param {boolean} [gc=true]
 * @return {WSSharedDoc}
 */
const getYDoc = (docname, gc = true) => {
  return map.setIfUndefined(docs, docname, () => {
    const doc = new WSSharedDoc(docname)
    doc.gc = gc
    if (persistence !== null) {
      persistence.bindState(docname, doc)
    }
    docs.set(docname, doc)
    return doc
  })
}

/**
 * @param {any} conn
 * @param {any} req
 * @param {any} opts
 */
exports.setupWSConnection = (conn, req, { docName = req.url.slice(1).split('?')[0], gc = true } = {}) => {
  conn.binaryType = 'arraybuffer'
  // getting the doc
  const doc = getYDoc(docName, gc)
  doc.conns.set(conn, new Set())
  // listen and reply to events
  conn.on('message', /** @param {ArrayBuffer} message */ message => {
    message = new Uint8Array(message)
    const encoder = encoding.createEncoder()
    const decoder = decoding.createDecoder(message)
    const messageType = decoding.readVarUint(decoder)
    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync)
        syncProtocol.readSyncMessage(decoder, encoder, doc, null)
        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder))
        }
        break
      case messageAwareness:
        awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn)
        break
    }
  })

  // Check if connection is alive
  let pongReceived = true
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, conn)
      }
      clearInterval(pingInterval)
    } else {
      pongReceived = false
      try {
        conn.ping()
      } catch (e) {
        closeConn(doc, conn)
        clearInterval(pingInterval)
      }
    }
  }, 30000)
  conn.on('close', () => {
    closeConn(doc, conn)
    clearInterval(pingInterval)
  })
  conn.on('pong', () => {
    pongReceived = true
  })
  // put the following in a variables in a separate function
  {
    // send sync step 1
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageSync)
    syncProtocol.writeSyncStep1(encoder, doc)
    send(doc, conn, encoding.toUint8Array(encoder))
    const awarenessStates = doc.awareness.getStates()
    if (awarenessStates.size > 0) {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageAwareness)
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())))
      send(doc, conn, encoding.toUint8Array(encoder))
    }
  }
}

