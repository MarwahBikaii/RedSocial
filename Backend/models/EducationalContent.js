
// models/EducationalContent.js
const EducationalContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('EducationalContent', EducationalContentSchema);
