const mongoose = require("mongoose");

const YjsDocumentSchema = new mongoose.Schema(
    {
        docName: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        state: {
            type: Buffer,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("YjsDocument", YjsDocumentSchema);