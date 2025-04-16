const mongoose = require('mongoose');

const EducationalContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, required: false }, // Image URL or path
  likes: { type: Number, default: 0 }, // Track the number of likes
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the User model
      commentText: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  tags: { type: [String], required: false }, // Tags or categories for the content
}, { timestamps: true });

module.exports = mongoose.model('EducationalContent', EducationalContentSchema);
