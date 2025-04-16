const EducationalContent = require('../models/EducationalContent');

// Get all educational content
exports.getContent = async (req, res) => {
  try {
    // Fetch all educational content from the database
    const content = await EducationalContent.find();

    if (!content) {
      return res.status(404).json({ message: 'No content found' });
    }

    // Send the content back in the response
    res.status(200).json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

