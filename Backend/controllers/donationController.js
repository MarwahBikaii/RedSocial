// controllers/donationController.js
exports.recordDonation = async (req, res) => {
  const { donorId, requestId, units } = req.body;

  try {
    const donor = await User.findById(donorId);
    const request = await DonationRequest.findById(requestId);

    // Validate donation frequency (e.g., every 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    if (donor.lastDonationDate && donor.lastDonationDate > threeMonthsAgo) {
      return res.status(400).json({
        error: "Donor must wait 3 months between donations."
      });
    }

    // Validate units (e.g., 0.5–2 units per session)
    if (units < 0.5 || units > 2) {
      return res.status(400).json({
        error: "Invalid units. Must donate between 0.5 and 2 units per session."
      });
    }

    // Create donation record
    const donation = new Donation({
      donorId,
      requestId,
      units,
      bloodType: donor.bloodType
    });
    await donation.save();

    // Update donor stats
    donor.totalDonatedUnits += units;
    donor.lastDonationDate = new Date();
    donor.donationHistory.push(donation._id);
    await donor.save();

    // Update request status
    request.fulfilledUnits += units;
    if (request.fulfilledUnits >= request.requestedUnits) {
      request.status = 'Fulfilled';
    } else if (request.fulfilledUnits > 0) {
      request.status = 'Partially Fulfilled';
    }
    await request.save();

    res.status(200).json({ donation, donor, request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};