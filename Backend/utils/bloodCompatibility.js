// utils/bloodCompatibility.js
const bloodTypeCompatibility = {
  // Donor: [Recipient Types]
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'], // Only compatible with AB types
  'AB+': ['AB+'] // Only compatible with AB+
};

exports.isBloodTypeCompatible = (donorType, recipientType) => {
  // Handle case where types might be undefined or null
  if (!donorType || !recipientType) return false;
  
  // Normalize blood types (remove whitespace, make uppercase)
  const normalizedDonor = donorType.toString().trim().toUpperCase();
  const normalizedRecipient = recipientType.toString().trim().toUpperCase();
  
  // Check if blood types are valid
  if (!bloodTypeCompatibility[normalizedDonor] || !bloodTypeCompatibility[normalizedRecipient]) {
    return false;
  }
  
  // Check compatibility
  return bloodTypeCompatibility[normalizedDonor].includes(normalizedRecipient);
};

// Additional helper function
exports.getCompatibleTypes = (bloodType) => {
  return bloodTypeCompatibility[bloodType] || [];
};