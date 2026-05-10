const mongoose = require("mongoose");

const schemaInfoSchema = new mongoose.Schema({
  version: { type: String },
  load_date_time: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.SchemaInfo || mongoose.model("SchemaInfo", schemaInfoSchema);
